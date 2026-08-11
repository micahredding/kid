// =============================================================================
// ENTITIES — Whoville creatures, presents, gift houses, moving platforms.
//
// Behavior classes keep their engine names (Goomba, Flyguy, Spiker) so the
// physics and tests stay identical — only their look is Whoville: mice,
// who-birds, and frost-lumps. Nothing here dies; stomped critters flop over
// dazed and scurry off.
// =============================================================================

import { CONFIG } from './config.js';
import { resolveEntityTileCollisions, aabbOverlap } from './physics.js';
import { drawPresent } from './characters.js';

// =============================================================================
// GOOMBA → MOUSE — "...not even a mouse." Patrols; bopped by stomping.
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
    this.squishTimer = 0;
    this.timer = 0;
    this.type = 'goomba';
  }

  update(level) {
    this.timer++;
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
    const w = this.width;
    const h = this.height;
    const facing = Math.sign(this.vx) || -1;

    if (!this.alive) {
      // dazed flat mouse, tail still curled
      ctx.fillStyle = colors.bodyColor;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 4, w / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.bodyColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - facing * w / 2, y + h - 4);
      ctx.quadraticCurveTo(x + w / 2 - facing * (w / 2 + 8), y + h - 12, x + w / 2 - facing * (w / 2 + 4), y + h - 14);
      ctx.stroke();
      return;
    }

    const scurry = Math.sin(this.timer * 0.4) * 1.5;

    // tail — long curl behind
    ctx.strokeStyle = '#c8a0a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tailBaseX = x + w / 2 - facing * (w / 2 - 3);
    ctx.moveTo(tailBaseX, y + h - 6);
    ctx.quadraticCurveTo(
      tailBaseX - facing * 10, y + h - 10 + scurry,
      tailBaseX - facing * 13, y + h - 18 - scurry
    );
    ctx.stroke();

    // body — teardrop pointing in run direction
    ctx.fillStyle = colors.bodyColor;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 9, w / 2 - 2, h / 2 - 6 + Math.abs(scurry) * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // head
    const hx = x + w / 2 + facing * (w / 2 - 8);
    const hy = y + h - 14;
    ctx.fillStyle = colors.headColor;
    ctx.beginPath();
    ctx.arc(hx, hy, 7, 0, Math.PI * 2);
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.moveTo(hx, hy + 2);
    ctx.lineTo(hx + facing * 8, hy + 3);
    ctx.lineTo(hx, hy + 6);
    ctx.closePath();
    ctx.fill();
    // nose
    ctx.fillStyle = colors.noseColor;
    ctx.beginPath();
    ctx.arc(hx + facing * 8, hy + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // round ears
    ctx.fillStyle = colors.headColor;
    ctx.beginPath();
    ctx.arc(hx - facing * 2, hy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.noseColor;
    ctx.beginPath();
    ctx.arc(hx - facing * 2, hy - 6, 2, 0, Math.PI * 2);
    ctx.fill();

    // eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(hx + facing * 3, hy - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // scurrying feet
    ctx.strokeStyle = colors.headColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + h);
    ctx.lineTo(x + 8 + scurry * 2, y + h - 4);
    ctx.moveTo(x + w - 8, y + h);
    ctx.lineTo(x + w - 8 - scurry * 2, y + h - 4);
    ctx.stroke();
  }
}

// =============================================================================
// PRESENT — the collectible (replaces coins). Wrap color varies per present.
// =============================================================================
export class Present {
  constructor(x, y) {
    const cfg = CONFIG.collectibles.present;
    this.x = x + (CONFIG.tile.size - cfg.width) / 2;
    this.y = y + (CONFIG.tile.size - cfg.height) / 2;
    this.width = cfg.width;
    this.height = cfg.height;
    this.baseY = this.y;
    this.collected = false;
    this.timer = 0;
    this.wrapIndex = (Math.floor(x / CONFIG.tile.size) * 7 + Math.floor(y / CONFIG.tile.size) * 3) % 4;
    this.type = 'present';
  }

  update() {
    if (this.collected) return false;
    this.timer++;
    const cfg = CONFIG.collectibles.present;
    this.y = this.baseY + Math.sin(this.timer * cfg.bobSpeed) * cfg.bobAmplitude;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.collected) return;
    if (!aabbOverlap(this, player)) return;

