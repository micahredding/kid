// Everything you see. Given a Game, paint it.
//
// Every fruit is one of Asher's drawings on a ball. The ball carries the size,
// which is what you actually read while playing; the drawing is his pixels,
// unsmoothed and unrecoloured. See the tint table below for how the two kinds
// of drawing get shown.

import { LAYOUT, W, H, radiusFor } from './config.js';

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex, amount, towards = [255, 255, 255]) => {
  const c = rgb(hex);
  return `rgb(${c.map((v, i) => Math.round(v + (towards[i] - v) * amount)).join(',')})`;
};

export class Renderer {
  constructor(ctx, fruits, images) {
    this.ctx = ctx;
    this.fruits = fruits;
    this.images = images;      // tier -> HTMLImageElement
    this.particles = [];
    this.flashes = [];         // floating score numbers
    this.banner = null;        // { text, until }
    this.shake = 0;
    this.t = 0;
    // Two kinds of drawing, two ways to show them:
    //
    //   one colour  — the block IS the fruit, so it fills the circle edge to
    //                 edge and gets cropped round. A red square becomes a
    //                 cherry without losing anything he drew.
    //   more than one — the arrangement is the picture (the pineapple's crown,
    //                 the plum's stem), so it is kept whole and sits on a pale
    //                 disc of its own colour.
    //
    // Tinting the disc the same colour as a solid block, and then drawing the
    // block on top of it, makes his drawing invisible. Hence the split.
    this.tint = fruits.map((f) => {
      const solid = (f.palette?.length ?? 1) === 1;
      return {
        solid,
        // A solid block covers its ball, so that ball is only a backdrop. A
        // composed picture sits on a pale wash of its own colour: enough to say
        // "this is the purple one" at a glance, pale enough that the green stem
        // still reads. A full-strength wash under a solid block is what made
        // his drawing invisible in the first pass.
        ball: solid ? mix(f.color, 0.10) : mix(f.color, 0.76),
        ballDeep: solid ? mix(f.color, 0.0, [0, 0, 0]) : mix(f.color, 0.56),
        ring: mix(f.color, 0.30, [0, 0, 0]),
      };
    });
  }

  // --- juice ---------------------------------------------------------------

