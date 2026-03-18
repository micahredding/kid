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
// FLYGUY — Flying enemy that bobs up and down while patrolling
// =============================================================================
export class Flyguy {
  constructor(x, y) {
    const cfg = CONFIG.enemies.flyguy;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.vx = -cfg.speed;
    this.vy = 0;
    this.baseY = y;
    this.alive = true;
    this.squishTimer = 0;
    this.timer = 0;
    this.type = 'flyguy';
  }

  update(level) {
    if (!this.alive) {
      // Fall when dead
      this.vy += CONFIG.player.gravity;
      this.y += this.vy;
      this.squishTimer--;
      return this.squishTimer > 0 && this.y < level.tiles.length * CONFIG.tile.size + 100;
    }

    this.timer++;
    this.x += this.vx;
    const cfg = CONFIG.enemies.flyguy;
    this.y = this.baseY + Math.sin(this.timer * cfg.verticalSpeed) * cfg.verticalRange;

    // Reverse at level edges or walls (simple boundary check)
    const ts = CONFIG.tile.size;
    const col = Math.floor((this.x + (this.vx > 0 ? this.width : 0)) / ts);
    const row = Math.floor((this.y + this.height / 2) / ts);
    if (row >= 0 && row < level.tiles.length && col >= 0 && col < level.tiles[row].length) {
      const ch = level.tiles[row][col];
      if (ch && ch !== ' ' && ch !== 'I') {
        this.vx = -this.vx;
      }
    }
    if (this.x < 0 || this.x + this.width > level.tiles[0].length * ts) {
      this.vx = -this.vx;
    }

    return true;
  }

  stomp() {
    this.alive = false;
    this.squishTimer = 40;
    this.vx = 0;
    this.vy = -3;
  }

  checkPlayerCollision(player) {
    if (!this.alive) return;
    if (player.invincibleTimer > 0) return;
    if (!aabbOverlap(this, player)) return;

    const playerBottom = player.y + player.height;
    const enemyMidY = this.y + this.height * 0.4;

    if (player.vy > 0 && playerBottom < enemyMidY + player.vy + 2) {
      this.stomp();
      player.bounce(CONFIG.enemies.flyguy.bounceVelocity);
      player.addScore(CONFIG.scoring.enemyStomp);
    } else {
      player.takeDamage();
    }
  }

  draw(ctx, theme) {
    const colors = theme.enemies.flyguy || { bodyColor: '#CC4444', wingColor: '#FFFFFF' };
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (!this.alive) {
      // Falling dead
      ctx.fillStyle = colors.bodyColor;
      ctx.fillRect(x + 4, y + 4, this.width - 8, this.height - 8);
      return;
    }

    // Wings
    ctx.fillStyle = colors.wingColor;
    const wingFlap = Math.sin(this.timer * 0.3) * 6;
    ctx.beginPath();
    ctx.ellipse(x - 2, y + this.height * 0.3 - wingFlap, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + this.width + 2, y + this.height * 0.3 + wingFlap, 8, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = colors.bodyColor;
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 6, y + this.height * 0.25, 5, 5);
    ctx.fillRect(x + this.width - 11, y + this.height * 0.25, 5, 5);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + this.height * 0.28, 2, 3);
    ctx.fillRect(x + this.width - 9, y + this.height * 0.28, 2, 3);
  }
}

// =============================================================================
// SPIKER — Spiky enemy that can't be stomped, must be avoided
// =============================================================================
export class Spiker {
  constructor(x, y) {
    const cfg = CONFIG.enemies.spiker;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.vx = -cfg.speed;
    this.vy = 0;
    this.alive = true;
    this.type = 'spiker';
  }

  update(level) {
    if (!this.alive) return false;

    this.vy += CONFIG.player.gravity;
    if (this.vy > CONFIG.player.maxFallSpeed) this.vy = CONFIG.player.maxFallSpeed;

    const collisions = resolveEntityTileCollisions(this, level);

    if (collisions.left || collisions.right) {
      this.vx = -this.vx;
    }
    if (collisions.bottom) {
      this.vy = 0;
    }

    const levelHeight = level.tiles.length * CONFIG.tile.size;
    if (this.y > levelHeight + 100) return false;

    return true;
  }

  checkPlayerCollision(player) {
    if (!this.alive) return;
    if (player.invincibleTimer > 0) return;
    if (!aabbOverlap(this, player)) return;

    // Can't be stomped — always damages player
    player.takeDamage();
  }

