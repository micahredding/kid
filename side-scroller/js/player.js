// =============================================================================
// PLAYER — Player entity with Mario-like physics
// =============================================================================

import { CONFIG } from './config.js';
import { resolveEntityTileCollisions } from './physics.js';

const STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  JUMPING: 'jumping',
  FALLING: 'falling',
  SKIDDING: 'skidding',
};

export class Player {
  constructor(x, y) {
    const p = CONFIG.player;
    this.x = x;
    this.y = y;
    this.width = p.width;
    this.height = p.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.state = STATES.IDLE;
    this.isPlayer = true;

    // Jump state
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumping = false;       // currently in upward jump arc with button held
    this.hasDoubleJumped = false;
    this.jumpHeld = false;

    // Invincibility
    this.invincibleTimer = 0;

    // Score and lives
    this.score = 0;
    this.lives = p.startingLives;
    this.coins = 0;

    // Callbacks
    this.onHitBlock = null;
    this.onDeath = null;
    this.onCollectCoin = null;

    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(input, level) {
    const p = CONFIG.player;

    // --- Horizontal movement ---
    const maxSpeed = input.sprint ? p.maxSprintSpeed : p.maxRunSpeed;
    let accel, decel;

    if (this.onGround) {
      accel = p.groundAcceleration;
      decel = p.groundDeceleration;
    } else {
      accel = p.airAcceleration;
      decel = p.airDeceleration;
    }

    if (input.left) {
      // Check for skid (reversing direction)
      if (this.vx > 0 && this.onGround) {
        this.vx -= p.skidDeceleration;
        this.state = STATES.SKIDDING;
      } else {
        this.vx -= accel;
        this.facing = -1;
      }
    } else if (input.right) {
      if (this.vx < 0 && this.onGround) {
        this.vx += p.skidDeceleration;
        this.state = STATES.SKIDDING;
      } else {
        this.vx += accel;
        this.facing = 1;
      }
    } else {
      // Decelerate
      if (Math.abs(this.vx) < decel) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * decel;
      }
    }

    // Clamp horizontal speed
    this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

    // --- Jump buffer ---
    if (input.jumpPressed) {
      this.jumpBufferTimer = p.jumpBufferFrames;
    }
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    // --- Coyote time ---
    if (this.onGround) {
      this.coyoteTimer = p.coyoteFrames;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    // --- Jumping ---
    const canJump = this.coyoteTimer > 0;
    const wantsJump = this.jumpBufferTimer > 0;

    if (wantsJump && canJump) {
      this.vy = p.jumpVelocity;
      this.isJumping = true;
      this.jumpHeld = true;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.hasDoubleJumped = false;
    }
    // Double jump
    else if (input.jumpPressed && !canJump && p.doubleJump.enabled && !this.hasDoubleJumped && !this.onGround) {
      this.vy = p.doubleJump.velocity;
      this.isJumping = true;
      this.jumpHeld = true;
      this.hasDoubleJumped = true;
    }

    // Variable jump height — cut velocity when button released
    if (input.jumpReleased && this.isJumping && this.vy < 0) {
      this.vy *= p.jumpCutMultiplier;
      this.isJumping = false;
    }

    // Track if jump is held
    if (!input.jump) {
      this.jumpHeld = false;
      this.isJumping = false;
    }

    // --- Gravity ---
    // Use higher gravity when falling for snappy arc
    const gravity = this.vy > 0 ? p.fallingGravity : p.gravity;
    this.vy += gravity;
    if (this.vy > p.maxFallSpeed) {
      this.vy = p.maxFallSpeed;
    }

    // --- Collision resolution ---
    const collisions = resolveEntityTileCollisions(this, level);

    if (collisions.bottom) {
      this.onGround = true;
      this.hasDoubleJumped = false;
      this.isJumping = false;
    } else {
      this.onGround = false;
    }

    if (collisions.top) {
      this.isJumping = false;
    }

    // --- State ---
    if (!this.onGround) {
      this.state = this.vy < 0 ? STATES.JUMPING : STATES.FALLING;
    } else if (this.state !== STATES.SKIDDING || Math.abs(this.vx) < 0.5) {
      if (Math.abs(this.vx) > 0.3) {
        this.state = STATES.RUNNING;
      } else {
        this.state = STATES.IDLE;
      }
    }

    // --- Animation ---
    this.animTimer++;
    if (this.state === STATES.RUNNING) {
      const frameSpeed = Math.max(3, 10 - Math.abs(this.vx) * 1.5);
      if (this.animTimer >= frameSpeed) {
        this.animFrame = (this.animFrame + 1) % 3;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    // --- Invincibility ---
    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    // --- Fall death ---
    const levelHeight = level.tiles.length * CONFIG.tile.size;
    if (this.y > levelHeight + 100) {
      this.die();
    }
  }

  takeDamage() {
    if (this.invincibleTimer > 0) return;
    this.invincibleTimer = CONFIG.player.invincibilityFrames;
    this.lives--;
    if (this.lives <= 0) {
      this.die();
    }
  }

  die() {
    this.onDeath?.();
  }

  addScore(points) {
    const prevLives = Math.floor(this.score / CONFIG.scoring.extraLifeAt);
    this.score += points;
    const newLives = Math.floor(this.score / CONFIG.scoring.extraLifeAt);
    if (newLives > prevLives) {
      this.lives += (newLives - prevLives);
    }
  }

  bounce(velocity) {
    this.vy = velocity || CONFIG.enemies.goomba.bounceVelocity;
    this.isJumping = true;
    this.jumpHeld = true;
    this.onGround = false;
  }

  draw(ctx, theme) {
    // Blink during invincibility
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) {
      return;
    }

    const colors = theme.player;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const f = this.facing;

    ctx.save();

    // Flip for facing direction
    if (f === -1) {
      ctx.translate(x + w / 2, y);
      ctx.scale(-1, 1);
      ctx.translate(-w / 2, 0);
    } else {
      ctx.translate(x, y);
    }

    // Body (overalls)
    ctx.fillStyle = colors.overallsColor;
    ctx.fillRect(2, h * 0.45, w - 4, h * 0.55);

    // Torso
    ctx.fillStyle = colors.bodyColor;
    ctx.fillRect(2, h * 0.25, w - 4, h * 0.35);

    // Head
    ctx.fillStyle = colors.headColor;
    ctx.fillRect(4, 0, w - 8, h * 0.3);

    // Hat
    ctx.fillStyle = colors.bodyColor;
    ctx.fillRect(2, 0, w - 2, h * 0.12);

    // Eye
    ctx.fillStyle = '#000';
    ctx.fillRect(w - 8, h * 0.12, 3, 4);

    // Running animation — leg positions
    if (this.state === STATES.RUNNING) {
      const legOffset = this.animFrame === 1 ? 0 : (this.animFrame === 0 ? -2 : 2);
      ctx.fillStyle = colors.overallsColor;
      ctx.fillRect(4, h - 6, 6, 6);
      ctx.fillRect(w - 10 + legOffset, h - 6, 6, 6);
    }

    // Jump pose
    if (this.state === STATES.JUMPING || this.state === STATES.FALLING) {
      ctx.fillStyle = colors.bodyColor;
      ctx.fillRect(w - 4, h * 0.25, 4, 6); // arm up
    }

    ctx.restore();
  }
}