    this.collected = true;
    player.presents++;
    player.addScore(CONFIG.collectibles.present.points);
    player.celebrate?.();
    player.onCollectPresent?.(this);
  }

  draw(ctx, theme) {
    if (this.collected) return;
    const wraps = theme.coin.wraps;
    const wrap = wraps[this.wrapIndex % wraps.length];
    drawPresent(ctx, Math.round(this.x), Math.round(this.y), this.width, this.height, wrap, theme.coin.ribbon);
    // twinkle
    const tw = Math.sin(this.timer * 0.1) * 0.35 + 0.35;
    ctx.fillStyle = `rgba(255,255,255,${tw})`;
    ctx.beginPath();
    ctx.arc(this.x + 3, this.y + 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
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
    this.keyColor = keyColor;
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
    };
    const c = colors[this.keyColor] || colors.gold;

    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(cx, y + 7, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.arc(cx, y + 7, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = c.body;
    ctx.fillRect(cx - 2, y + 12, 4, 10);
    ctx.fillRect(cx + 1, y + 16, 4, 2);
    ctx.fillRect(cx + 1, y + 20, 3, 2);

    const shimmer = Math.sin(this.timer * 0.1) * 0.3 + 0.3;
    ctx.fillStyle = `rgba(255,255,255,${shimmer})`;
    ctx.beginPath();
    ctx.arc(cx - 2, y + 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// DOOR — Locked door that requires a specific key color
// =============================================================================
export class Door {
  constructor(x, y, keyColor = 'gold') {
    this.x = x;
    this.y = y - CONFIG.tile.size; // 2 tiles tall, placed from bottom
    this.width = CONFIG.tile.size;
    this.height = CONFIG.tile.size * 2;
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

    if (player.keys && player.keys.includes(this.keyColor)) {
      this.opened = true;
      const idx = player.keys.indexOf(this.keyColor);
      player.keys.splice(idx, 1);
      player.addScore(300);
    } else {
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
    };
    const c = colors[this.keyColor] || colors.gold;

    ctx.fillStyle = c.frame;
    ctx.fillRect(x - 2, y, this.width + 4, this.height + 2);
    ctx.fillStyle = c.body;
    ctx.fillRect(x + 2, y + 2, this.width - 4, this.height - 2);
    // rounded Whoville top
    ctx.fillStyle = c.frame;
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 2, this.width / 2 + 2, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = c.body;
    ctx.beginPath();
    ctx.arc(x + this.width / 2, y + 2, this.width / 2 - 3, Math.PI, 0);
    ctx.fill();

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
// FLYGUY → WHO-BIRD — round little bird that bobs along
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
    this.startX = x;
    this.patrolRange = cfg.patrolRange;
    this.alive = true;
    this.squishTimer = 0;
    this.timer = 0;
    this.type = 'flyguy';
  }

  update(level) {
    if (!this.alive) {
      this.vy += CONFIG.player.gravity;
      this.y += this.vy;
      this.squishTimer--;
      return this.squishTimer > 0 && this.y < level.tiles.length * CONFIG.tile.size + 100;
    }

    this.timer++;
    this.x += this.vx;
    const cfg = CONFIG.enemies.flyguy;
    this.y = this.baseY + Math.sin(this.timer * cfg.verticalSpeed) * cfg.verticalRange;

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
    // stay near home — don't drift across the whole level
    if (this.x < this.startX - this.patrolRange && this.vx < 0) this.vx = -this.vx;
    if (this.x > this.startX + this.patrolRange && this.vx > 0) this.vx = -this.vx;

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
    const colors = theme.enemies.flyguy;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const facing = Math.sign(this.vx) || -1;
    const cx = x + w / 2;
    const cy = y + h / 2;

    if (!this.alive) {
      // tumbling down, feet up
      ctx.fillStyle = colors.bodyColor;
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8a030';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 8);
      ctx.lineTo(cx - 5, cy - 14);
      ctx.moveTo(cx + 3, cy - 8);
      ctx.lineTo(cx + 5, cy - 14);
      ctx.stroke();
      return;
    }

    // flapping wings
    const wingFlap = Math.sin(this.timer * 0.35) * 7;
    ctx.fillStyle = colors.wingColor;
    ctx.beginPath();
    ctx.ellipse(cx - facing * (w / 2 - 2), cy - 2 - wingFlap, 9, 4, -facing * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // plump body
    ctx.fillStyle = colors.bodyColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2 - 2, h / 2 - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // belly
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, w / 3.5, h / 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // head tuft — three springy feathers
    ctx.strokeStyle = colors.bodyColor;
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      const sway = Math.sin(this.timer * 0.12 + i) * 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + i * 2, cy - h / 2 + 3);
      ctx.quadraticCurveTo(cx + i * 4 + sway, cy - h / 2 - 5, cx + i * 6 + sway, cy - h / 2 - 3);
      ctx.stroke();
    }

    // beak
    ctx.fillStyle = '#e8a030';
    ctx.beginPath();
    ctx.moveTo(cx + facing * (w / 2 - 4), cy - 2);
    ctx.lineTo(cx + facing * (w / 2 + 4), cy);
    ctx.lineTo(cx + facing * (w / 2 - 4), cy + 3);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cx + facing * 3, cy - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx + facing * 4, cy - 4, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// =============================================================================
// SPIKER → FROST-LUMP — spiky ball of icicles; can't be stomped, only avoided
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
    this.timer = 0;
    this.type = 'spiker';
  }

  update(level) {
    if (!this.alive) return false;
    this.timer++;

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
    player.takeDamage();
  }

  draw(ctx, theme) {
    const colors = theme.enemies.spiker;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    // icicle spikes radiating out
    ctx.fillStyle = colors.spikeColor;
    const spikeCount = 7;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 - Math.PI / 2;
      const len = 6 + (i % 2) * 3;
      const sx = cx + Math.cos(angle) * (this.width / 2 - 2);
      const sy = cy + Math.sin(angle) * (this.height / 2 - 2);
      const tx = cx + Math.cos(angle) * (this.width / 2 + len);
      const ty = cy + Math.sin(angle) * (this.height / 2 + len);
      const px = Math.cos(angle + Math.PI / 2) * 3;
      const py = Math.sin(angle + Math.PI / 2) * 3;
      ctx.beginPath();
      ctx.moveTo(sx - px, sy - py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(sx + px, sy + py);
      ctx.closePath();
      ctx.fill();
    }

    // frosty body
    ctx.fillStyle = colors.bodyColor;
    ctx.beginPath();
    ctx.arc(cx, cy, this.width / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    // grumpy frozen face
    ctx.fillStyle = '#2a3a5a';
    ctx.fillRect(cx - 8, cy - 3, 5, 3);
    ctx.fillRect(cx + 3, cy - 3, 5, 3);
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 3, Math.PI + 0.3, -0.3, false);
    ctx.strokeStyle = '#2a3a5a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// =============================================================================
// PUSHBLOCK — wooden crate, carried/pushed/stacked (unchanged behavior)
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
    if (this.carried) return true;

    this.vy += CONFIG.player.gravity;
    if (this.vy > CONFIG.player.maxFallSpeed) this.vy = CONFIG.player.maxFallSpeed;

    const collisions = resolveEntityTileCollisions(this, level);

    if (collisions.bottom) {
      this.vy = 0;
    }
    if (collisions.left || collisions.right) {
      this.vx = 0;
    }

    this.vx *= 0.7;
    if (Math.abs(this.vx) < 0.1) this.vx = 0;

    const levelHeight = level.tiles.length * CONFIG.tile.size;
    if (this.y > levelHeight + 100) return false;

    return true;
  }

  checkBlockCollision(otherBlock) {
    if (this.carried || otherBlock.carried) return;
    if (!aabbOverlap(this, otherBlock)) return;

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

    if (player.vy >= 0 && playerBottom <= blockTop + 8 && playerBottom >= blockTop - 2) {
      player.y = blockTop - player.height;
      player.vy = 0;
      player.onGround = true;
      player.hasDoubleJumped = false;
      player.isJumping = false;
      return;
    }

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
    const tileDef = theme.tiles['D'] || { color: '#9c6b34', topColor: '#bb8850' };

    ctx.fillStyle = tileDef.color;
    ctx.fillRect(x, y, this.width, this.height);
    ctx.fillStyle = tileDef.topColor;
    ctx.fillRect(x, y, this.width, 4);
    // crate slats
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 1, y + 1, this.width - 2, this.height - 2);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 2);
    ctx.lineTo(x + this.width - 2, y + this.height - 2);
    ctx.moveTo(x + this.width - 2, y + 2);
    ctx.lineTo(x + 2, y + this.height - 2);
    ctx.stroke();

    // pushable arrows
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + this.height / 2);
    ctx.lineTo(x + 10, y + this.height / 2 - 4);
    ctx.lineTo(x + 10, y + this.height / 2 + 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + this.width - 5, y + this.height / 2);
    ctx.lineTo(x + this.width - 10, y + this.height / 2 - 4);
    ctx.lineTo(x + this.width - 10, y + this.height / 2 + 4);
    ctx.fill();
  }
}

