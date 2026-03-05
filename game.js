// ─── Planet data ─────────────────────────────────────────────────────────────
const PLANETS = [
  {
    name: 'Mercury', color: '#b5b5b5', radius: 72,
    tokens: [{ label: 'Mercury', type: 'name', color: '#b5b5b5' }],
    draw(cx, cy, r) {
      ctx.fillStyle = '#b5b5b5';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#888';
      for (const [fx, fy, fr] of [[-0.25,-0.2,0.1],[0.3,0.15,0.09],[-0.15,0.35,0.09],[0.4,-0.3,0.12]]) {
        ctx.beginPath(); ctx.arc(cx+fx*r, cy+fy*r, fr*r, 0, Math.PI*2); ctx.fill();
      }
    }
  },
  {
    name: 'Venus', color: '#e8c97e', radius: 96,
    tokens: [{ label: 'Venus', type: 'name', color: '#e8c97e' }],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#fff5d0'); g.addColorStop(1, '#c8a040');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,180,0.4)';
      ctx.lineWidth = r * 0.06;
      for (const yo of [-0.28, 0, 0.28]) {
        ctx.beginPath(); ctx.ellipse(cx, cy+yo*r, r*0.88, r*0.08, 0, 0, Math.PI*2); ctx.stroke();
      }
    }
  },
  {
    name: 'Earth', color: '#4fa3e0', radius: 104,
    tokens: [
      { label: 'Earth', type: 'name', color: '#4fa3e0' },
      { label: 'Moon',  type: 'moon', color: '#d0d0d0' }
    ],
    draw(cx, cy, r) {
      ctx.fillStyle = '#2255aa';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3ab54a';
      ctx.beginPath(); ctx.ellipse(cx-r*0.1,  cy-r*0.15, r*0.32, r*0.22, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+r*0.22, cy+r*0.1,  r*0.25, r*0.18,  0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx-r*0.05, cy+r*0.28, r*0.18, r*0.13,  0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.ellipse(cx, cy-r*0.4, r*0.65, r*0.1, 0, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Mars', color: '#c1440e', radius: 88,
    tokens: [
      { label: 'Mars',  type: 'name', color: '#c1440e' },
      { label: 'Moons', type: 'moon', color: '#bbaa99' }
    ],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#e06030'); g.addColorStop(1, '#8b2500');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.beginPath(); ctx.ellipse(cx, cy-r*0.82, r*0.22, r*0.1, 0, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Jupiter', color: '#c88b3a', radius: 160,
    tokens: [
      { label: 'Jupiter', type: 'name', color: '#c88b3a' },
      { label: 'Rings',   type: 'ring', color: '#d4a060' },
      { label: 'Moons',   type: 'moon', color: '#e8d080' }
    ],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, '#e8c080'); g.addColorStop(1, '#a06020');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      for (const [y, h, c] of [[-0.38,0.12,'rgba(140,80,20,0.55)'],[-0.18,0.09,'rgba(200,160,80,0.4)'],
                                [0.06,0.14,'rgba(130,70,20,0.6)'],[0.28,0.1,'rgba(180,130,60,0.35)']]) {
        ctx.fillStyle = c; ctx.fillRect(cx-r, cy+y*r, r*2, h*r);
      }
      ctx.fillStyle = 'rgba(180,60,20,0.85)';
      ctx.beginPath(); ctx.ellipse(cx+r*0.28, cy+r*0.07, r*0.18, r*0.11, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  },
  {
    name: 'Saturn', color: '#e4d19a', radius: 136,
    tokens: [
      { label: 'Saturn', type: 'name', color: '#e4d19a' },
      { label: 'Rings',  type: 'ring', color: '#d4c080' }
    ],
    draw(cx, cy, r) {
      ctx.strokeStyle = 'rgba(210,190,130,0.65)';
      ctx.lineWidth = r * 0.18;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.7, r*0.35, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(180,160,100,0.45)';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*2.0, r*0.42, 0, 0, Math.PI*2); ctx.stroke();
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#f5eac0'); g.addColorStop(1, '#b09050');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      for (const [yo, h, a] of [[-0.28,0.1,0.25],[0,0.08,0.2],[0.28,0.1,0.25]]) {
        ctx.fillStyle = `rgba(160,130,70,${a})`; ctx.fillRect(cx-r, cy+yo*r, r*2, h*r);
      }
      ctx.restore();
    }
  },
  {
    name: 'Uranus', color: '#7de8e8', radius: 120,
    tokens: [
      { label: 'Uranus', type: 'name', color: '#7de8e8' },
      { label: 'Rings',  type: 'ring', color: '#60c8c8' }
    ],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#b0f8f8'); g.addColorStop(1, '#4ab8c8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,220,220,0.5)';
      ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.5, r*0.25, Math.PI*0.2, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Neptune', color: '#3f54ba', radius: 112,
    tokens: [
      { label: 'Neptune', type: 'name', color: '#3f54ba' },
      { label: 'Triton',  type: 'moon', color: '#8090c0' }
    ],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#6080e0'); g.addColorStop(1, '#1a2880');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(20,20,120,0.65)';
      ctx.beginPath(); ctx.ellipse(cx-r*0.2, cy-r*0.15, r*0.2, r*0.13, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,130,220,0.35)';
      ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.35, r*0.2, 0, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Pluto', color: '#c8a882', radius: 56,
    tokens: [
      { label: 'Pluto',  type: 'name', color: '#c8a882' },
      { label: 'Charon', type: 'moon', color: '#b0a090' }
    ],
    draw(cx, cy, r) {
      ctx.fillStyle = '#b89870';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath(); ctx.arc(cx-r*0.2, cy-r*0.2, r*0.42, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a07850';
      for (const [fx, fy, fr] of [[-0.1,0.3,0.08],[0.3,0.1,0.07],[0,-0.1,0.07]]) {
        ctx.beginPath(); ctx.arc(cx+fx*r, cy+fy*r, fr*r, 0, Math.PI*2); ctx.fill();
      }
    }
  },
  {
    name: 'Ceres', color: '#a0a0b0', radius: 44,
    tokens: [{ label: 'Ceres', type: 'name', color: '#a0a0b0' }],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#c0c0cc'); g.addColorStop(1, '#606070');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(cx+r*0.2,  cy-r*0.1,  r*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+r*0.3,  cy-r*0.05, r*0.07, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(80,80,90,0.5)';
      ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.arc(cx-r*0.3, cy+r*0.2,  r*0.2,  0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx-r*0.1, cy-r*0.3,  r*0.15, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Haumea', color: '#d4c8b0', radius: 44,
    tokens: [
      { label: 'Haumea', type: 'name', color: '#d4c8b0' },
      { label: 'Rings',  type: 'ring', color: '#c8b890' }
    ],
    draw(cx, cy, r) {
      ctx.strokeStyle = 'rgba(200,180,140,0.45)';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.8, r*0.3, 0, 0, Math.PI*2); ctx.stroke();
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.2, r*0.1, cx, cy, r);
      g.addColorStop(0, '#ede0c8'); g.addColorStop(1, '#8c7860');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.4, r*0.8, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,85,65,0.35)';
      ctx.lineWidth = r * 0.04;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.0, r*0.55, 0, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Makemake', color: '#c87840', radius: 44,
    tokens: [{ label: 'Makemake', type: 'name', color: '#c87840' }],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#e09060'); g.addColorStop(1, '#803010');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(60,20,5,0.38)';
      ctx.beginPath(); ctx.ellipse(cx+r*0.2,  cy+r*0.2,  r*0.3,  r*0.2,   0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx-r*0.25, cy-r*0.15, r*0.2,  r*0.15, -0.3, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Eris', color: '#d8d8e0', radius: 50,
    tokens: [
      { label: 'Eris',     type: 'name', color: '#d8d8e0' },
      { label: 'Dysnomia', type: 'moon', color: '#b0b0c0' }
    ],
    draw(cx, cy, r) {
      const g = ctx.createRadialGradient(cx-r*0.35, cy-r*0.35, r*0.05, cx, cy, r);
      g.addColorStop(0, '#f0f0f8'); g.addColorStop(0.6, '#d0d0dc'); g.addColorStop(1, '#8888a0');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.ellipse(cx-r*0.2, cy-r*0.25, r*0.5, r*0.25, -0.4, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(140,140,160,0.3)';
      ctx.lineWidth = r * 0.04;
      ctx.beginPath(); ctx.arc(cx+r*0.2, cy+r*0.1, r*0.25, 0, Math.PI*2); ctx.stroke();
    }
  }
];

// ─── Canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── Starfield ────────────────────────────────────────────────────────────────
const WORLD_W = 3000;
const WORLD_H = 3000;

const stars = [];
for (let i = 0; i < 600; i++) {
  stars.push({
    x: Math.random() * WORLD_W,
    y: Math.random() * WORLD_H,
    r: Math.random() * 1.8 + 0.3,
    twinkle: Math.random() * Math.PI * 2
  });
}

// ─── Game state ───────────────────────────────────────────────────────────────
let currentPlanetIndex = 0;
let placedPlanets = [];
let phase = 'explore'; // 'explore' | 'fireworks' | 'transit' | 'solar' | 'done'

let playerX = WORLD_W / 2;
let playerY = WORLD_H / 2;
let camX = 0, camY = 0;

let activeTokens = []; // { x, y, label, type, color, collected, pulse }
let tokenPulse = 0;

const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

let particles    = [];
let transitTimer = 0;
let doneFireworks = [];
let gameT = 0;
let transitProgress = 0;
let transitStart = null;
let transitEnd   = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rnd(min, max) { return Math.random() * (max - min) + min; }

function spawnActiveTokens() {
  const planet = PLANETS[currentPlanetIndex];
  activeTokens = planet.tokens.map(tok => {
    let tx, ty;
    do {
      tx = rnd(200, WORLD_W - 200);
      ty = rnd(200, WORLD_H - 200);
    } while (Math.hypot(tx - playerX, ty - playerY) < 500);
    return { ...tok, x: tx, y: ty, collected: false, pulse: Math.random() * Math.PI * 2 };
  });
}

function spawnFireworks(wx, wy) {
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rnd(1, 6);
    particles.push({
      x: wx, y: wy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: rnd(0.015, 0.04),
      color: `hsl(${Math.floor(Math.random()*360)},100%,65%)`,
      size: rnd(2, 5)
    });
  }
}

function spawnBigFireworks() {
  doneFireworks = [];
  for (let burst = 0; burst < 14; burst++) {
    const bx    = rnd(W * 0.1, W * 0.9);
    const by    = rnd(H * 0.1, H * 0.75);
    const delay = burst * 20;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rnd(1, 8);
      doneFireworks.push({
        x: bx, y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, delay,
        decay: rnd(0.008, 0.02),
        color: `hsl(${Math.floor(Math.random()*360)},100%,65%)`,
        size: rnd(2, 6)
      });
    }
  }
}

// ─── Solar system layout ──────────────────────────────────────────────────────
const ORBIT_RADII = [80, 115, 155, 195, 260, 330, 390, 440, 475, 505, 535, 565, 600];

function getSolarPos(index) {
  const maxR  = ORBIT_RADII[ORBIT_RADII.length - 1];
  const scale = Math.min(W, H) * 0.36 / maxR;
  return { x: W / 2 + ORBIT_RADII[index] * scale, y: H / 2 };
}

// ─── Update ───────────────────────────────────────────────────────────────────
const SPEED = 4;

function update() {
  gameT++;
  tokenPulse = (tokenPulse + 0.06) % (Math.PI * 2);

  if (phase === 'explore') {
    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['a']) dx -= SPEED;
    if (keys['ArrowRight'] || keys['d']) dx += SPEED;
    if (keys['ArrowUp']    || keys['w']) dy -= SPEED;
    if (keys['ArrowDown']  || keys['s']) dy += SPEED;

    playerX = Math.max(0, Math.min(WORLD_W, playerX + dx));
    playerY = Math.max(0, Math.min(WORLD_H, playerY + dy));
    camX = Math.max(0, Math.min(WORLD_W - W, playerX - W / 2));
    camY = Math.max(0, Math.min(WORLD_H - H, playerY - H / 2));

    const planet = PLANETS[currentPlanetIndex];
    for (const tok of activeTokens) {
      if (tok.collected) continue;
      if (Math.hypot(playerX - tok.x, playerY - tok.y) < planet.radius + 50) {
        tok.collected = true;
        spawnFireworks(tok.x - camX, tok.y - camY);
      }
    }

    if (activeTokens.length > 0 && activeTokens.every(tok => tok.collected)) {
      phase = 'fireworks';
      spawnFireworks(playerX - camX, playerY - camY);
      transitTimer = 100;
    }
  }

  if (phase === 'fireworks') {
    transitTimer--;
    if (transitTimer <= 0) {
      phase = 'transit';
      transitProgress = 0;
      transitStart = { x: playerX - camX, y: playerY - camY };
      transitEnd   = getSolarPos(currentPlanetIndex);
    }
  }

  if (phase === 'transit') {
    transitProgress += 0.018;
    if (transitProgress >= 1) {
      transitProgress = 1;
      placedPlanets.push({ index: currentPlanetIndex });
      currentPlanetIndex++;
      if (currentPlanetIndex >= PLANETS.length) {
        phase = 'done';
        spawnBigFireworks();
      } else {
        phase = 'solar';
        transitTimer = 160;
        playerX = WORLD_W / 2;
        playerY = WORLD_H / 2;
        spawnActiveTokens();
      }
    }
  }

  if (phase === 'solar') {
    transitTimer--;
    if (transitTimer <= 0) phase = 'explore';
  }

  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08;
    p.life -= p.decay;
  }

  for (const p of doneFireworks) {
    if (p.delay > 0) { p.delay--; continue; }
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.05;
    p.life -= p.decay;
  }
  doneFireworks = doneFireworks.filter(p => p.life > 0 || p.delay > 0);
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────
function drawStars() {
  for (const s of stars) {
    const sx = s.x - camX, sy = s.y - camY;
    if (sx < -5 || sx > W+5 || sy < -5 || sy > H+5) continue;
    const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.twinkle + gameT * 0.03));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI*2); ctx.fill();
  }
}