  burst(x, y, tier, count = 14) {
    const color = this.fruits[tier]?.color ?? '#ff5577';
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 120 + Math.random() * 260;
      this.particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 90,
        life: 0.5 + Math.random() * 0.4, age: 0,
        size: 3 + Math.random() * 5, color,
      });
    }
  }

  flash(x, y, text, color = '#3c2a1e') {
    this.flashes.push({ x, y, text, color, age: 0, life: 0.9 });
  }

  say(text, seconds = 1.6) { this.banner = { text, until: this.t + seconds }; }

  handle(events) {
    for (const e of events) {
      if (e.type === 'merge') {
        this.burst(e.x, e.y, e.tier);
        this.flash(e.x, e.y, `+${e.gained}`);
        this.shake = Math.min(9, this.shake + 2 + e.tier * 0.4);
        if (e.chain > 1) this.say(`CHAIN ×${e.chain}!`, 1.1);
      } else if (e.type === 'first') {
        this.say(`${this.fruits[e.tier].name.toUpperCase()}!`, 1.4);
      } else if (e.type === 'final') {
        this.burst(e.x, e.y, e.tier, 46);
        this.flash(e.x, e.y, `+${e.score}`, '#b8322a');
        this.say('TWO WATERMELONS!! ★', 2.6);
        this.shake = 16;
      }
    }
  }

  // --- the frame ----------------------------------------------------------

  draw(game, dt) {
    const ctx = this.ctx;
    this.t += dt;
    this.stepEffects(dt);

    ctx.save();
    if (this.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake *= 0.86;
    }

    this.drawBackground(ctx);
    this.drawJar(ctx, game);

    ctx.save();
    // Fruit is clipped to the jar's width so nothing spills over the walls, and
    // to just above the rim so the held fruit still shows. The HUD is painted
    // after this, so an overflowing jar passes behind the score rather than
    // over it.
    ctx.beginPath();
    ctx.rect(LAYOUT.left - 2, LAYOUT.dropY - 46, LAYOUT.right - LAYOUT.left + 4, LAYOUT.floor - LAYOUT.dropY + 48);
    ctx.clip();
    this.drawDangerLine(ctx, game);
    if (game.state === 'playing') this.drawHeld(ctx, game);
    for (const b of game.world.bodies) this.drawFruit(ctx, b);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawHeader(ctx, game);
    this.drawLadder(ctx, game);
    this.drawFlashes(ctx);
    this.drawBanner(ctx);
    if (this.titleUp) this.drawTitle(ctx, game);
    else if (game.state === 'over') this.drawGameOver(ctx, game);
    ctx.restore();
  }

  stepEffects(dt) {
    for (const p of this.particles) {
      p.age += dt;
      p.vy += 1500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.particles = this.particles.filter((p) => p.age < p.life);
    for (const f of this.flashes) { f.age += dt; f.y -= 46 * dt; }
    this.flashes = this.flashes.filter((f) => f.age < f.life);
    if (this.banner && this.t > this.banner.until) this.banner = null;
  }

  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffe8c2');
    g.addColorStop(0.55, '#ffd79c');
    g.addColorStop(1, '#f7b878');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawHeader(ctx, game) {
    // Its own band, because fruit squeezed above the rim passes behind it.
    const g = ctx.createLinearGradient(0, 0, 0, LAYOUT.headerH);
    g.addColorStop(0, 'rgba(255,232,194,0.97)');
    g.addColorStop(1, 'rgba(255,232,194,0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, LAYOUT.headerH - 10);
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#7a4a22';
    ctx.font = 'bold 13px "SF Mono", Menlo, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 22, 16);
    ctx.fillStyle = '#3c2a1e';
    ctx.font = 'bold 40px "SF Mono", Menlo, monospace';
    ctx.fillText(String(game.score), 20, 32);

    ctx.font = 'bold 13px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#7a4a22';
    ctx.textAlign = 'left';
    ctx.fillText('BEST', 168, 16);
    ctx.font = 'bold 20px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#3c2a1e';
    ctx.fillText(String(this.bestEver ?? 0), 168, 34);

    // Next up, in its own little box.
    const bx = 340, by = 14, bw = 122, bh = 76;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(122,74,34,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#7a4a22';
    ctx.font = 'bold 11px "SF Mono", Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', bx + bw / 2, by + 7);
    this.drawBall(ctx, bx + bw / 2, by + 46, 24, game.next);
  }

  drawJar(ctx, game) {
    const { left, right, top, floor, wall } = LAYOUT;
    ctx.save();
    // Inside first, so the walls sit on top of it.
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    this.roundRect(ctx, left, top, right - left, floor - top, 20);
    ctx.fill();

    ctx.strokeStyle = '#c07b3c';
    ctx.lineWidth = wall;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Open at the top: down the left wall, across the floor, up the right.
    ctx.moveTo(left - wall / 2, top - 8);
    ctx.lineTo(left - wall / 2, floor - 16);
    ctx.arcTo(left - wall / 2, floor + wall / 2, left + 18, floor + wall / 2, 22);
    ctx.lineTo(right - 18, floor + wall / 2);
    ctx.arcTo(right + wall / 2, floor + wall / 2, right + wall / 2, floor - 16, 22);
    ctx.lineTo(right + wall / 2, top - 8);
    ctx.stroke();

    // Rim caps, so the open top reads as a rim rather than a cut-off line.
    ctx.fillStyle = '#a9642c';
    for (const x of [left - wall / 2, right + wall / 2]) {
      ctx.beginPath();
      ctx.arc(x, top - 8, wall / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // A single soft sheen down the left of the glass.
    const sheen = ctx.createLinearGradient(left, 0, left + 120, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0.30)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(left + 3, top + 10, 120, floor - top - 20);
    ctx.restore();
  }

  drawDangerLine(ctx, game) {
    const hot = game.overflowing;
    const pulse = 0.4 + 0.35 * Math.sin(this.t * 7);
    ctx.save();
    ctx.setLineDash([9, 9]);
    ctx.lineWidth = hot ? 4 : 2;
    ctx.strokeStyle = hot ? `rgba(214,48,38,${0.55 + pulse * 0.45})` : 'rgba(196,110,40,0.42)';
    ctx.beginPath();
    ctx.moveTo(LAYOUT.left, LAYOUT.dangerY);
    ctx.lineTo(LAYOUT.right, LAYOUT.dangerY);
    ctx.stroke();
    ctx.restore();
  }

  drawHeld(ctx, game) {
    const r = radiusFor(game.held);
    const ready = game.canDrop;
    // Aim guide: a dotted drop line, so you can see where it lands.
    ctx.save();
    ctx.setLineDash([4, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(120,72,32,0.30)';
    ctx.beginPath();
    ctx.moveTo(game.holdX, LAYOUT.dropY + r);
    ctx.lineTo(game.holdX, LAYOUT.floor);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    if (!ready) ctx.globalAlpha = 0.35;
    const bob = ready ? Math.sin(this.t * 4) * 2.5 : 0;
    this.drawBall(ctx, game.holdX, LAYOUT.dropY + bob, r, game.held, 0, 0);
    ctx.restore();
  }

  drawFruit(ctx, b) {
    this.drawBall(ctx, b.x, b.y, b.r, b.tier, b.angle, b.squish);
  }

  drawBall(ctx, x, y, r, tier, angle = 0, squish = 0) {
    const tint = this.tint[tier] ?? this.tint[0];
    const sx = 1 + squish * 0.16;
    const sy = 1 - squish * 0.16;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // Shadow under the ball, so the pile has depth.
    ctx.fillStyle = 'rgba(120,70,30,0.16)';
    ctx.beginPath();
    ctx.arc(2, 4, r, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, tint.ball);
    g.addColorStop(1, tint.ballDeep);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // His drawing, stamped on. Solid blocks may spin freely; anything he gave a
    // top to only wobbles, so the pineapple never lands crown-down.
    ctx.save();
    ctx.rotate(tint.solid ? angle : Math.max(-0.22, Math.min(0.22, angle)));
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.99, 0, Math.PI * 2);
    ctx.clip();
    if (tint.solid) this.drawSprite(ctx, tier, 0, 0, r, 'cover');
    else this.drawSprite(ctx, tier, 0, 0, r * 0.94, 'contain');
    ctx.restore();

    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.strokeStyle = tint.ring;
    ctx.beginPath();
    ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Highlight last, so it reads as glossy.
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.42, r * 0.24, r * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw tier art centred at (cx, cy) in a box of half-size `half`.
  // 'contain' keeps the whole picture; 'cover' fills the box and lets the
  // clip crop the overhang.
  drawSprite(ctx, tier, cx, cy, half, fit = 'contain') {
    const img = this.images?.[tier];
    const fruit = this.fruits[tier];
    if (!img || !img.width) {
      // No art loaded (or running headless): a plain disc still plays.
      ctx.fillStyle = fruit?.color ?? '#e33';
      ctx.beginPath();
      ctx.arc(cx, cy, half, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const span = fit === 'cover'
      ? Math.min(img.width, img.height)
      : Math.max(img.width, img.height);
    const scale = (half * 2) / span;
    const w = img.width * scale, h = img.height * scale;
    ctx.imageSmoothingEnabled = false;   // his blocks stay blocks
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }

  // The chart along the bottom: the whole ladder, in his order.
  drawLadder(ctx, game) {
    const y = LAYOUT.ladderY + 26;
    const n = this.fruits.length;
    const step = (W - 36) / n;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const x = 18 + step * (i + 0.5);
      const reached = i <= game.best;
      ctx.save();
      ctx.globalAlpha = reached ? 1 : 0.3;
      this.drawBall(ctx, x, y, Math.min(14, step * 0.42), i);
      ctx.restore();
      if (i < n - 1) {
        ctx.fillStyle = 'rgba(122,74,34,0.5)';
        ctx.font = '10px "SF Mono", Menlo, monospace';
        ctx.fillText('›', x + step / 2, y);
      }
    }
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = p.color;
      const s = p.size * (0.4 + k * 0.6);
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  drawFlashes(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const f of this.flashes) {
      const k = 1 - f.age / f.life;
      ctx.globalAlpha = Math.max(0, k);
      ctx.font = 'bold 22px "SF Mono", Menlo, monospace';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  drawBanner(ctx) {
    if (!this.banner) return;
    const left = this.banner.until - this.t;
    ctx.save();
    ctx.globalAlpha = Math.min(1, left * 2.4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px "SF Mono", Menlo, monospace';
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText(this.banner.text, W / 2, LAYOUT.top + 60);
    ctx.fillStyle = '#d6472a';
    ctx.fillText(this.banner.text, W / 2, LAYOUT.top + 60);
    ctx.restore();
  }

  // Shown once, before the first drop: whose game this is, and the ladder.
  drawTitle(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(28,16,8,0.55)';
    ctx.fillRect(0, 0, W, H);
    const cy = H / 2 - 40;
    ctx.fillStyle = 'rgba(24,13,6,0.93)';
    this.roundRect(ctx, 34, cy - 150, W - 68, 400, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,201,138,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe8c2';
    ctx.font = 'bold 40px "SF Mono", Menlo, monospace';
    ctx.fillText('FRUIT', W / 2, cy - 96);
    ctx.fillText('MERGE', W / 2, cy - 52);
    ctx.font = 'bold 15px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#ffc98a';
    ctx.fillText('fruit drawn by ASHER', W / 2, cy - 8);

    // Two make one bigger — shown, not explained.
    const y = cy + 54;
    this.drawBall(ctx, W / 2 - 92, y, 22, 0);
    this.drawBall(ctx, W / 2 - 46, y, 22, 0);
    ctx.fillStyle = '#ffe8c2';
    ctx.font = 'bold 26px "SF Mono", Menlo, monospace';
    ctx.fillText('=', W / 2, y);
    this.drawBall(ctx, W / 2 + 62, y, 30, 1);

    ctx.font = 'bold 13px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#ffc98a';
    ctx.fillText('two the same make one bigger', W / 2, cy + 112);
    ctx.fillText('point where you want it, then tap', W / 2, cy + 136);
    ctx.fillText('keys: \u2190 \u2192 to aim, SPACE to drop', W / 2, cy + 160);

    ctx.font = 'bold 20px "SF Mono", Menlo, monospace';
    ctx.fillStyle = Math.sin(this.t * 4) > 0 ? '#fff' : '#ffc98a';
    ctx.fillText('TAP TO START', W / 2, cy + 210);
    ctx.restore();
  }

  drawGameOver(ctx, game) {
    ctx.save();
    ctx.fillStyle = 'rgba(28,16,8,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cy = H / 2 - 60;

    ctx.fillStyle = 'rgba(24,13,6,0.93)';
    this.roundRect(ctx, 34, cy - 108, W - 68, 448, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,201,138,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffe8c2';
    ctx.font = 'bold 44px "SF Mono", Menlo, monospace';
    ctx.fillText('FULL JAR!', W / 2, cy - 60);

    ctx.font = 'bold 18px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#ffc98a';
    ctx.fillText('SCORE', W / 2, cy + 6);
    ctx.font = 'bold 56px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(String(game.score), W / 2, cy + 48);

    ctx.font = 'bold 16px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#ffc98a';
    ctx.fillText('BIGGEST FRUIT', W / 2, cy + 108);
    this.drawBall(ctx, W / 2, cy + 176, 46, game.best);
    ctx.font = 'bold 20px "SF Mono", Menlo, monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.fruits[game.best].name.toUpperCase(), W / 2, cy + 240);

    ctx.font = 'bold 20px "SF Mono", Menlo, monospace';
    ctx.fillStyle = Math.sin(this.t * 4) > 0 ? '#fff' : '#ffc98a';
    ctx.fillText('TAP TO PLAY AGAIN', W / 2, cy + 300);
    ctx.restore();
  }
}
