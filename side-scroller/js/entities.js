// =============================================================================
// ENTITIES — Enemies, collectibles, moving platforms
// =============================================================================

import { CONFIG } from './config.js';
import { resolveEntityTileCollisions, aabbOverlap } from './physics.js';

// =============================================================================
// GOOMBA — Basic patrol enemy, killed by stomping
// =============================================================================
export class Goomba {
  constructor(x, y) {
    const cfg = CONFIG.enemies.goomba;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.vx = -cfg.speed;
    this.vy = 0;
    this.alive = true;
    this.squishTimer = 0; // show squished sprite briefly
    this.type = 'goomba';
  }

  update(level) {
    if (!this.alive) {
      this.squishTimer--;
      return this.squishTimer > 0;
    }

    this.vy += CONFIG.player.gravity;
    if (this.vy > CONFIG.player.maxFallSpeed) this.vy = CONFIG.player.maxFallSpeed;

    const collisions = resolveEntityTileCollisions(this, level);

    if (collisions.left || collisions.right) {
      this.vx = -this.vx;
    }
    if (collisions.bottom) {
      this.vy = 0;
    }

    // Fall off world
    const levelHeight = level.tiles.length * CONFIG.tile.size;
    if (this.y > levelHeight + 100) return false;

    return true;
  }

  stomp() {
    this.alive = false;
    this.squishTimer = 30;
    this.vx = 0;
  }

  checkPlayerCollision(player) {
    if (!this.alive) return;
    if (player.invincibleTimer > 0) return;
    if (!aabbOverlap(this, player)) return;

    // Check if player is stomping (falling onto enemy from above)
    const playerBottom = player.y + player.height;
    const enemyMidY = this.y + this.height * 0.4;

    if (player.vy > 0 && playerBottom < enemyMidY + player.vy + 2) {
      this.stomp();
      player.bounce(CONFIG.enemies.goomba.bounceVelocity);
      player.addScore(CONFIG.scoring.enemyStomp);
    } else {
      player.takeDamage();
    }
  }

  draw(ctx, theme) {
    const colors = theme.enemies.goomba;
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (!this.alive) {
      // Squished
      ctx.fillStyle = colors.bodyColor;
      ctx.fillRect(x, y + this.height - 6, this.width, 6);
      return;
    }

    // Body
    ctx.fillStyle = colors.bodyColor;
    ctx.fillRect(x + 2, y + this.height * 0.35, this.width - 4, this.height * 0.65);

    // Head
    ctx.fillStyle = colors.headColor;
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height * 0.35, this.width / 2 - 1, Math.PI, 0);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 6, y + this.height * 0.2, 5, 5);
    ctx.fillRect(x + this.width - 11, y + this.height * 0.2, 5, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + this.height * 0.22, 2, 3);
    ctx.fillRect(x + this.width - 9, y + this.height * 0.22, 2, 3);

    // Feet
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y + this.height - 4, 8, 4);
    ctx.fillRect(x + this.width - 8, y + this.height - 4, 8, 4);
  }
}

// =============================================================================
// COIN — Collectible
// =============================================================================
export class Coin {
  constructor(x, y) {
    const cfg = CONFIG.collectibles.coin;
    this.x = x + (CONFIG.tile.size - cfg.width) / 2;
    this.y = y + (CONFIG.tile.size - cfg.height) / 2;
    this.width = cfg.width;
    this.height = cfg.height;
    this.baseY = this.y;
    this.collected = false;
    this.timer = 0;
    this.type = 'coin';
  }

  update() {
    if (this.collected) return false;
    this.timer++;
    const cfg = CONFIG.collectibles.coin;
    this.y = this.baseY + Math.sin(this.timer * cfg.bobSpeed) * cfg.bobAmplitude;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.collected) return;
    if (!aabbOverlap(this, player)) return;

    this.collected = true;
    player.coins++;
    player.addScore(CONFIG.collectibles.coin.points);
    player.onCollectCoin?.();
  }

  draw(ctx, theme) {
    if (this.collected) return;
    const colors = theme.coin;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    // Coin body
    ctx.fillStyle = colors.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner sparkle
    ctx.fillStyle = colors.sparkle;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 4, this.height / 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// MOVING PLATFORM
// =============================================================================
export class MovingPlatform {
  constructor(x, y, width, rangeX = 0, rangeY = 0, speed = CONFIG.movingPlatform.defaultSpeed) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = width;
    this.height = 8;
    this.rangeX = rangeX;
    this.rangeY = rangeY;
    this.speed = speed;
    this.vx = 0;
    this.vy = 0;
    this.timer = 0;
    this.type = 'platform';
  }

  update() {
    this.timer += this.speed * 0.02;
    const prevX = this.x;
    const prevY = this.y;

    if (this.rangeX > 0) {
      this.x = this.startX + Math.sin(this.timer) * this.rangeX;
    }
    if (this.rangeY > 0) {
      this.y = this.startY + Math.sin(this.timer) * this.rangeY;
    }

    this.vx = this.x - prevX;
    this.vy = this.y - prevY;
    return true;
  }

  checkPlayerCollision(player) {
    // Only support from above
    const playerBottom = player.y + player.height;
    const onTop = (
      playerBottom >= this.y - 2 &&
      playerBottom <= this.y + 6 &&
      player.x + player.width > this.x + 2 &&
      player.x < this.x + this.width - 2 &&
      player.vy >= 0
    );

    if (onTop) {
      player.y = this.y - player.height;
      player.vy = 0;
      player.onGround = true;
      player.hasDoubleJumped = false;
      player.isJumping = false;
      // Carry the player
      player.x += this.vx;
    }
  }

  draw(ctx) {
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, this.height);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.width, 3);
  }
}

// =============================================================================
// PARTICLE — Simple visual effects
// =============================================================================
export class Particle {
  constructor(x, y, vx, vy, color, life = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life--;
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    ctx.globalAlpha = 1;
  }
}
