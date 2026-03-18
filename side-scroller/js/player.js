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
    this.foods = []; // list of food types collected: 'apple', 'cherry', 'banana'
    this.gems = 0;
    this.keys = [];

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

    // Numberblock 4 form: 'square' (2x2), 'flat' (4x1), or 'tall' (1x4)
    this.blockForm = 'square';
    this.blockForms = ['square', 'flat', 'tall'];
    this.subBlockSize = 28;

    // Caterpillar segments (7 circles, rainbow colors)
    this.caterpillarColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00CC00', '#0000FF', '#4B0082', '#8B00FF'];
    this.segmentRadius = 10;
    this.segments = [];
    this.segmentTimer = 0;

    // Butterfly transformation
    this.isButterfly = false;
    this.isFlapping = false;
    this.butterflyTimer = 0;
    this.transformTimer = 0; // cocoon animation countdown
    this.totalFoodsInLevel = 0; // set by engine
  }

  update(input, level) {
    const p = CONFIG.player;

    // --- Cocoon transformation countdown ---
    if (this.transformTimer > 0) {
      this.transformTimer--;
      if (this.transformTimer <= 0) {
        this.isButterfly = !this.isButterfly;
        this.butterflyTimer = 0;
        if (!this.isButterfly) {
          // Returning to caterpillar — reinitialize segments
          this.segments = [];
        }
      }
      return; // frozen during transformation
    }

    // --- Butterfly flight mode ---
    if (this.isButterfly) {
      this.butterflyTimer++;
      const maxSpeed = input.sprint ? p.maxSprintSpeed : p.maxRunSpeed;
      const accel = p.groundAcceleration;
      const decel = p.airDeceleration;

      // Horizontal movement — same as normal
      if (input.left) { this.vx -= accel; this.facing = -1; }
      else if (input.right) { this.vx += accel; this.facing = 1; }
      else {
        if (Math.abs(this.vx) < decel) this.vx = 0;
        else this.vx -= Math.sign(this.vx) * decel;
      }
      this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

      // Flap-based flight: gentle gravity, flapping counteracts it
      const butterflyGravity = 0.25;  // lighter than normal
      const flapStrength = -1.8;       // each flap impulse
      const maxRise = -4;             // max upward speed
      const maxFall = 3;              // gentle float down

      this.isFlapping = input.jump || input.up;

      if (this.isFlapping) {
        // Continuous flapping provides lift
        this.vy += flapStrength * 0.15;  // sustained lift per frame
        if (this.vy < maxRise) this.vy = maxRise;
      }

      // Gravity always applies
      this.vy += butterflyGravity;
      if (this.vy > maxFall) this.vy = maxFall;

      // Collision resolution
      const collisions = resolveEntityTileCollisions(this, level);
      if (collisions.bottom) {
        this.vy = 0;
        this.onGround = true;
      } else {
        this.onGround = false;
      }
      if (collisions.top) {
        this.vy = 0;
      }

      this.state = this.onGround ? (Math.abs(this.vx) > 0.3 ? STATES.RUNNING : STATES.IDLE) : (this.vy < 0 ? STATES.JUMPING : STATES.FALLING);

      // Transform back to caterpillar
      if (input.transformPressed) {
        this.transformTimer = 40; // shorter transform back
      }

      // Carried block follows
      if (this.carriedBlock) {
        this.carriedBlock.x = this.x + (this.width - this.carriedBlock.width) / 2;
        this.carriedBlock.y = this.y - this.carriedBlock.height;
        this.carriedBlock.vx = 0;
        this.carriedBlock.vy = 0;
      }

      // Invincibility
      if (this.invincibleTimer > 0) this.invincibleTimer--;

      // Fall death
      const levelHeight = level.tiles.length * CONFIG.tile.size;
      if (this.y > levelHeight + 100) this.die();

      return;
    }

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
    if (this.character === 'block' || (this.character === 'numberblock4' && this.blockForm === 'square')) {
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

    // --- Caterpillar segment following ---
    if (this.character === 'caterpillar') {
      this.segmentTimer++;
      const headX = this.x + this.width / 2;
      const headY = this.y + this.height / 2;

      // Initialize segments if needed
      if (this.segments.length === 0) {
        for (let i = 0; i < 7; i++) {
          this.segments.push({ x: headX - i * this.segmentRadius * 1.4, y: headY });
        }
      }

      // Head segment tracks player center
      this.segments[0].x = headX;
      this.segments[0].y = headY;

      // Each segment follows the one ahead with spring-like motion
      const spacing = this.segmentRadius * 1.4;
      for (let i = 1; i < this.segments.length; i++) {
        const prev = this.segments[i - 1];
        const seg = this.segments[i];
        const dx = prev.x - seg.x;
        const dy = prev.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > spacing) {
          const ratio = (dist - spacing) / dist;
          seg.x += dx * ratio * 0.4;
          seg.y += dy * ratio * 0.4;
        }
        // Add shuffling bob when moving
        if (Math.abs(this.vx) > 0.5) {
          seg.y += Math.sin(this.segmentTimer * 0.2 + i * 1.2) * 0.5;
        }
      }
    }

    // --- Numberblock 4 form switching ---
    if (this.character === 'numberblock4' && input.transformPressed) {
      this.switchForm(level);
    }

    // --- Caterpillar -> Butterfly transformation ---
    if (this.character === 'caterpillar' && !this.isButterfly && input.transformPressed) {
      if (this.totalFoodsInLevel > 0 && this.foods.length >= this.totalFoodsInLevel) {
        this.transformTimer = 60; // 1 second cocoon animation
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

  applyCharacterSize() {
    const s = this.subBlockSize;
    if (this.character === 'numberblock4') {
      if (this.blockForm === 'square') {
        this.width = s * 2;
        this.height = s * 2;
      } else if (this.blockForm === 'flat') {
        this.width = s * 4;
        this.height = s;
      } else {
        // tall (1x4)
        this.width = s;
        this.height = s * 4;
      }
    }
  }

  switchForm(level) {
    const s = this.subBlockSize;
    const oldW = this.width;
    const oldH = this.height;
    const oldBottom = this.y + this.height;

    // Cycle to next form
    const idx = this.blockForms.indexOf(this.blockForm);
    const newForm = this.blockForms[(idx + 1) % this.blockForms.length];
    const newW = newForm === 'square' ? s * 2 : newForm === 'flat' ? s * 4 : s;
    const newH = newForm === 'square' ? s * 2 : newForm === 'flat' ? s : s * 4;

    // Calculate new position — keep feet at same place, center horizontally
    const newX = this.x + (oldW - newW) / 2;
    const newY = oldBottom - newH;

    // Check if new shape fits (no tile collisions)
    const ts = CONFIG.tile.size;
    const testEntity = { x: newX, y: newY, width: newW, height: newH };
    const left = Math.floor(testEntity.x / ts);
    const right = Math.floor((testEntity.x + testEntity.width - 1) / ts);
    const top = Math.floor(testEntity.y / ts);
    const bottom = Math.floor((testEntity.y + testEntity.height - 1) / ts);

    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (row < 0 || row >= level.tiles.length) continue;
        if (col < 0 || col >= level.tiles[row].length) continue;
        const ch = level.tiles[row][col];
        if (ch && ch !== ' ' && ch !== 'C' && ch !== 'E' && ch !== 'K' &&
            ch !== 'F' && ch !== 'X' && ch !== 'D' && ch !== 'I' &&
            ch !== 'A' && ch !== 'H' && ch !== 'N' && ch !== 'Y' &&
            ch !== 'y' && ch !== 'J' && ch !== 'j' && ch !== 'L' && ch !== 'l') {
          return; // can't transform, blocked
        }
      }
    }

    // Apply new form
    this.blockForm = newForm;
    this.x = newX;
    this.y = newY;
    this.width = newW;
    this.height = newH;
    this.rotation = 0;
    this.spinSpeed = 0;
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
    } else if (this.character === 'numberblock4') {
      this.drawNumberblock4(ctx, theme);
    } else if (this.character === 'caterpillar') {
      if (this.transformTimer > 0) {
        this.drawCocoon(ctx);
      } else if (this.isButterfly) {
        this.drawButterfly(ctx);
      } else {
        this.drawCaterpillar(ctx, theme);
      }
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

  drawNumberblock4(ctx, theme) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const w = this.width;
    const h = this.height;
    const s = this.subBlockSize;
    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Only rotate in square form
    if (this.blockForm === 'square') {
      ctx.rotate(this.rotation);
    }

    const halfW = w / 2;
    const halfH = h / 2;

    // Determine sub-block positions based on form
    let positions;
    if (this.blockForm === 'square') {
      // 2x2 grid
      positions = [
        { x: -halfW, y: -halfH },
        { x: -halfW + s, y: -halfH },
        { x: -halfW, y: -halfH + s },
        { x: -halfW + s, y: -halfH + s },
      ];
    } else if (this.blockForm === 'flat') {
      // 4x1 flat row
      positions = [
        { x: -halfW, y: -halfH },
        { x: -halfW + s, y: -halfH },
        { x: -halfW + s * 2, y: -halfH },
        { x: -halfW + s * 3, y: -halfH },
      ];
    } else {
      // 1x4 tall column
      positions = [
        { x: -halfW, y: -halfH },
        { x: -halfW, y: -halfH + s },
        { x: -halfW, y: -halfH + s * 2 },
        { x: -halfW, y: -halfH + s * 3 },
      ];
    }

    const bodyColor = '#33AA44';
    const lightColor = '#55CC66';
    const darkColor = '#228833';

    // Draw each sub-block
    for (let i = 0; i < 4; i++) {
      const bx = positions[i].x;
      const by = positions[i].y;

      // Block body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(bx, by, s, s);

      // Light edges (top, left)
      ctx.fillStyle = lightColor;
      ctx.fillRect(bx, by, s, 2);
      ctx.fillRect(bx, by, 2, s);

      // Dark edges (bottom, right)
      ctx.fillStyle = darkColor;
      ctx.fillRect(bx, by + s - 2, s, 2);
      ctx.fillRect(bx + s - 2, by, 2, s);

      // Grid line between blocks
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeRect(bx, by, s, s);
    }

    // Single face centered on the whole shape
    const eyeSize = 5;
    const eyeSpacing = Math.min(w, h) * 0.3;
    const eyeY = -eyeSize / 2 - 2;

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-eyeSpacing / 2 - eyeSize, eyeY, eyeSize + 2, eyeSize + 2);
    ctx.fillRect(eyeSpacing / 2 - 1, eyeY, eyeSize + 2, eyeSize + 2);

    // Pupils
    const pupilOff = this.facing * 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(-eyeSpacing / 2 - eyeSize + 2 + pupilOff, eyeY + 2, 3, 3);
    ctx.fillRect(eyeSpacing / 2 + 1 + pupilOff, eyeY + 2, 3, 3);

    // Mouth
    ctx.fillStyle = '#000';
    if (this.state === STATES.JUMPING || this.state === STATES.FALLING) {
      ctx.beginPath();
      ctx.arc(0, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (Math.abs(this.vx) > 2) {
      ctx.fillRect(-5, 5, 10, 3);
    } else {
      ctx.fillRect(-3, 5, 6, 2);
    }

    // Number "4" drawn in center
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `bold ${Math.floor(Math.min(w, h) * 0.35)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('4', 0, 0);

    ctx.restore();
  }

  drawCaterpillar(ctx, theme) {
    const r = this.segmentRadius;
    const colors = this.caterpillarColors;

    // Draw segments back to front (tail first)
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const sx = Math.round(seg.x);
      const sy = Math.round(seg.y);

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();

      // Highlight on top edge
      ctx.beginPath();
      ctx.arc(sx, sy - 2, r * 0.6, Math.PI, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    // Face on head segment (index 0)
    const head = this.segments[0];
    if (head) {
      const hx = Math.round(head.x);
      const hy = Math.round(head.y);

      // Eyes
      const eyeOff = this.facing * 2;
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(hx - 3 + eyeOff, hy - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 3 + eyeOff, hy - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(hx - 2 + eyeOff, hy - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 4 + eyeOff, hy - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hx + this.facing, hy + 3, 3, 0.1, Math.PI - 0.1);
      ctx.stroke();

      // Antennae
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      const antBob = Math.sin(this.segmentTimer * 0.15) * 2;
      ctx.beginPath();
      ctx.moveTo(hx - 3, hy - r + 2);
      ctx.lineTo(hx - 6, hy - r - 8 + antBob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + 3, hy - r + 2);
      ctx.lineTo(hx + 6, hy - r - 8 - antBob);
      ctx.stroke();

      // Antenna tips
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(hx - 6, hy - r - 8 + antBob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 6, hy - r - 8 - antBob, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawCocoon(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    // Pulsing cocoon shape
    const pulse = Math.sin(this.transformTimer * 0.3) * 3;
    const progress = 1 - (this.transformTimer / 60);

    // Cocoon body — shifts from green to rainbow
    ctx.save();
    ctx.translate(cx, cy);

    // Glowing aura
    ctx.fillStyle = `rgba(255,255,100,${0.2 + progress * 0.3})`;
    ctx.beginPath();
    ctx.arc(0, 0, 18 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Cocoon shape
    ctx.fillStyle = `hsl(${120 - progress * 120}, 60%, ${30 + progress * 20}%)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + pulse * 0.5, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle particles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + this.transformTimer * 0.2;
      const dist = 12 + pulse;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      ctx.fillStyle = this.caterpillarColors[i % 7];
      ctx.globalAlpha = 0.5 + progress * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  drawButterfly(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const cx = x + this.width / 2;
    const cy = y + this.height / 2;

    // Wing flap speed: faster when actively flapping, gentle when gliding
    const flapSpeed = this.isFlapping ? 0.5 : 0.15;
    const flapAmount = this.isFlapping ? 0.7 : 0.3;
    const wingFlap = Math.sin(this.butterflyTimer * flapSpeed) * flapAmount;

    ctx.save();
    ctx.translate(cx, cy);

    // Wings — rainbow colored, symmetrical
    const colors = this.caterpillarColors;

    // Left wings
    ctx.save();
    ctx.scale(1 - Math.abs(wingFlap) * 0.3, 1);

    // Upper left wing
    ctx.fillStyle = colors[0]; // red
    ctx.beginPath();
    ctx.ellipse(-10, -6, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Inner pattern
    ctx.fillStyle = colors[1]; // orange
    ctx.beginPath();
    ctx.ellipse(-10, -6, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[2]; // yellow
    ctx.beginPath();
    ctx.ellipse(-10, -6, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Lower left wing
    ctx.fillStyle = colors[4]; // blue
    ctx.beginPath();
    ctx.ellipse(-8, 6, 9, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[5]; // indigo
    ctx.beginPath();
    ctx.ellipse(-8, 6, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Right wings
    ctx.save();
    ctx.scale(1 - Math.abs(wingFlap) * 0.3, 1);

    // Upper right wing
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(10, -6, 12, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.ellipse(10, -6, 8, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[2];
    ctx.beginPath();
    ctx.ellipse(10, -6, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Lower right wing
    ctx.fillStyle = colors[4];
    ctx.beginPath();
    ctx.ellipse(8, 6, 9, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors[5];
    ctx.beginPath();
    ctx.ellipse(8, 6, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Body
    ctx.fillStyle = colors[3]; // green
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(0, -10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-2 + this.facing, -11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2 + this.facing, -11, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-1.5 + this.facing, -10.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2.5 + this.facing, -10.5, 1, 0, Math.PI * 2);
    ctx.fill();

    // Antennae — curled
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const antBob = Math.sin(this.butterflyTimer * 0.1) * 2;
    ctx.beginPath();
    ctx.moveTo(-2, -13);
    ctx.quadraticCurveTo(-6, -20 + antBob, -8, -18 + antBob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -13);
    ctx.quadraticCurveTo(6, -20 - antBob, 8, -18 - antBob);
    ctx.stroke();

    // Antenna tips
    ctx.fillStyle = colors[6]; // violet
    ctx.beginPath();
    ctx.arc(-8, -18 + antBob, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -18 - antBob, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
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
    } else if (character === 'numberblock4') {
      const s = size / 2;
      const cx = x + size / 2;
      const cy = y + size / 2;
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(timer * 0.03) * 0.2);
      const bodyColor = '#33AA44';
      const positions = [
        { x: -s, y: -s }, { x: 0, y: -s },
        { x: -s, y: 0 },  { x: 0, y: 0 },
      ];
      for (const p of positions) {
        ctx.fillStyle = bodyColor;
        ctx.fillRect(p.x, p.y, s, s);
        ctx.fillStyle = '#55CC66';
        ctx.fillRect(p.x, p.y, s, 2);
        ctx.fillRect(p.x, p.y, 2, s);
        ctx.fillStyle = '#228833';
        ctx.fillRect(p.x, p.y + s - 2, s, 2);
        ctx.fillRect(p.x + s - 2, p.y, 2, s);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.strokeRect(p.x, p.y, s, s);
      }
      // Single face centered
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-5, -3, 4, 4);
      ctx.fillRect(1, -3, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(-4, -1, 2, 2);
      ctx.fillRect(2, -1, 2, 2);
      ctx.fillRect(-2, 4, 4, 2);
      // Number
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = `bold ${Math.floor(size * 0.35)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('4', 0, 0);
    } else if (character === 'caterpillar') {
      const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00CC00', '#0000FF', '#4B0082', '#8B00FF'];
      const r = size / 8;
      const cx = x + size / 2;
      const cy = y + size / 2 + r;

      // Draw segments in a slight wave
      for (let i = 6; i >= 0; i--) {
        const bob = Math.sin(timer * 0.08 + i * 0.9) * 3;
        const sx = cx + (3 - i) * r * 1.3;
        const sy = cy + bob;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[i];
        ctx.fill();
        // Highlight
        ctx.beginPath();
        ctx.arc(sx, sy - 1, r * 0.5, Math.PI, 0);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
      }

      // Face on head (index 0 = rightmost)
      const hx = cx + 3 * r * 1.3;
      const hy = cy + Math.sin(timer * 0.08) * 3;
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(hx - 2, hy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 2, hy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(hx - 1, hy, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 3, hy, 1, 0, Math.PI * 2);
      ctx.fill();
      // Antennae
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      const ab = Math.sin(timer * 0.1) * 2;
      ctx.beginPath();
      ctx.moveTo(hx - 1, hy - r);
      ctx.lineTo(hx - 3, hy - r - 6 + ab);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hx + 1, hy - r);
      ctx.lineTo(hx + 3, hy - r - 6 - ab);
      ctx.stroke();
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(hx - 3, hy - r - 6 + ab, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 3, hy - r - 6 - ab, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
