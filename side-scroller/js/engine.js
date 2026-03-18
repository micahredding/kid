// =============================================================================
// ENGINE — Main game loop, state management, HUD
// =============================================================================

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Particle, PushBlock } from './entities.js';
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

    // Character selection
    this.characters = ['classic', 'block', 'numberblock4', 'caterpillar'];
    this.characterNames = { classic: 'CLASSIC', block: 'ROLLER', numberblock4: 'FOUR', caterpillar: 'CATERPILLAR' };
    this.selectedCharacter = 0;
    this.titleTimer = 0;

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
    this.player.character = this.characters[this.selectedCharacter];
    this.player.applyCharacterSize();
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
        this.titleTimer++;
        if (this.input.wasPressed('ArrowLeft') || this.input.wasPressed('a')) {
          this.selectedCharacter = (this.selectedCharacter - 1 + this.characters.length) % this.characters.length;
        }
        if (this.input.wasPressed('ArrowRight') || this.input.wasPressed('d')) {
          this.selectedCharacter = (this.selectedCharacter + 1) % this.characters.length;
        }
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

    // Pick up / place blocks
    if (this.input.actionPressed) {
      if (this.player.carriedBlock) {
        // Place or throw — throw if sprinting
        if (this.input.sprint) {
          this.player.throwBlock();
        } else {
          this.player.placeBlock();
        }
      } else {
        // Try to pick up a nearby push block
        const pickup = this.findNearbyBlock();
        if (pickup) {
          this.player.pickUpBlock(pickup);
        }
      }
    }

    // Entities
    this.entities = this.entities.filter(e => {
      const alive = e.update(this.level);
      if (e.checkPlayerCollision) {
        e.checkPlayerCollision(this.player);
      }
      return alive;
    });

    // Block-on-block stacking
    const blocks = this.entities.filter(e => e.type === 'pushblock' && !e.carried);
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        blocks[i].checkBlockCollision(blocks[j]);
        blocks[j].checkBlockCollision(blocks[i]);
      }
    }

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

  findNearbyBlock() {
    const p = this.player;
    const reach = 8; // pixels of extra reach beyond player hitbox
    const pickupBox = {
      x: p.x - reach,
      y: p.y - reach,
      width: p.width + reach * 2,
      height: p.height + reach * 2,
    };
    for (const e of this.entities) {
      if (e.type === 'pushblock' && !e.carried) {
        if (
          e.x < pickupBox.x + pickupBox.width &&
          e.x + e.width > pickupBox.x &&
          e.y < pickupBox.y + pickupBox.height &&
          e.y + e.height > pickupBox.y
        ) {
          return e;
        }
      }
    }
    return null;
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
    const cx = this.canvas.width / 2;
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SIDE-SCROLLER', cx, 100);

    ctx.font = 'bold 24px monospace';
    ctx.fillText('ENGINE', cx, 135);

    // Character selection
    ctx.font = '16px monospace';
    ctx.fillStyle = '#AAD';
    ctx.fillText('< SELECT CHARACTER >', cx, 200);

    const charCount = this.characters.length;
    const previewSize = 48;
    const spacing = 120;
    const startX = cx - ((charCount - 1) * spacing) / 2;

    for (let i = 0; i < charCount; i++) {
      const px = startX + i * spacing - previewSize / 2;
      const py = 220;
      const charId = this.characters[i];
      const selected = i === this.selectedCharacter;

      // Selection highlight
      if (selected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(px - 8, py - 8, previewSize + 16, previewSize + 28);

        // Bouncing arrow above
        const bounce = Math.sin(this.titleTimer * 0.1) * 4;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(px + previewSize / 2, py - 16 + bounce);
        ctx.lineTo(px + previewSize / 2 - 6, py - 24 + bounce);
        ctx.lineTo(px + previewSize / 2 + 6, py - 24 + bounce);
        ctx.fill();
      }

      // Character preview
      Player.drawPreview(ctx, charId, px, py, previewSize, this.titleTimer);

      // Name
      ctx.fillStyle = selected ? '#FFD700' : '#AAD';
      ctx.font = selected ? 'bold 14px monospace' : '12px monospace';
      ctx.fillText(this.characterNames[charId], px + previewSize / 2, py + previewSize + 14);
    }

    // Start prompt
    ctx.font = '18px monospace';
    ctx.fillStyle = '#FFF';
    const blink = Math.floor(Date.now() / 500) % 2;
    if (blink) {
      ctx.fillText('PRESS SPACE OR ENTER TO START', cx, 340);
    }

    // Controls
    ctx.font = '14px monospace';
    ctx.fillStyle = '#AAD';
    ctx.fillText('Arrow Keys / WASD \u2014 Move & Jump', cx, 390);
    ctx.fillText('Space \u2014 Jump    Shift \u2014 Sprint', cx, 410);
    ctx.fillText('Down/S/X \u2014 Pick up & Place blocks', cx, 430);
    ctx.fillText('C/E \u2014 Transform (FOUR)', cx, 450);
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