function drawTokenArrow(tok) {
  const angle = Math.atan2(tok.y - playerY, tok.x - playerX);
  const ex = W/2 + Math.cos(angle) * (Math.min(W,H)/2 - 70);
  const ey = H/2 + Math.sin(angle) * (Math.min(W,H)/2 - 70);
  ctx.save();
  ctx.translate(ex, ey);
  ctx.fillStyle = `rgba(255,255,100,${0.5 + 0.5*Math.sin(tokenPulse)})`;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.rotate(angle);
  ctx.fillText('>', 0, 0);
  ctx.rotate(-angle);
  ctx.font = '13px Arial';
  ctx.fillStyle = tok.color;
  ctx.fillText(tok.label, 0, 24);
  ctx.restore();
}

function drawNameToken(sx, sy, tok) {
  const pulse = 1 + 0.15 * Math.sin(tok.pulse);
  ctx.save();
  ctx.shadowColor = tok.color;
  ctx.shadowBlur = (8 + 4 * Math.sin(tok.pulse)) * 3;
  ctx.font = `bold ${Math.round(38 * pulse)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tok.label, sx, sy);
  ctx.shadowBlur = 0;
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2 + gameT * 0.02;
    const r2 = 60 + 8 * Math.sin(tok.pulse + i);
    ctx.fillStyle = tok.color;
    ctx.font = '18px Arial';
    ctx.fillText('\u2605', sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
  }
  ctx.restore();
}

function drawRingToken(sx, sy, tok) {
  const pulse = 1 + 0.12 * Math.sin(tok.pulse);
  ctx.save();
  ctx.shadowColor = tok.color;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = tok.color;
  ctx.lineWidth = 8 * pulse;
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(tok.pulse);
  ctx.beginPath(); ctx.ellipse(sx, sy, 62 * pulse, 21 * pulse, 0, 0, Math.PI*2); ctx.stroke();
  ctx.lineWidth = 4 * pulse;
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(tok.pulse + 1);
  ctx.beginPath(); ctx.ellipse(sx, sy, 44 * pulse, 15 * pulse, 0, 0, Math.PI*2); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 5; i++) {
    const a   = (i / 5) * Math.PI * 2 + gameT * 0.025;
    ctx.fillStyle = '#ffee88';
    ctx.fillText('\u2736', sx + Math.cos(a) * 62 * pulse, sy + Math.sin(a) * 21 * pulse);
  }
  ctx.font = 'bold 22px Arial';
  ctx.fillStyle = tok.color;
  ctx.shadowColor = tok.color;
  ctx.shadowBlur = 8;
  ctx.fillText(tok.label, sx, sy + 40);
  ctx.restore();
}

function drawMoonToken(sx, sy, tok) {
  const pulse = 1 + 0.12 * Math.sin(tok.pulse);
  const r = 22 * pulse;
  ctx.save();
  ctx.shadowColor = tok.color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = tok.color;
  ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000018';
  ctx.beginPath(); ctx.arc(sx + r * 0.42, sy, r * 0.88, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.arc(sx - r*0.3, sy + r*0.1, r*0.25, 0, Math.PI*2); ctx.fill();
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = tok.color;
  ctx.shadowColor = tok.color;
  ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tok.label, sx, sy + r + 20);
  ctx.restore();
}

function drawAllTokens() {
  for (const tok of activeTokens) {
    if (tok.collected) continue;
    tok.pulse = (tok.pulse + 0.05) % (Math.PI * 2);
    const sx = tok.x - camX, sy = tok.y - camY;
    if (sx < -120 || sx > W+120 || sy < -80 || sy > H+80) {
      drawTokenArrow(tok);
      continue;
    }
    if      (tok.type === 'name') drawNameToken(sx, sy, tok);
    else if (tok.type === 'ring') drawRingToken(sx, sy, tok);
    else                          drawMoonToken(sx, sy, tok);
  }
}

function drawPlayer() {
  const planet = PLANETS[currentPlanetIndex];
  const sx = playerX - camX, sy = playerY - camY;

  // Collected rings around player
  const rings = activeTokens.filter(tok => tok.type === 'ring' && tok.collected);
  rings.forEach((ring, i) => {
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = planet.radius * 0.14;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(sx, sy, planet.radius * (1.6 + i * 0.22), planet.radius * 0.28, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // Planet
  ctx.save();
  ctx.shadowColor = planet.color;
  ctx.shadowBlur = 25;
  planet.draw(sx, sy, planet.radius);
  ctx.restore();

  // Collected moons orbiting
  const moons = activeTokens.filter(tok => tok.type === 'moon' && tok.collected);
  moons.forEach((moon, i) => {
    const orbitR = planet.radius * 1.55 + i * 30;
    const angle  = gameT * (0.018 + i * 0.005) + i * Math.PI;
    const mx = sx + Math.cos(angle) * orbitR;
    const my = sy + Math.sin(angle) * orbitR * 0.38;
    ctx.fillStyle = moon.color;
    ctx.shadowColor = moon.color;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(mx, my, 11, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── Animated Sun ─────────────────────────────────────────────────────────────
function drawSun(cx, cy) {
  // Solar flares (drawn behind core)
  for (let i = 0; i < 12; i++) {
    const angle   = (i / 12) * Math.PI * 2 + gameT * 0.007;
    const flareL  = 58 + 20 * Math.sin(gameT * 0.04 + i * 1.1);
    const flareW  = 11 + 4  * Math.sin(gameT * 0.06 + i * 0.9);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    const fg = ctx.createLinearGradient(44, 0, 44 + flareL, 0);
    fg.addColorStop(0, `rgba(255,${130 + Math.floor(60*Math.sin(gameT*0.05+i))},0,0.9)`);
    fg.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(44, 0);
    ctx.bezierCurveTo(44+flareL*0.3,  flareW, 44+flareL*0.7,  flareW*0.5, 44+flareL, 0);
    ctx.bezierCurveTo(44+flareL*0.7, -flareW*0.5, 44+flareL*0.3, -flareW, 44, 0);
    ctx.fill();
    ctx.restore();
  }

  // Pulsing outer corona glow
  const glowR  = 58 + 7 * Math.sin(gameT * 0.033);
  const corona = ctx.createRadialGradient(cx, cy, 40, cx, cy, glowR + 35);
  corona.addColorStop(0,   'rgba(255,200,0,0.55)');
  corona.addColorStop(0.5, 'rgba(255,100,0,0.2)');
  corona.addColorStop(1,   'rgba(255,50,0,0)');
  ctx.fillStyle = corona;
  ctx.beginPath(); ctx.arc(cx, cy, glowR + 35, 0, Math.PI*2); ctx.fill();

  // Core
  ctx.save();
  ctx.shadowColor = '#ffee00';
  ctx.shadowBlur  = 40 + 12 * Math.sin(gameT * 0.04);
  const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 44);
  coreG.addColorStop(0,    '#ffffff');
  coreG.addColorStop(0.25, '#fff8a0');
  coreG.addColorStop(0.65, '#ffcc00');
  coreG.addColorStop(1,    '#ff7700');
  ctx.fillStyle = coreG;
  ctx.beginPath(); ctx.arc(cx, cy, 44, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── Solar system view ────────────────────────────────────────────────────────
function drawSolarSystem() {
  const cx = W / 2, cy = H / 2;
  const maxR       = ORBIT_RADII[ORBIT_RADII.length - 1];
  const orbitScale = Math.min(W, H) * 0.36 / maxR;
  const PR = 0.13; // planet radius scale for solar system view

  // Background
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, W, H);

  // Fixed background stars
  for (let i = 0; i < 180; i++) {
    const sx = (i * 137.508 + 30) % W;
    const sy = (i * 97.31  + 20) % H;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.8 * ((i % 3) / 3)})`;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  // Orbit rings for placed planets
  for (let i = 0; i < placedPlanets.length; i++) {
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, ORBIT_RADII[i] * orbitScale, 0, Math.PI*2); ctx.stroke();
  }

  // Animated sun
  drawSun(cx, cy);

  // Placed planets
  ctx.textAlign = 'center';
  for (const pp of placedPlanets) {
    const planet = PLANETS[pp.index];
    const ox = cx + ORBIT_RADII[pp.index] * orbitScale;
    const pr = Math.max(5, planet.radius * PR);
    planet.draw(ox, cy, pr);
    ctx.font = '11px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(planet.name, ox, cy + pr + 15);
  }
}

