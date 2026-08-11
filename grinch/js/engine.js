// =============================================================================
// ENGINE — Main game loop, state management, story cards, HUD
// =============================================================================

import { CONFIG } from './config.js';
import { Input } from './input.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Particle } from './entities.js';
import { loadLevel, drawTiles, drawBackground, drawGoal, LEVELS } from './level.js';
import { drawPresent, drawHeart, drawSleigh } from './characters.js';
import { Music } from './music.js';

const GAME_STATES = {
  TITLE: 'title',
  STORY: 'story',
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
    this.music = new Music();

    canvas.width = CONFIG.canvas.width;
    canvas.height = CONFIG.canvas.height;

    this.ctx.imageSmoothingEnabled = false;

    this.gameState = GAME_STATES.TITLE;
    this.currentLevel = 0;
    this.player = null;
    this.level = null;
    this.entities = [];
    this.particles = [];
    this.transitionTimer = 0;
    this.storyTimer = 0;
    this.time = 0; // global frame counter for ambient animation

    // Character selection
    this.characters = ['grinch', 'max'];
    this.characterNames = { grinch: 'THE GRINCH', max: 'MAX' };
    this.selectedCharacter = 0;
    this.titleTimer = 0;

    // Start game loop
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedDt = 1000 / 60;
    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _loop(now) {
    const dt = Math.min(now - this.lastTime, 50);
    this.lastTime = now;
    this.accumulator += dt;

    while (this.accumulator >= this.fixedDt) {
      this.input.update();
      this.update();
      this.accumulator -= this.fixedDt;
    }

    this.draw();
    requestAnimationFrame(this._loop);
  }

  startLevel(index, { showStory = true } = {}) {
    this.currentLevel = index;
    this.level = loadLevel(index);
    this.entities = [...this.level.entities];
    this.particles = [];

    const prevScore = this.player ? this.player.score : 0;
    const prevLives = this.player ? this.player.lives : CONFIG.player.startingLives;
    const prevPresents = this.player ? this.player.presents : 0;
    const prevKeys = this.player ? this.player.keys : [];

    this.player = new Player(this.level.playerX, this.level.playerY);
    this.player.character = this.characters[this.selectedCharacter];
    this.player.applyCharacterSize();
    this.player.y = this.level.playerY + (CONFIG.player.height - this.player.height);
    this.player.resetFollowerPosition();
    this.player.score = prevScore;
    this.player.lives = prevLives;
    this.player.presents = prevPresents;
    this.player.keys = [...prevKeys];
    this.player.housesLit = 0;

    this.player.onDeath = () => {
      if (this.player.lives <= 0) {
        this.gameState = GAME_STATES.GAME_OVER;
        this.transitionTimer = 180;
        this.music.stop();
      } else {
        this.player.lives--;
        this.respawnPlayer();
      }
    };

    this.player.onHitBlock = (col, row, ch) => {
      if (ch === '?') {
        const rowStr = this.level.tiles[row];
        this.level.tiles[row] = rowStr.substring(0, col) + 'S' + rowStr.substring(col + 1);
        for (let i = 0; i < 8; i++) {
          this.particles.push(new Particle(
            col * CONFIG.tile.size + CONFIG.tile.size / 2,
            row * CONFIG.tile.size,
            (Math.random() - 0.5) * 4,
            -Math.random() * 5 - 2,
            i % 2 ? '#FFD700' : '#cc2936',
            22,
          ));
        }
        this.player.presents++;
        this.player.celebrate();
        this.player.addScore(CONFIG.collectibles.present.points);
        this.music.sfx('pop');
      }
    };

    this.player.onCollectPresent = (present) => {
      for (let i = 0; i < 6; i++) {
        this.particles.push(new Particle(
          present.x + present.width / 2,
          present.y + present.height / 2,
          (Math.random() - 0.5) * 3,
          -Math.random() * 3 - 1,
          i % 2 ? '#FFD700' : '#FFFFFF',
          18,
        ));
      }
      this.music.sfx('pop');
    };

    this.player.onLightHouse = (house) => {
      // a burst of warm light and hearts
      for (let i = 0; i < 14; i++) {
        this.particles.push(new Particle(
          house.x + house.width / 2,
          house.y + house.height / 2,
          (Math.random() - 0.5) * 6,
          -Math.random() * 4 - 1,
          i % 3 === 0 ? '#e04858' : '#ffd878',
          35,
        ));
      }
      this.music.sfx('chime');
    };

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

    if (showStory && this.level.story.length) {
      this.gameState = GAME_STATES.STORY;
      this.storyTimer = 0;
    } else {
      this.gameState = GAME_STATES.PLAYING;
    }
  }

  respawnPlayer() {
    this.player.x = this.level.playerX;
    this.player.y = this.level.playerY + (CONFIG.player.height - this.player.height);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invincibleTimer = CONFIG.player.invincibilityFrames;
    this.player.resetFollowerPosition();
  }

  update() {
    this.time++;

    // music toggle anywhere
    if (this.input.wasPressed('m') || this.input.wasPressed('M')) {
      this.music.toggleMute();
    }

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
          this.player = null;
          this.music.start();
          this.startLevel(0);
        }
        for (let i = 0; i < LEVELS.length; i++) {
          if (this.input.wasPressed(String(i + 1))) {
            this.player = null;
            this.music.start();
            this.startLevel(i);
          }
        }
        break;

      case GAME_STATES.STORY:
        this.storyTimer++;
        if (this.storyTimer > 30 && (this.input.jumpPressed || this.input.wasPressed('Enter'))) {
          this.gameState = GAME_STATES.PLAYING;
        }
        if (this.storyTimer > 340) {
          this.gameState = GAME_STATES.PLAYING;
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
            this.music.stop();
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
    // Character switch — Q swaps Grinch and Max anytime the shape fits
    if (this.input.wasPressed('q') || this.input.wasPressed('Q')) {
      const next = (this.selectedCharacter + 1) % this.characters.length;
      if (this.player.switchCharacter(this.characters[next], this.level)) {
        this.selectedCharacter = next;
        for (let i = 0; i < 10; i++) {
          this.particles.push(new Particle(
            this.player.x + this.player.width / 2,
            this.player.y + this.player.height / 2,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6 - 1,
            '#FFFFFF',
            25,
          ));
        }
      }
    }

    this.player.update(this.input, this.level);

    // Pick up / place crates
    if (this.input.actionPressed) {
      if (this.player.carriedBlock) {
        if (this.input.sprint) {
          this.player.throwBlock();
        } else {
          this.player.placeBlock();
        }
      } else {
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

    // Crate stacking
    const blocks = this.entities.filter(e => e.type === 'pushblock' && !e.carried);
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        blocks[i].checkBlockCollision(blocks[j]);
        blocks[j].checkBlockCollision(blocks[i]);
      }
    }

    this.particles = this.particles.filter(p => p.update());

    this.camera.update(this.player, this.level.width, this.level.height);

    // Check goal (World 4 requires every house lit first)
    if (this.player.x >= this.level.goalCol && !this.goalLocked()) {
      this.gameState = GAME_STATES.LEVEL_COMPLETE;
      this.transitionTimer = this.level.goalType === 'feast' ? 240 : 140;
      this.player.addScore(1000);
      this.music.sfx('fanfare');
    }
  }

  goalLocked() {
    return this.level.housesRequired > 0 && this.player.housesLit < this.level.housesRequired;
  }

  findNearbyBlock() {
    const p = this.player;
    const reach = 8;
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

      case GAME_STATES.STORY:
        this.drawGame();
        this.drawStoryCard();
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

    drawBackground(ctx, theme, this.camera, this.level.width, this.time);

    ctx.save();
    this.camera.apply(ctx);

    drawTiles(ctx, this.level.tiles, theme, this.camera);
    drawGoal(ctx, this.level.goalCol, this.level.goalGroundY, this.level.goalType, this.time, this.goalLocked());

    for (const e of this.entities) {
      e.draw(ctx, theme);
    }

    this.player.draw(ctx, theme);

    for (const p of this.particles) {
      p.draw(ctx);
    }

    ctx.restore();

    // falling snow, in front of the world
    if (theme.snowfall) {
      this.drawSnow(theme.snowSparse ? 40 : 90);
    }

    this.drawHUD();

    if (this.gameState === GAME_STATES.LEVEL_COMPLETE) {
      this.drawLevelComplete();
    }
  }

  drawSnow(count) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const chh = this.canvas.height;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < count; i++) {
      const speed = 0.5 + pseudo(i) * 1.1;
      const drift = Math.sin(this.time * 0.01 + i * 1.7) * 24;
      let x = (pseudo(i) * cw * 1.3 + drift - this.camera.x * 0.35) % cw;
      let y = (pseudo(i + 500) * chh + this.time * speed) % chh;
      if (x < 0) x += cw;
      const size = 1 + pseudo(i + 900) * 2.2;
      ctx.globalAlpha = 0.4 + pseudo(i + 300) * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawStoryCard() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    const fade = Math.min(1, this.storyTimer / 20);
    ctx.fillStyle = `rgba(8, 8, 26, ${0.78 * fade})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.globalAlpha = fade;

    ctx.fillStyle = '#89c053';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.level.name, cx, cy - 80);

    ctx.fillStyle = '#f0ead8';
    ctx.font = 'italic 20px Georgia, serif';
    this.level.story.forEach((line, i) => {
      ctx.fillText(line, cx, cy - 28 + i * 30);
    });

    drawSleigh(ctx, cx - 30, cy + 110, this.time, this.currentLevel >= 1 ? 1 : 0);

    if (this.storyTimer > 40 && Math.floor(this.time / 30) % 2) {
      ctx.fillStyle = '#aab';
      ctx.font = '14px monospace';
      ctx.fillText('PRESS SPACE', cx, cy + 150);
    }
    ctx.globalAlpha = 1;
  }

  drawHUD() {
    const ctx = this.ctx;
    const p = this.player;

    ctx.fillStyle = 'rgba(4,4,18,0.55)';
    ctx.fillRect(0, 0, this.canvas.width, 36);

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${p.score}`, 16, 24);

    // presents in the sack
    drawPresent(ctx, 150, 11, 15, 14, '#cc2936', '#ffd700');
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`${p.presents}`, 172, 24);

    // keys
    let keyX = 220;
    for (const keyColor of p.keys) {
      this.drawKeyIcon(ctx, keyX, 18, keyColor);
      keyX += 16;
    }

    // World 4: the heart meter — grows a size for every house lit
    if (this.level.housesRequired > 0) {
      const cx = this.canvas.width / 2 + 60;
      const grow = p.housesLit / this.level.housesRequired;
      const size = 9 + grow * 14;
      const beat = 1 + Math.sin(this.time * (0.05 + grow * 0.06)) * 0.08 * (0.5 + grow);
      drawHeart(ctx, cx, 18, size * beat, grow >= 1 ? '#ff3048' : '#c04858', '#fff');
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${p.housesLit}/${this.level.housesRequired}`, cx + 22, 23);
      if (grow >= 1) {
        ctx.fillStyle = '#ffd0d8';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('x3 SIZES!', cx + 58, 23);
      }
    }

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`LIVES: ${p.lives}`, this.canvas.width - 16, 24);

    ctx.font = '11px monospace';
    ctx.fillStyle = '#AAA';
    const other = this.characters[(this.selectedCharacter + 1) % this.characters.length];
    ctx.fillText(`Q: PLAY ${this.characterNames[other]}`, this.canvas.width - 110, 24);

    ctx.textAlign = 'center';
    ctx.font = '12px monospace';
    ctx.fillStyle = '#FFF';
    ctx.fillText(this.level.name, this.canvas.width / 2, 12);
  }

  drawKeyIcon(ctx, x, y, keyColor) {
    const colors = { gold: '#FFD700', silver: '#C0C0C0' };
    const c = colors[keyColor] || colors.gold;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(x, y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.fillRect(x - 1, y, 2, 7);
    ctx.fillRect(x, y + 3, 3, 1.5);
    ctx.fillRect(x, y + 5, 2, 1.5);
  }

  drawLevelComplete() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.level.goalType === 'feast') {
      // the ending: the heart, the feast, the carving of the roast beast
      const beat = 1 + Math.sin(this.time * 0.09) * 0.1;
      drawHeart(ctx, cx, cy - 70, 44 * beat, '#ff3048', '#ffffff');
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('His heart grew three sizes that day!', cx, cy + 10);
      ctx.font = 'italic 20px Georgia, serif';
      ctx.fillStyle = '#ffd878';
      ctx.fillText('And he, HE HIMSELF, carved the roast beast.', cx, cy + 48);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#FFF';
      ctx.fillText('THE END — Merry Christmas!', cx, cy + 90);
    } else {
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LEVEL COMPLETE!', cx, cy);
      ctx.font = '18px monospace';
      ctx.fillText('+1000 points', cx, cy + 40);
    }
  }

  drawTitle() {
    const ctx = this.ctx;
    const cx = this.canvas.width / 2;

    // night sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#0a0a22');
    grad.addColorStop(1, '#232350');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // stars
    for (let i = 0; i < 60; i++) {
      const tw = Math.sin(this.titleTimer * 0.03 + i * 2.7) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(255,255,240,${tw})`;
      ctx.fillRect(pseudo(i) * this.canvas.width, pseudo(i + 100) * this.canvas.height * 0.55, 1.5, 1.5);
    }

    // moonlit snow hill with the sleigh parked on it
    ctx.fillStyle = '#2a2a52';
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height);
    ctx.quadraticCurveTo(this.canvas.width * 0.75, this.canvas.height - 180, this.canvas.width, this.canvas.height - 40);
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.closePath();
    ctx.fill();
    drawSleigh(ctx, this.canvas.width - 220, this.canvas.height - 96, this.titleTimer, 1);

    ctx.fillStyle = '#89c053';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.textAlign = 'center';
    // slight mischievous tilt
    ctx.save();
    ctx.translate(cx, 95);
    ctx.rotate(-0.02 + Math.sin(this.titleTimer * 0.02) * 0.008);
    ctx.fillText('THE GRINCH', 0, 0);
    ctx.restore();

    ctx.fillStyle = '#cc4858';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('a Whoville adventure', cx, 130);

    // character selection
    ctx.font = '16px monospace';
    ctx.fillStyle = '#AAD';
    ctx.fillText('< SELECT CHARACTER >', cx, 205);

    const charCount = this.characters.length;
    const previewSize = 56;
    const spacing = 150;
    const startX = cx - ((charCount - 1) * spacing) / 2;

    for (let i = 0; i < charCount; i++) {
      const px = startX + i * spacing - previewSize / 2;
      const py = 225;
      const charId = this.characters[i];
      const selected = i === this.selectedCharacter;

      if (selected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(px - 10, py - 10, previewSize + 20, previewSize + 34);
        const bounce = Math.sin(this.titleTimer * 0.1) * 4;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(px + previewSize / 2, py - 18 + bounce);
        ctx.lineTo(px + previewSize / 2 - 6, py - 26 + bounce);
        ctx.lineTo(px + previewSize / 2 + 6, py - 26 + bounce);
        ctx.fill();
      }

      Player.drawPreview(ctx, charId, px, py, previewSize, this.titleTimer);

      ctx.fillStyle = selected ? '#FFD700' : '#AAD';
      ctx.font = selected ? 'bold 14px monospace' : '12px monospace';
      ctx.fillText(this.characterNames[charId], px + previewSize / 2, py + previewSize + 18);
    }

    ctx.font = '18px monospace';
    ctx.fillStyle = '#FFF';
    if (Math.floor(this.titleTimer / 30) % 2) {
      ctx.fillText('PRESS SPACE OR ENTER TO START', cx, 365);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`OR PRESS 1-${LEVELS.length} TO JUMP TO A WORLD`, cx, 390);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#AAD';
    ctx.fillText('Arrows / WASD — Sneak & Jump    Shift — Run!', cx, 420);
    ctx.fillText('Down/S/X — Pick up & Place crates', cx, 440);
    ctx.fillText('Q — Switch Grinch/Max    M — Music on/off', cx, 460);
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = '#89c053';
    ctx.font = 'bold 44px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText("You're a mean one...", this.canvas.width / 2, this.canvas.height / 2 - 40);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px monospace';
    ctx.fillText(`Final Score: ${this.player.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

    if (this.transitionTimer <= 0) {
      if (Math.floor(Date.now() / 500) % 2) {
        ctx.font = '18px monospace';
        ctx.fillText('PRESS SPACE TO TRY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 60);
      }
    }
  }
}

function pseudo(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