// =============================================================================
// MOVING PLATFORM — drifting snow ledge
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
      player.x += this.vx;
    }
  }

  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    // snow-drift ledge
    ctx.fillStyle = '#6a7a9a';
    ctx.fillRect(x, y + 3, this.width, this.height - 3);
    ctx.fillStyle = '#e8f0ff';
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    for (let i = 0; i <= this.width; i += 8) {
      ctx.quadraticCurveTo(x + i + 4, y - 1, x + Math.min(i + 8, this.width), y + 4);
    }
    ctx.closePath();
    ctx.fill();
  }
}

// =============================================================================
// GIFT HOUSE — World 4's heart of the game: bring a present back to a dark
// house and it lights up. 3x3 tiles, anchored at its bottom-left tile.
// =============================================================================
export class GiftHouse {
  constructor(x, y) {
    const ts = CONFIG.tile.size;
    this.width = ts * 3;
    this.height = ts * 3;
    this.x = x;
    this.y = y - ts * 2; // marker sits on the ground row
    this.lit = false;
    this.litTimer = 0;
    this.timer = 0;
    this.hue = (Math.floor(x / ts) * 37) % 3; // house color variety
    this.type = 'gifthouse';
  }

  update() {
    this.timer++;
    if (this.lit) this.litTimer++;
    return true;
  }