// ─── Transit ──────────────────────────────────────────────────────────────────
function drawTransit() {
  const p    = PLANETS[currentPlanetIndex];
  const ease = 1 - Math.pow(1 - Math.min(transitProgress, 1), 3);
  const px   = transitStart.x + (transitEnd.x - transitStart.x) * ease;
  const py   = transitStart.y + (transitEnd.y - transitStart.y) * ease;

  drawSolarSystem();

  // Flying planet
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur  = 25;
  p.draw(px, py, p.radius);
  ctx.restore();

  // Trail
  for (let i = 1; i <= 8; i++) {
    const ep    = Math.max(0, transitProgress - i * 0.015);
    const ease2 = 1 - Math.pow(1 - ep, 3);
    ctx.globalAlpha = Math.max(0, (0.3 - i * 0.03) * (1 - transitProgress));
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(
      transitStart.x + (transitEnd.x - transitStart.x) * ease2,
      transitStart.y + (transitEnd.y - transitStart.y) * ease2,
      p.radius * (1 - i * 0.08), 0, Math.PI*2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── Done ─────────────────────────────────────────────────────────────────────
function drawDone() {
  drawSolarSystem();

  for (const p of doneFireworks) {
    if (p.delay > 0) continue;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  const pulse = 1 + 0.08 * Math.sin(gameT * 0.05);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffee00';
  ctx.shadowBlur  = 30;
  ctx.font = `bold ${Math.round(52 * pulse)}px Arial`;
  ctx.fillStyle = '#ffee44';
  ctx.fillText('All Planets Found!', W/2, H/2 - 44);
  ctx.shadowBlur = 0;
  ctx.font = 'bold 28px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('Great job, space explorer!', W/2, H/2 + 20);
  ctx.restore();
}

// ─── UI ───────────────────────────────────────────────────────────────────────
const uiEl          = document.getElementById('ui');
const uiPlanetName  = document.getElementById('planet-name');
const uiInstructions = document.getElementById('instructions');

function updateUI() {
  if (phase === 'explore') {
    const planet = PLANETS[currentPlanetIndex];
    uiPlanetName.textContent = `You are: ${planet.name}`;
    uiPlanetName.style.color = planet.color;
    const status = activeTokens.map(tok => {
      const prefix = tok.type === 'ring' ? '(ring)' : tok.type === 'moon' ? '(moon)' : '';
      const mark   = tok.collected ? '\u2713' : '\u25cb';
      return `${prefix ? prefix + ' ' : ''}${tok.label} ${mark}`;
    }).join('     ');
    uiInstructions.textContent = status;
    uiEl.style.display = 'block';
  } else if (phase === 'fireworks') {
    uiInstructions.textContent = 'Found everything! Amazing!';
    uiEl.style.display = 'block';
  } else {
    uiEl.style.display = 'none';
  }
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, W, H);

  if (phase === 'explore' || phase === 'fireworks') {
    drawStars();
    drawAllTokens();
    drawPlayer();
    drawParticles();
  } else if (phase === 'transit') {
    drawTransit();
    drawParticles();
  } else if (phase === 'solar') {
    drawSolarSystem();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px Arial';
    ctx.fillStyle = 'white';
    ctx.shadowColor = PLANETS[currentPlanetIndex - 1].color;
    ctx.shadowBlur  = 22;
    ctx.fillText(`${PLANETS[currentPlanetIndex - 1].name} is home!`, W/2, 62);
    if (currentPlanetIndex < PLANETS.length) {
      ctx.shadowBlur = 0;
      ctx.font = '22px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`Next: ${PLANETS[currentPlanetIndex].name}`, W/2, 104);
    }
    ctx.restore();
  } else if (phase === 'done') {
    drawDone();
  }

  updateUI();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ─── Start ────────────────────────────────────────────────────────────────────
spawnActiveTokens();
loop();