  draw(ctx, theme) {
    const colors = theme.enemies.spiker || { bodyColor: '#666666', spikeColor: '#CCCCCC' };
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;

    // Spikes
    ctx.fillStyle = colors.spikeColor;
    const spikeCount = 5;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 - Math.PI / 2;
      const sx = cx + Math.cos(angle) * (this.width / 2 + 4);
      const sy = y + this.height / 2 + Math.sin(angle) * (this.height / 2 + 4);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 3, sy - 3);
      ctx.lineTo(sx + 3, sy - 3);
      ctx.fill();
    }

    // Body
    ctx.fillStyle = colors.bodyColor;
    ctx.beginPath();
    ctx.arc(cx, y + this.height / 2, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyes
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x + 7, y + this.height * 0.3, 5, 4);
    ctx.fillRect(x + this.width - 12, y + this.height * 0.3, 5, 4);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + this.height * 0.32, 3, 2);
    ctx.fillRect(x + this.width - 11, y + this.height * 0.32, 3, 2);
  }
}

// =============================================================================
// PUSHBLOCK — Pushable block that can be used as stairs/platforms
// =============================================================================
export class PushBlock {
  constructor(x, y) {
    const cfg = CONFIG.pushBlock;
    this.x = x;
    this.y = y;
    this.width = cfg.width;
    this.height = cfg.height;
    this.vx = 0;
    this.vy = 0;
    this.carried = false;
    this.type = 'pushblock';
  }

  update(level) {
    // Skip physics while being carried
    if (this.carried) return true;

    // Gravity
    this.vy += CONFIG.player.gravity;
    if (this.vy > CONFIG.player.maxFallSpeed) this.vy = CONFIG.player.maxFallSpeed;

    const collisions = resolveEntityTileCollisions(this, level);

    if (collisions.bottom) {
      this.vy = 0;
    }
    if (collisions.left || collisions.right) {
      this.vx = 0;
    }

    // Friction — slow down horizontal movement
    this.vx *= 0.7;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;

    const levelHeight = level.tiles.length * CONFIG.tile.size;
    if (this.y > levelHeight + 100) return false;

    return true;
  }

  // Check for block-on-block stacking
  checkBlockCollision(otherBlock) {
    if (this.carried || otherBlock.carried) return;
    if (!aabbOverlap(this, otherBlock)) return;

    // Only stack from above (this block landing on other block)
    if (this.vy > 0) {
      const thisBottom = this.y + this.height;
      const otherTop = otherBlock.y;
      if (thisBottom <= otherTop + 8 && thisBottom >= otherTop - 2) {
        this.y = otherTop - this.height;
        this.vy = 0;
      }
    }
  }

  checkPlayerCollision(player) {
    if (this.carried) return;
    if (!aabbOverlap(this, player)) return;

    const playerBottom = player.y + player.height;
    const blockTop = this.y;
    const playerRight = player.x + player.width;
    const playerLeft = player.x;

    // Player standing on top
    if (player.vy >= 0 && playerBottom <= blockTop + 8 && playerBottom >= blockTop - 2) {
      player.y = blockTop - player.height;
      player.vy = 0;
      player.onGround = true;
      player.hasDoubleJumped = false;
      player.isJumping = false;
      return;
    }

    // Push from the side
    const pushSpeed = CONFIG.pushBlock.pushSpeed;
    const overlapLeft = playerRight - this.x;
    const overlapRight = (this.x + this.width) - playerLeft;

    if (overlapLeft < overlapRight) {
      if (player.vx > 0) {
        this.vx = pushSpeed;
        player.x = this.x - player.width;
      }
    } else {
      if (player.vx < 0) {
        this.vx = -pushSpeed;
        player.x = this.x + this.width;
      }
    }
  }

  draw(ctx, theme) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const tileDef = theme.tiles['D'] || { color: '#AA8855', topColor: '#BBAA77' };

    // Block body
    ctx.fillStyle = tileDef.color;
    ctx.fillRect(x, y, this.width, this.height);

    // Top highlight
    ctx.fillStyle = tileDef.topColor;
    ctx.fillRect(x, y, this.width, 4);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.strokeRect(x, y, this.width, this.height);

    // Arrow indicators (shows it's pushable)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    // Left arrow
    ctx.beginPath();
    ctx.moveTo(x + 5, y + this.height / 2);
    ctx.lineTo(x + 10, y + this.height / 2 - 4);
    ctx.lineTo(x + 10, y + this.height / 2 + 4);
    ctx.fill();
    // Right arrow
    ctx.beginPath();
    ctx.moveTo(x + this.width - 5, y + this.height / 2);
    ctx.lineTo(x + this.width - 10, y + this.height / 2 - 4);
    ctx.lineTo(x + this.width - 10, y + this.height / 2 + 4);
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