  checkPlayerCollision(player) {
    if (this.lit) return;
    if (!aabbOverlap(this, player)) return;
    if (player.presents <= 0) return;

    player.presents--;
    player.housesLit++;
    player.addScore(500);
    player.celebrate?.();
    this.lit = true;
    player.onLightHouse?.(this);
  }

  draw(ctx, theme) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;

    const walls = [
      { body: '#7a5a8a', roof: '#5a4a6a', litBody: '#e58ab8', litRoof: '#c85a78' },
      { body: '#4a6a7a', roof: '#3a5a6a', litBody: '#5ab8b8', litRoof: '#3a9898' },
      { body: '#6a6a4a', roof: '#5a5a3a', litBody: '#e8c85a', litRoof: '#c8a838' },
    ][this.hue];

    const body = this.lit ? walls.litBody : walls.body;
    const roof = this.lit ? walls.litRoof : walls.roof;

    // house body
    ctx.fillStyle = body;
    ctx.fillRect(x + 6, y + h * 0.35, w - 12, h * 0.65);

    // curvy Seussian roof — swoops up to a bent point
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.4);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.05, x + w * 0.55, y + h * 0.12);
    ctx.quadraticCurveTo(x + w * 0.75, y + h * 0.16, x + w * 0.72, y - h * 0.08);   // the kink
    ctx.quadraticCurveTo(x + w * 0.9, y + h * 0.1, x + w, y + h * 0.4);
    ctx.closePath();
    ctx.fill();
    // snow on the roof edge
    ctx.strokeStyle = '#e8f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h * 0.38);
    ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.04, x + w * 0.55, y + h * 0.11);
    ctx.stroke();

    // door
    ctx.fillStyle = this.lit ? '#8a4a2a' : '#3a2a3a';
    ctx.beginPath();
    ctx.arc(x + w * 0.32, y + h * 0.78, w * 0.11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x + w * 0.21, y + h * 0.78, w * 0.22, h * 0.22);

    // windows — dark until the present comes home
    const winGlow = this.lit ? Math.min(1, this.litTimer / 20) : 0;
    ctx.fillStyle = winGlow > 0
      ? `rgba(255, ${200 + winGlow * 30}, ${90 + winGlow * 40}, ${0.5 + winGlow * 0.5})`
      : '#28203a';
    ctx.beginPath();
    ctx.arc(x + w * 0.68, y + h * 0.6, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + w * 0.14, y + h * 0.48, w * 0.14, h * 0.14);

    if (this.lit) {
      // warm glow halo
      const glow = 0.25 + Math.sin(this.litTimer * 0.08) * 0.08;
      ctx.fillStyle = `rgba(255, 220, 120, ${glow * winGlow})`;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.55, w * 0.75, 0, Math.PI * 2);
      ctx.fill();
      // little tree lights up beside the door
      ctx.fillStyle = '#2a7a3a';
      ctx.beginPath();
      ctx.moveTo(x + w * 0.55, y + h * 0.98);
      ctx.lineTo(x + w * 0.47, y + h * 0.98);
      ctx.lineTo(x + w * 0.51, y + h * 0.72);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const tw = Math.sin(this.litTimer * 0.15 + i * 2) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(${i % 2 ? 255 : 120}, ${i % 2 ? 120 : 220}, 120, ${0.4 + tw * 0.6})`;
        ctx.beginPath();
        ctx.arc(x + w * (0.48 + (i % 2) * 0.04), y + h * (0.78 + i * 0.05), 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // hint: this house is waiting for a present
      const bob = Math.sin(this.timer * 0.06) * 3;
      ctx.globalAlpha = 0.75;
      drawPresent(ctx, x + w / 2 - 7, y - 22 + bob, 14, 12, '#cc2936', '#ffd700');
      ctx.globalAlpha = 1;
    }
  }
}

// =============================================================================
// CINDY LOU WHO — stands in her nightgown and asks the question.
// Purely a story moment; she never hurts or blocks anyone.
// =============================================================================
export class CindyLou {
  constructor(x, y) {
    const ts = CONFIG.tile.size;
    this.width = 20;
    this.height = 26;
    this.x = x + (ts - this.width) / 2;
    this.y = y + ts - this.height;
    this.timer = 0;
    this.nearTimer = 0;   // how long the player has been nearby
    this.playerNear = false;
    this.type = 'cindylou';
  }

  update() {
    this.timer++;
    if (this.playerNear) this.nearTimer++;
    else this.nearTimer = 0;
    this.playerNear = false; // re-set each frame by collision check
    return true;
  }

  checkPlayerCollision(player) {
    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    if (Math.abs(dx) < 130 && Math.abs(dy) < 80) {
      this.playerNear = true;
    }
  }

  draw(ctx, theme) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const cx = x + w / 2;

    // nightgown
    ctx.fillStyle = '#f0d8e8';
    ctx.beginPath();
    ctx.moveTo(cx, y + 8);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();

    // head
    ctx.fillStyle = '#f8e0c8';
    ctx.beginPath();
    ctx.arc(cx, y + 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // who-hair: swooping antenna updo with a bow
    ctx.strokeStyle = '#e8a030';
    ctx.lineWidth = 2.5;
    const sway = Math.sin(this.timer * 0.05) * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, y + 1);
    ctx.quadraticCurveTo(cx + 3 + sway, y - 8, cx - 2 + sway, y - 12);
    ctx.stroke();
    ctx.fillStyle = '#cc4a6a';
    ctx.beginPath();
    ctx.arc(cx - 2 + sway, y - 13, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // big questioning eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cx - 2.5, y + 5, 2.2, 0, Math.PI * 2);
    ctx.arc(cx + 2.5, y + 5, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a5a8a';
    ctx.beginPath();
    ctx.arc(cx - 2, y + 5.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, y + 5.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // small round mouth
    ctx.fillStyle = '#c86a7a';
    ctx.beginPath();
    ctx.arc(cx, y + 9.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // speech bubbles while the player lingers
    if (this.nearTimer > 10) {
      const line = Math.floor(this.nearTimer / 150) % 2 === 0
        ? 'Santy Claus, why?'
        : 'Why are you taking our tree? WHY?';
      drawSpeechBubble(ctx, cx, y - 24, line);
    }
  }
}

function drawSpeechBubble(ctx, cx, y, text) {
  ctx.save();
  ctx.font = '11px monospace';
  const padding = 6;
  const tw = ctx.measureText(text).width;
  const bw = tw + padding * 2;
  const bh = 18;
  const bx = cx - bw / 2;
  const by = y - bh;

  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 6) : ctx.rect(bx, by, bw, bh);
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(cx - 4, by + bh);
  ctx.lineTo(cx, by + bh + 6);
  ctx.lineTo(cx + 4, by + bh);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, by + bh / 2 + 1);
  ctx.restore();
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
