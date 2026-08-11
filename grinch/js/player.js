// =============================================================================
// PLAYER — Grinch (or Max) with Mario-like physics.
//
// The physics core (coyote time, jump buffer, variable jump, wall slide,
// block carrying) is unchanged from the side-scroller engine. What's new is
// the pose layer: every frame we reduce the physics state to a small set of
// animation parameters (mode, walk phase, lean, squash, grin) and hand them
// to the path-based figures in characters.js.
//
// Movement personality: walking IS sneaking — the Grinch tiptoes everywhere
// by default. Hold sprint to break into a run.
// =============================================================================

import { CONFIG } from './config.js';
import { resolveEntityTileCollisions, getTouchingWall } from './physics.js';
import { drawGrinch, drawMax } from './characters.js';

const STATES = {
  IDLE: 'idle',
  SNEAKING: 'sneaking',
  RUNNING: 'running',
  JUMPING: 'jumping',
  FALLING: 'falling',
  SKIDDING: 'skidding',
  WALL_SLIDING: 'wall_sliding',
};

const CHARACTER_SIZES = {
  grinch: { width: 24, height: 36 },
  max: { width: 34, height: 24 },
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
    this.isJumping = false;
    this.hasDoubleJumped = false;
    this.jumpHeld = false;

    // Wall slide/jump state
    this.wallDir = 0;
    this.wallSlideTimer = 0;

    // Carrying blocks
    this.carriedBlock = null;

    // Invincibility
    this.invincibleTimer = 0;

    // Score and lives
    this.score = 0;
    this.lives = p.startingLives;
    this.presents = 0;     // presents in the sack
    this.keys = [];
    this.housesLit = 0;    // World 4: houses given their presents back

    // Callbacks
    this.onHitBlock = null;
    this.onDeath = null;
    this.onCollectPresent = null;
    this.onLightHouse = null;

    // Animation state
    this.character = 'grinch'; // 'grinch' | 'max'
    this.walkPhase = 0;        // advances with distance travelled
    this.time = 0;             // frame counter for ambient wiggles
    this.landSquash = 0;       // 0..1 impulse on landing, decays
    this.grinTimer = 0;        // big grin + happy eyes after a collect
    this.prevOnGround = false;
    this.prevVy = 0;

    // The other character trots along behind (Max follows the Grinch;
    // the Grinch skulks after Max)
    this.follower = {
      x: x - 44, y,
      width: 30, height: 22,
      vx: 0, vy: 0,
      walkPhase: 0,
      earLag: 0,
    };
  }

  update(input, level) {
    const p = CONFIG.player;
    this.time++;

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
      if (Math.abs(this.vx) < decel) {
        this.vx = 0;
      } else {
        this.vx -= Math.sign(this.vx) * decel;
      }
    }

    // Clamp horizontal speed (soft when above the cap, e.g. after wall jump)
    if (this.vx > maxSpeed) this.vx = Math.max(maxSpeed, this.vx - 0.2);
    if (this.vx < -maxSpeed) this.vx = Math.min(-maxSpeed, this.vx + 0.2);

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
    } else if (input.jumpPressed && !canJump && p.doubleJump.enabled && !this.hasDoubleJumped && !this.onGround) {
      this.vy = p.doubleJump.velocity;
      this.isJumping = true;
      this.jumpHeld = true;
      this.hasDoubleJumped = true;
    }

    // Variable jump height
    if (input.jumpReleased && this.isJumping && this.vy < 0) {
      this.vy *= p.jumpCutMultiplier;
      this.isJumping = false;
    }

    if (!input.jump) {
      this.jumpHeld = false;
      this.isJumping = false;
    }

    // --- Gravity ---
    const gravity = this.vy > 0 ? p.fallingGravity : p.gravity;
    this.vy += gravity;
    if (this.vy > p.maxFallSpeed) {
      this.vy = p.maxFallSpeed;
    }

    // --- Collision resolution ---
    const fallSpeed = this.vy;
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

    // Landing squash — proportional to how hard we hit
    if (this.onGround && !this.prevOnGround && fallSpeed > 3) {
      this.landSquash = Math.min(1, fallSpeed / CONFIG.player.maxFallSpeed);
    }
    this.landSquash *= 0.82;
    this.prevOnGround = this.onGround;
    this.prevVy = this.vy;

    // --- Wall slide / wall jump ---
    if (p.wallSlide.enabled && !this.onGround) {
      const wall = getTouchingWall(this, level);
      if (wall !== 0 && this.vy > 0) {
        const pressingIntoWall = (wall === -1 && input.left) || (wall === 1 && input.right);
        if (pressingIntoWall) {
          this.wallDir = wall;
          this.wallSlideTimer = p.wallSlide.stickFrames;
          if (this.vy > p.wallSlide.fallSpeed) {
            this.vy = p.wallSlide.fallSpeed;
          }
        }
      }

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
        // walking is sneaking; sprinting is running
        this.state = input.sprint && Math.abs(this.vx) > CONFIG.player.maxRunSpeed + 0.3
          ? STATES.RUNNING : STATES.SNEAKING;
      } else {
        this.state = STATES.IDLE;
      }
    }

    // --- Animation phase (advances with distance so feet don't skate) ---
    this.walkPhase += Math.abs(this.vx) * (this.state === STATES.SNEAKING ? 0.09 : 0.13);
    if (this.grinTimer > 0) this.grinTimer--;

    // --- Follower ---
    this.updateFollower();

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

  celebrate() {
    // the sly grin spreads ear to ear
    this.grinTimer = 35;
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
    const size = CHARACTER_SIZES[this.character] || CHARACTER_SIZES.grinch;
    this.width = size.width;
    this.height = size.height;
  }

  // Switch between Grinch and Max mid-game, keeping feet planted.
  // Returns false (no switch) if the new shape wouldn't fit where we stand.
  switchCharacter(newChar, level) {
    const oldBottom = this.y + this.height;
    const oldCenterX = this.x + this.width / 2;

    const size = CHARACTER_SIZES[newChar] || CHARACTER_SIZES.grinch;
    const newX = oldCenterX - size.width / 2;
    const newY = oldBottom - size.height;

    // Fit check against solid tiles
    const ts = CONFIG.tile.size;
    const left = Math.floor(newX / ts);
    const right = Math.floor((newX + size.width - 1) / ts);
    const top = Math.floor(newY / ts);
    const bottom = Math.floor((newY + size.height - 1) / ts);
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        if (row < 0 || row >= level.tiles.length) continue;
        if (col < 0 || col >= level.tiles[row].length) continue;
        const ch = level.tiles[row][col];
        if (ch && ch !== ' ' && ch !== 'I') return false;
      }
    }

    this.character = newChar;
    this.x = newX;
    this.y = newY;
    this.width = size.width;
    this.height = size.height;
    this.walkPhase = 0;
    this.resetFollowerPosition();
    if (this.carriedBlock) {
      this.carriedBlock.x = this.x + (this.width - this.carriedBlock.width) / 2;
      this.carriedBlock.y = this.y - this.carriedBlock.height;
    }
    return true;
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

  // ---------------------------------------------------------------------------
  // FOLLOWER — spring-chase with a teleport catch-up, like the original engine
  // ---------------------------------------------------------------------------
  updateFollower() {
    const f = this.follower;
    // follower is whichever character we're NOT playing
    const followerIsMax = this.character === 'grinch';
    f.width = followerIsMax ? 30 : 20;
    f.height = followerIsMax ? 22 : 30;

    const targetX = this.x + (this.facing === 1 ? -f.width - 10 : this.width + 10);
    const targetY = this.y + this.height - f.height - 2;

    const dx = targetX - f.x;
    const dy = targetY - f.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 110) {
      f.x = targetX;
      f.y = targetY;
      f.vx = 0;
      f.vy = 0;
    } else {
      f.vx += dx * 0.14;
      f.vy += (dy + 1) * 0.14;
      f.vx *= 0.8;
      f.vy *= 0.8;
      const maxSpeed = 7;
      if (Math.abs(f.vx) > maxSpeed) f.vx = Math.sign(f.vx) * maxSpeed;
      if (Math.abs(f.vy) > maxSpeed) f.vy = Math.sign(f.vy) * maxSpeed;
      f.x += f.vx;
      f.y += f.vy;
    }

    f.walkPhase += Math.abs(f.vx) * 0.2;
    // ears/antler lag behind vertical motion with a spring
    f.earLag += (-f.vy * 1.6 - f.earLag) * 0.25;
    f.earLag = Math.max(-6, Math.min(6, f.earLag));
  }

  resetFollowerPosition() {
    const f = this.follower;
    f.x = this.x + (this.facing === 1 ? -f.width - 10 : this.width + 10);
    f.y = this.y + this.height - f.height - 2;
    f.vx = 0;
    f.vy = 0;
    f.earLag = 0;
  }

  // ---------------------------------------------------------------------------
  // DRAWING — reduce physics state to pose parameters
  // ---------------------------------------------------------------------------
  draw(ctx, theme) {
    // Blink during invincibility
    const blinking = this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0;

    this.drawFollower(ctx, theme);
    if (blinking) return;

    const mode = this.poseMode();
    const feetX = this.x + this.width / 2;
    const feetY = this.y + this.height;

    // squash & stretch, anchored at the feet
    let squashX = 1, squashY = 1;
    if (this.landSquash > 0.05) {
      squashY = 1 - this.landSquash * 0.28;
      squashX = 1 + this.landSquash * 0.32;
    } else if (!this.onGround) {
      const stretch = Math.min(Math.abs(this.vy) * 0.014, 0.14);
      squashY = 1 + stretch;
      squashX = 1 - stretch * 0.6;
    }

    // forward lean
    let lean = 0;
    if (mode === 'sneak') lean = 0.2;
    else if (mode === 'run') lean = 0.16 + Math.min(Math.abs(this.vx) * 0.015, 0.1);
    else if (mode === 'skid') lean = -0.25;
    else if (mode === 'wallslide') lean = -0.1;

    const grin = this.grinTimer > 0 ? 1 : (mode === 'run' ? 0.6 : 0.4);
    const eyes = this.grinTimer > 0 ? 'happy'
      : (mode === 'jump' || mode === 'fall') ? 'wide' : 'sly';

    if (this.character === 'grinch') {
      drawGrinch(ctx, {
        cx: feetX, feetY, h: this.height,
        facing: this.facing, squashX, squashY,
        lean, phase: this.walkPhase, mode,
        grin, eyes,
        armsUp: !!this.carriedBlock,
        suit: theme.santaSuit,
        time: this.time,
      });
    } else {
      drawMax(ctx, {
        cx: feetX, feetY, h: this.height,
        facing: this.facing, squashX, squashY,
        phase: this.walkPhase,
        mode: mode === 'sneak' || mode === 'run' || mode === 'skid' ? 'trot'
          : (mode === 'jump' || mode === 'fall') ? 'jump' : 'idle',
        time: this.time,
        earLag: Math.max(-6, Math.min(6, -this.vy * 1.2)),
      });
    }
  }

  poseMode() {
    switch (this.state) {
      case STATES.SNEAKING: return 'sneak';
      case STATES.RUNNING: return 'run';
      case STATES.JUMPING: return 'jump';
      case STATES.FALLING: return 'fall';
      case STATES.SKIDDING: return 'skid';
      case STATES.WALL_SLIDING: return 'wallslide';
      default: return 'idle';
    }
  }

  drawFollower(ctx, theme) {
    const f = this.follower;
    const cx = f.x + f.width / 2;
    const feetY = f.y + f.height;
    const facing = f.vx > 0.3 ? 1 : f.vx < -0.3 ? -1 : this.facing;
    const moving = Math.abs(f.vx) > 0.6;

    if (this.character === 'grinch') {
      drawMax(ctx, {
        cx, feetY, h: f.height,
        facing,
        phase: f.walkPhase,
        mode: moving ? 'trot' : 'idle',
        time: this.time,
        earLag: f.earLag,
      });
    } else {
      drawGrinch(ctx, {
        cx, feetY, h: f.height,
        facing,
        lean: moving ? 0.2 : 0,
        phase: f.walkPhase * 0.6,
        mode: moving ? 'sneak' : 'idle',
        grin: 0.4, eyes: 'sly',
        suit: theme.santaSuit,
        time: this.time,
      });
    }
  }

  // Title-screen previews
  static drawPreview(ctx, character, x, y, size, timer) {
    ctx.save();
    if (character === 'grinch') {
      drawGrinch(ctx, {
        cx: x + size / 2, feetY: y + size, h: size * 0.9,
        facing: 1,
        lean: 0.18,
        phase: timer * 0.08,
        mode: 'sneak',
        grin: 0.5 + Math.sin(timer * 0.05) * 0.4,
        eyes: 'sly',
        suit: true,
        time: timer,
      });
    } else if (character === 'max') {
      drawMax(ctx, {
        cx: x + size / 2, feetY: y + size, h: size * 0.55,
        facing: 1,
        phase: timer * 0.15,
        mode: 'trot',
        time: timer,
        earLag: Math.sin(timer * 0.1) * 2,
      });
    }
    ctx.restore();
  }
}
