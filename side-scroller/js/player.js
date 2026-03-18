// =============================================================================
// PLAYER — Player entity with Mario-like physics
// =============================================================================

import { CONFIG } from './config.js';
import { resolveEntityTileCollisions, getTouchingWall } from './physics.js';

const STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  JUMPING: 'jumping',
  FALLING: 'falling',
  SKIDDING: 'skidding',
  WALL_SLIDING: 'wall_sliding',
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

    // Wall slide/jump state
    this.wallDir = 0;            // -1 left wall, 1 right wall, 0 none
    this.wallSlideTimer = 0;

    // Carrying blocks
    this.carriedBlock = null;

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

    // Character type
    this.character = 'classic'; // set externally
    this.rotation = 0;         // rolling rotation for block character
    this.spinSpeed = 0;        // spin velocity for airborne block
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

    // --- Wall slide / wall jump ---
    if (p.wallSlide.enabled && !this.onGround) {
      const wall = getTouchingWall(this, level);
      if (wall !== 0 && this.vy > 0) {
        // Pressing into the wall
        const pressingIntoWall = (wall === -1 && input.left) || (wall === 1 && input.right);
        if (pressingIntoWall) {
          this.wallDir = wall;
          this.wallSlideTimer = p.wallSlide.stickFrames;
          // Slow fall
          if (this.vy > p.wallSlide.fallSpeed) {
            this.vy = p.wallSlide.fallSpeed;
          }
        }
      }

      // Wall jump
      if (this.wallSlideTimer > 0) {
        this.wallSlideTimer--;
        if (input.jumpPressed) {
          this.vy = p.wallSlide.jumpVelocityY;
          this.vx = -this.wallDir * p.wallSlide.jumpVelocityX;
          this.facing = -this.wallDir;
          this.isJumping = true;
          this.jumpHeld = true;
          this.wallDir = 0;
          this.wallSlideTimer = 0;
          this.jumpBufferTimer = 0;
          this.hasDoubleJumped = false;
        }
      }

      if (this.onGround || getTouchingWall(this, level) === 0) {
        this.wallDir = 0;
      }
    }

    // --- State ---
    if (this.wallDir !== 0 && this.wallSlideTimer > 0 && !this.onGround) {
      this.state = STATES.WALL_SLIDING;
    } else if (!this.onGround) {
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

    // --- Character-specific animation ---
    if (this.character === 'block') {
      if (this.onGround) {
        // Roll based on horizontal movement
        this.spinSpeed = this.vx * 0.06;
        this.rotation += this.spinSpeed;
        // Snap to nearest 90° when stopped
        if (Math.abs(this.vx) < 0.3) {
          const target = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
          this.rotation += (target - this.rotation) * 0.2;
          this.spinSpeed = 0;
        }
      } else {
        // Spin in the air only if we had momentum
        if (Math.abs(this.spinSpeed) > 0.01) {
          this.rotation += this.spinSpeed;
        }
      }
    }

    // --- Invincibility ---
    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    // --- Carried block follows player ---
    if (this.carriedBlock) {
      this.carriedBlock.x = this.x + (this.width - this.carriedBlock.width) / 2;
      this.carriedBlock.y = this.y - this.carriedBlock.height;
      this.carriedBlock.vx = 0;
      this.carriedBlock.vy = 0;
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

  pickUpBlock(block) {
    if (this.carriedBlock) return false;
    this.carriedBlock = block;
    block.carried = true;
    block.vx = 0;
    block.vy = 0;
    return true;
  }

  placeBlock() {
    if (!this.carriedBlock) return null;
    const block = this.carriedBlock;
    block.carried = false;
    // Place in front of player
    block.x = this.x + this.facing * (this.width + 2);
    block.y = this.y - block.height + this.height;
    block.vx = 0;
    block.vy = 0;
    this.carriedBlock = null;
    return block;
  }

  throwBlock() {
    if (!this.carriedBlock) return null;
    const block = this.carriedBlock;
    block.carried = false;
    block.x = this.x + this.facing * (this.width + 2);
    block.y = this.y - block.height;
    block.vx = this.facing * 6;
    block.vy = -3;
    this.carriedBlock = null;
    return block;
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

    if (this.character === 'block') {
      this.drawBlock(ctx, theme);
    } else {
      this.drawClassic(ctx, theme);
    }
  }

  drawClassic(ctx, theme) {
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

    // Wall slide pose — arms reaching toward wall
    if (this.state === STATES.WALL_SLIDING) {
      ctx.fillStyle = colors.bodyColor;
      ctx.fillRect(-2, h * 0.3, 4, 6);  // arm toward wall
      ctx.fillRect(-2, h * 0.5, 4, 6);  // second arm
    }

    // Carrying pose — arms up
    if (this.carriedBlock) {
      ctx.fillStyle = colors.bodyColor;
      ctx.fillRect(2, -4, 4, 8);        // left arm up
      ctx.fillRect(w - 6, -4, 4, 8);    // right arm up
    }

    ctx.restore();
  }

  drawBlock(ctx, theme) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const size = Math.min(w, h);
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    const half = size / 2;

    // Main body
    ctx.fillStyle = '#4488CC';
    ctx.fillRect(-half, -half, size, size);

    // Lighter top-left edge
    ctx.fillStyle = '#66AAEE';
    ctx.fillRect(-half, -half, size, 3);
    ctx.fillRect(-half, -half, 3, size);

    // Darker bottom-right edge
    ctx.fillStyle = '#2266AA';
    ctx.fillRect(-half, half - 3, size, 3);
    ctx.fillRect(half - 3, -half, 3, size);

    // Face — eyes and mouth that rotate with the block
    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-half + 5, -half + 5, 7, 7);
    ctx.fillRect(half - 12, -half + 5, 7, 7);

    // Pupils — look in movement direction
    const pupilOffset = this.facing * 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(-half + 7 + pupilOffset, -half + 7, 3, 4);
    ctx.fillRect(half - 10 + pupilOffset, -half + 7, 3, 4);

    // Mouth — changes based on state
    ctx.fillStyle = '#000';
    if (this.state === STATES.JUMPING || this.state === STATES.FALLING) {
      // Open mouth (surprise/excitement)
      ctx.beginPath();
      ctx.arc(0, half - 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (Math.abs(this.vx) > 2) {
      // Wide grin when moving fast
      ctx.fillRect(-5, half - 10, 10, 3);
    } else {
      // Slight smile
      ctx.fillRect(-3, half - 9, 6, 2);
    }

    ctx.restore();

    // Carried block drawn above (no rotation needed)
    if (this.carriedBlock) {
      // Small lines showing "holding" above the block
      ctx.strokeStyle = '#4488CC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, y - 2);
      ctx.lineTo(cx - 4, y - 6);
      ctx.moveTo(cx + 4, y - 2);
      ctx.lineTo(cx + 4, y - 6);
      ctx.stroke();
    }
  }

  // Static method for drawing character previews (used by title screen)
  static drawPreview(ctx, character, x, y, size, timer) {
    ctx.save();
    if (character === 'classic') {
      ctx.translate(x, y);
      const s = size;
      // Simplified classic character preview
      ctx.fillStyle = '#0000CC';
      ctx.fillRect(2, s * 0.45, s - 4, s * 0.55);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(2, s * 0.25, s - 4, s * 0.35);
      ctx.fillStyle = '#FFB366';
      ctx.fillRect(4, 0, s - 8, s * 0.3);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(2, 0, s - 2, s * 0.12);
      ctx.fillStyle = '#000';
      ctx.fillRect(s - 8, s * 0.12, 3, 4);
    } else if (character === 'block') {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const half = size / 2;
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(timer * 0.03) * 0.3);
      ctx.fillStyle = '#4488CC';
      ctx.fillRect(-half, -half, size, size);
      ctx.fillStyle = '#66AAEE';
      ctx.fillRect(-half, -half, size, 3);
      ctx.fillRect(-half, -half, 3, size);
      ctx.fillStyle = '#2266AA';
      ctx.fillRect(-half, half - 3, size, 3);
      ctx.fillRect(half - 3, -half, 3, size);
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-half + 4, -half + 4, 6, 6);
      ctx.fillRect(half - 10, -half + 4, 6, 6);
      ctx.fillStyle = '#000';
      ctx.fillRect(-half + 6, -half + 6, 3, 3);
      ctx.fillRect(half - 8, -half + 6, 3, 3);
      ctx.fillRect(-3, half - 8, 6, 2);
    }
    ctx.restore();
  }
}
