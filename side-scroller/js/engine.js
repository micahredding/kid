// =============================================================================
// ENGINE — Main game loop, state management, HUD
// =============================================================================

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Particle } from './entities.js';
import { loadLevel, drawTiles, drawBackground, drawGoalFlag, LEVELS } from './level.js';

const GAME_STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
};

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.camera = new Camera();

    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    // Crisp pixel rendering
    this.ctx.imageSmoothingEnabled = false;

    this.gameState = GAME_STATES.TITLE;
    this.currentLevel = 0;
    this.player = null;
    this.level = null;
    this.entities = [];
    this.particles = [];
    this.transitionTimer = 0;

    // Start game loop
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedDt = 1000 / 60; // 60 FPS physics
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _loop(now) {
    const dt = Math.min(now - this.lastTime, 50); // cap delta to avoid spiral
    this.lastTime = now;
    this.accumulator += dt;

    // Fixed timestep for deterministic physics
    while (this.accumulator >= this.fixedDt) {
      this.input.update();
      this.update();
      this.accumulator -= this.fixedDt;
    }

    this.draw();
    requestAnimationFrame(this._loop);
  }

  startLevel(index) {
    this.currentLevel = index;
    this.level = loadLevel(index);
    this.entities = [...this.level.entities];
    this.particles = [];

    const prevScore = this.player ? this.player.score : 0;
    const prevLives = this.player ? this.player.lives : CONFIG.player.startingLives;
    const prevCoins = this.player ? this.player.coins : 0;

    this.player = new Player(this.level.playerX, this.level.playerY);
    this.player.score = prevScore;
    this.player.lives = prevLives;
    this.player.coins = prevCoins;

    this.player.onDeath = () => {
      if (this.player.lives <= 0) {
        this.gameState = GAME_STATES.GAME_OVER;
        this.transitionTimer = 180;
      } else {
        this.player.lives--;
        this.respawnPlayer();
      }
    };

    this.player.onHitBlock = (col, row, ch) => {
      if (ch === '?') {
        // Replace with empty block and spawn coin
        const rowStr = this.level.tiles[row];
        this.level.tiles[row] = rowStr.substring(0, col) + 'S' + rowStr.substring(col + 1);
        // Spawn particles
        for (let i = 0; i < 6; i++) {
          this.particles.push(new Particle(
            col * CONFIG.tile.size + CONFIG.tile.size / 2,
            row * CONFIG.tile.size,
            (Math.random() - 0.5) * 4,
            -Math.random() * 5 - 2,
            '#FFD700',
            20,
          ));
        }
        this.player.addScore(CONFIG.collectibles.coin.points);
        this.player.coins++;
      }
    };

    // Initialize camera centered on player, clamped to level bounds
    const camX = Math.max(0, Math.min(
      this.level.playerX - CONFIG.canvas.width / 3,
      this.level.width - CONFIG.canvas.width
    ));
    const camY = Math.max(0, Math.min(
      this.level.playerY - CONFIG.canvas.height / 2,
      this.level.height - CONFIG.canvas.height
    ));
    this.camera.x = camX;
    this.camera.y = camY;
    this.camera.targetX = camX;
    this.camera.targetY = camY;

    this.gameState = GAME_STATES.PLAYING;
  }

  respawnPlayer() {
    this.player.x = this.level.playerX;
    this.player.y = this.level.playerY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invincibleTimer = CONFIG.player.invincibilityFrames;
  }

  update() {
    switch (this.gameState) {
      case GAME_STATES.TITLE:
        if (this.input.jumpPressed || this.input.wasPressed('Enter')) {
          this.startLevel(0);
        }
        break;

      case GAME_STATES.PLAYING:
        this.updatePlaying();
        break;

      case GAME_STATES.LEVEL_COMPLETE:
        this.transitionTimer--;
        if (this.transitionTimer <= 0) {
          if (this.currentLevel + 1 < LEVELS.length) {
            this.startLevel(this.currentLevel + 1);
          } else {
            this.gameState = GAME_STATES.TITLE;
          }
        }
        break;

      case GAME_STATES.GAME_OVER:
        this.transitionTimer--;
        if (this.transitionTimer <= 0) {
          if (this.input.jumpPressed || this.input.wasPressed('Enter')) {
            this.gameState = GAME_STATES.TITLE;
          }
        }
        break;
    }
  }

  updatePlaying() {
    // Player
    this.player.update(this.input, this.level);

    // Entities
    this.entities = this.entities.filter(e => {
      const alive = e.update(this.level);
      if (e.checkPlayerCollision) {
        e.checkPlayerCollision(this.player);
      }
      return alive;
    });

    // Particles
    this.particles = this.particles.filter(p => p.update());

    // Camera
    this.camera.update(this.player, this.level.width, this.level.height);

    // Check goal
    if (this.player.x >= this.level.goalCol) {
      this.gameState = GAME_STATES.LEVEL_COMPLETE;
      this.transitionTimer = 120;
      this.player.addScore(1000);
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    switch (this.gameState) {
      case GAME_STATES.TITLE:
        this.drawTitle();
        break;

      case GAME_STATES.PLAYING:
      case GAME_STATES.LEVEL_COMPLETE:
        this.drawGame();
        break;

      case GAME_STATES.GAME_OVER:
        this.drawGameOver();
        break;
    }
  }

  drawGame() {
    const ctx = this.ctx;
    const theme = this.level.theme;

    // Background (drawn in screen space with parallax)
    drawBackground(ctx, theme, this.camera, this.level.width);

    // World space
    ctx.save();
    this.camera.apply(ctx);

    // Tiles
    drawTiles(ctx, this.level.tiles, theme, this.camera);

    // Goal flag
    drawGoalFlag(ctx, this.level.goalCol, this.level.height);

    // Entities
    for (const e of this.entities) {
      e.draw(ctx, theme);
    }

    // Player
    this.player.draw(ctx, theme);

    // Particles
    for (const p of this.particles) {
      p.draw(ctx);
    }

    ctx.restore();

    // HUD (screen space)
    this.drawHUD();

    // Level complete overlay
    if (this.gameState === GAME_STATES.LEVEL_COMPLETE) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', this.canvas.width / 2, this.canvas.height / 2);
      ctx.font = '18px monospace';
      ctx.fillText(`+1000 points`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }

  drawHUD() {
    const ctx = this.ctx;
    const p = this.player;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.canvas.width, 36);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${p.score}`, 16, 24);

    ctx.textAlign = 'center';
    ctx.fillText(`COINS: ${p.coins}`, this.canvas.width / 2, 24);

    ctx.textAlign = 'right';
    ctx.fillText(`LIVES: ${p.lives}`, this.canvas.width - 16, 24);

    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    ctx.fillText(this.level.name, this.canvas.width / 2, 12);
  }

  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIDE-SCROLLER', this.canvas.width / 2, this.canvas.height / 2 - 60);

    ctx.font = 'bold 24px monospace';
    ctx.fillText('ENGINE', this.canvas.width / 2, this.canvas.height / 2 - 20);

    ctx.font = '18px monospace';
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
      ctx.fillText('PRESS SPACE OR ENTER TO START', this.canvas.width / 2, this.canvas.height / 2 + 40);
    }

    ctx.font = '14px monospace';
    ctx.fillStyle = '#AAD';
    ctx.fillText('Arrow Keys / WASD — Move & Jump', this.canvas.width / 2, this.canvas.height / 2 + 90);
    ctx.fillText('Space — Jump    Shift — Sprint', this.canvas.width / 2, this.canvas.height / 2 + 112);
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);

    ctx.font = '20px monospace';
    ctx.fillText(`Final Score: ${this.player.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

    if (this.transitionTimer <= 0) {
      const blink = Math.floor(Date.now() / 500) % 2;
      if (blink) {
        ctx.font = '18px monospace';
        ctx.fillText('PRESS SPACE TO CONTINUE', this.canvas.width / 2, this.canvas.height / 2 + 70);
      }
    }
  }
}
