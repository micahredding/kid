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
// FOOD — Collectible food item (apple by default)
// =============================================================================
export class Food {
  constructor(x, y, foodType = 'apple') {
    const cfg = CONFIG.collectibles.food;
    this.x = x + (CONFIG.tile.size - cfg.width) / 2;
    this.y = y + (CONFIG.tile.size - cfg.height) / 2;
    this.width = cfg.width;
    this.height = cfg.height;
    this.baseY = this.y;
    this.collected = false;
    this.timer = 0;
    this.type = 'food';
    this.foodType = foodType; // 'apple', 'cherry', 'banana'
  }

  update() {
    if (this.collected) return false;
    this.timer++;
    const cfg = CONFIG.collectibles.food;
    this.y = this.baseY + Math.sin(this.timer * cfg.bobSpeed) * cfg.bobAmplitude;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.collected) return;
    if (!aabbOverlap(this, player)) return;
    this.collected = true;
    if (!player.foods) player.foods = [];
    player.foods.push(this.foodType);
    player.addScore(CONFIG.collectibles.food.points);
  }

  draw(ctx, theme) {
    if (this.collected) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    if (this.foodType === 'cherry') {
      // Two small red circles with stems
      ctx.fillStyle = '#CC0000';
      ctx.beginPath();
      ctx.arc(cx - 4, cy + 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#228B22';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 3);
      ctx.quadraticCurveTo(cx, cy - 10, cx + 2, cy - 8);
      ctx.moveTo(cx + 4, cy - 3);
      ctx.quadraticCurveTo(cx + 2, cy - 10, cx, cy - 9);
      ctx.stroke();
    } else if (this.foodType === 'banana') {
      // Yellow curved shape
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0.3, Math.PI - 0.3);
      ctx.arc(cx, cy + 2, 6, Math.PI - 0.3, 0.3, true);
      ctx.fill();
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Apple (default)
      ctx.fillStyle = '#FF2222';
      ctx.beginPath();
      ctx.arc(cx, cy + 1, 8, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx + 1, cy - 10);
      ctx.stroke();
      // Leaf
      ctx.fillStyle = '#228B22';
      ctx.beginPath();
      ctx.ellipse(cx + 3, cy - 8, 4, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// =============================================================================
// KEY — Collectible key for unlocking doors
// =============================================================================
export class Key {
  constructor(x, y, keyColor = 'gold') {
    const cfg = CONFIG.collectibles.key;
    this.x = x + (CONFIG.tile.size - cfg.width) / 2;
    this.y = y + (CONFIG.tile.size - cfg.height) / 2;
    this.width = cfg.width;
    this.height = cfg.height;
    this.baseY = this.y;
    this.collected = false;
    this.timer = 0;
    this.type = 'key';
    this.keyColor = keyColor; // 'gold', 'silver', 'red'
  }

  update() {
    if (this.collected) return false;
    this.timer++;
    const cfg = CONFIG.collectibles.key;
    this.y = this.baseY + Math.sin(this.timer * cfg.bobSpeed) * cfg.bobAmplitude;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.collected) return;
    if (!aabbOverlap(this, player)) return;
    this.collected = true;
    if (!player.keys) player.keys = [];
    player.keys.push(this.keyColor);
    player.addScore(CONFIG.collectibles.key.points);
  }

  draw(ctx, theme) {
    if (this.collected) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;

    const colors = {
      gold: { body: '#FFD700', dark: '#DAA520' },
      silver: { body: '#C0C0C0', dark: '#888888' },
      red: { body: '#FF4444', dark: '#CC2222' },
    };
    const c = colors[this.keyColor] || colors.gold;

    // Key head (circle)
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(cx, y + 7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Key hole
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.arc(cx, y + 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Key shaft
    ctx.fillStyle = c.body;
    ctx.fillRect(cx - 2, y + 12, 4, 10);

    // Key teeth
    ctx.fillRect(cx + 1, y + 16, 4, 2);
    ctx.fillRect(cx + 1, y + 20, 3, 2);

    // Shimmer
    const shimmer = Math.sin(this.timer * 0.1) * 0.3 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${shimmer})`;
    ctx.beginPath();
    ctx.arc(cx - 2, y + 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// GEM — Valuable collectible
// =============================================================================
export class Gem {
  constructor(x, y, gemColor = 'blue') {
    const cfg = CONFIG.collectibles.gem;
    this.x = x + (CONFIG.tile.size - cfg.width) / 2;
    this.y = y + (CONFIG.tile.size - cfg.height) / 2;
    this.width = cfg.width;
    this.height = cfg.height;
    this.baseY = this.y;
    this.collected = false;
    this.timer = 0;
    this.type = 'gem';
    this.gemColor = gemColor; // 'blue', 'red', 'green'
  }

  update() {
    if (this.collected) return false;
    this.timer++;
    const cfg = CONFIG.collectibles.gem;
    this.y = this.baseY + Math.sin(this.timer * cfg.bobSpeed) * cfg.bobAmplitude;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.collected) return;
    if (!aabbOverlap(this, player)) return;
    this.collected = true;
    player.gems = (player.gems || 0) + 1;
    player.addScore(CONFIG.collectibles.gem.points);
  }

  draw(ctx, theme) {
    if (this.collected) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    const colors = {
      blue: { body: '#4488FF', light: '#88BBFF', dark: '#2255CC' },
      red: { body: '#FF4444', light: '#FF8888', dark: '#CC2222' },
      green: { body: '#44CC44', light: '#88FF88', dark: '#228822' },
    };
    const c = colors[this.gemColor] || colors.blue;

    // Diamond shape
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);      // top
    ctx.lineTo(cx + 8, cy);       // right
    ctx.lineTo(cx, cy + 9);      // bottom
    ctx.lineTo(cx - 8, cy);       // left
    ctx.closePath();
    ctx.fill();

    // Left facet (darker)
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx - 8, cy);
    ctx.lineTo(cx, cy + 9);
    ctx.closePath();
    ctx.fill();

    // Top highlight
    ctx.fillStyle = c.light;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy - 2);
    ctx.closePath();
    ctx.fill();

    // Sparkle
    const sparkle = Math.sin(this.timer * 0.12) * 0.4 + 0.4;
    ctx.fillStyle = `rgba(255,255,255,${sparkle})`;
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 3, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// DOOR — Locked door that requires a specific key color
// =============================================================================
export class Door {
  constructor(x, y, keyColor = 'gold') {
    this.x = x;
    this.y = y;
    this.width = CONFIG.tile.size;
    this.height = CONFIG.tile.size * 2;
    this.y = y - CONFIG.tile.size; // door is 2 tiles tall, placed from bottom
    this.keyColor = keyColor;
    this.opened = false;
    this.type = 'door';
  }

  update() {
    return !this.opened;
  }

  checkPlayerCollision(player) {
    if (this.opened) return;
    if (!aabbOverlap(this, player)) return;

    // Check if player has the right key
    if (player.keys && player.keys.includes(this.keyColor)) {
      this.opened = true;
      // Remove the key from inventory
      const idx = player.keys.indexOf(this.keyColor);
      player.keys.splice(idx, 1);
      player.addScore(300);
    } else {
      // Block the player — push them out
      const playerCenterX = player.x + player.width / 2;
      const doorCenterX = this.x + this.width / 2;
      if (playerCenterX < doorCenterX) {
        player.x = this.x - player.width;
      } else {
        player.x = this.x + this.width;
      }
      player.vx = 0;
    }
  }

  draw(ctx, theme) {
    if (this.opened) return;
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    const colors = {
      gold: { body: '#8B6914', frame: '#DAA520', lock: '#FFD700' },
      silver: { body: '#666666', frame: '#999999', lock: '#C0C0C0' },
      red: { body: '#8B2222', frame: '#CC4444', lock: '#FF4444' },
    };
    const c = colors[this.keyColor] || colors.gold;

    // Door frame
    ctx.fillStyle = c.frame;
    ctx.fillRect(x - 2, y, this.width + 4, this.height + 2);

    // Door body
    ctx.fillStyle = c.body;
    ctx.fillRect(x + 2, y + 2, this.width - 4, this.height - 2);

    // Panels
    ctx.strokeStyle = c.frame;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 5, y + 5, this.width - 10, this.height * 0.4);
    ctx.strokeRect(x + 5, y + this.height * 0.5, this.width - 10, this.height * 0.4);

    // Lock/keyhole
    ctx.fillStyle = c.lock;
    ctx.beginPath();
    ctx.arc(x + this.width - 8, y + this.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + this.width - 8, y + this.height / 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + this.width - 9, y + this.height / 2 + 1, 3, 4);
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
