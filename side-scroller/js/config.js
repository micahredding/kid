// =============================================================================
// CONFIGURATION — All tunable game parameters in one place
// =============================================================================

export const CONFIG = {
  // Display
  canvas: {
    width: 960,
    height: 540,
    backgroundColor: '#5c94fc',
  },

  // Tile grid
  tile: {
    size: 32,
  },

  // Player physics — tuned for Mario-like feel
  player: {
    // Horizontal movement
    groundAcceleration: 0.6,
    groundDeceleration: 0.8,
    skidDeceleration: 1.5,        // when reversing direction
    airAcceleration: 0.4,
    airDeceleration: 0.3,
    maxRunSpeed: 4.5,
    maxSprintSpeed: 6.5,

    // Jumping
    jumpVelocity: -10.5,          // initial jump impulse
    jumpCutMultiplier: 0.4,       // velocity multiplied by this when releasing jump early
    gravity: 0.55,
    fallingGravity: 0.7,          // higher gravity on descent for snappy feel
    maxFallSpeed: 12,

    // Double jump (set enabled: false for classic Mario feel)
    doubleJump: {
      enabled: false,
      velocity: -9,
    },

    // Coyote time — frames after leaving ground where jump still works
    coyoteFrames: 6,

    // Jump buffer — frames before landing where jump input is remembered
    jumpBufferFrames: 6,

    // Dimensions
    width: 24,
    height: 32,

    // Lives
    startingLives: 3,

    // Invincibility frames after taking damage
    invincibilityFrames: 90,

    // Wall slide / wall jump
    wallSlide: {
      enabled: true,
      fallSpeed: 1.5,           // max fall speed while wall sliding
      jumpVelocityX: 6,         // horizontal kick-off speed
      jumpVelocityY: -9.5,      // vertical jump speed off wall
      stickFrames: 6,           // frames of input leniency to wall jump
    },
  },

  // Camera
  camera: {
    // Deadzone — player can move this far from center before camera follows
    deadzoneLeft: 0.35,    // fraction of screen width
    deadzoneRight: 0.55,
    deadzoneTop: 0.3,
    deadzoneBottom: 0.7,
    smoothing: 0.1,        // lerp factor (1 = instant, 0 = no movement)
    lookAheadX: 50,        // pixels ahead of player in facing direction
  },

  // Enemies
  enemies: {
    goomba: {
      width: 28,
      height: 28,
      speed: 1,
      bounceVelocity: -8,  // player bounce when stomping
    },
    koopa: {
      width: 28,
      height: 38,
      speed: 1.2,
      shellSpeed: 6,
      bounceVelocity: -8,
    },
    flyguy: {
      width: 28,
      height: 28,
      speed: 1.5,
      verticalRange: 48,
      verticalSpeed: 0.03,
      bounceVelocity: -8,
    },
    spiker: {
      width: 30,
      height: 30,
      speed: 0.8,
      bounceVelocity: -8,
    },
  },

  // Pushable blocks
  pushBlock: {
    pushSpeed: 2,
    width: 32,
    height: 32,
  },

  // Collectibles
  collectibles: {
    coin: {
      width: 20,
      height: 24,
      points: 100,
      bobAmplitude: 3,
      bobSpeed: 0.05,
    },
  },

  // Moving platforms
  movingPlatform: {
    defaultSpeed: 1,
    defaultRange: 128,
  },

  // Scoring
  scoring: {
    enemyStomp: 200,
    extraLifeAt: 10000,
  },
};
