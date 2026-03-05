// ─── Planet data ────────────────────────────────────────────────────────────
const PLANETS = [
  {
    name: 'Mercury',
    color: '#b5b5b5',
    radius: 72,
    draw(cx, cy, r, t) {
      // Grey cratered world
      ctx.fillStyle = '#b5b5b5';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#999';
      for (const [ox, oy, cr] of [[-5,-4,4],[6,3,3],[-3,7,3],[8,-6,5]]) {
        ctx.beginPath(); ctx.arc(cx+ox, cy+oy, cr, 0, Math.PI*2); ctx.fill();
      }
    }
  },
  {
    name: 'Venus',
    color: '#e8c97e',
    radius: 96,
    draw(cx, cy, r, t) {
      // Yellowish cloudy
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#fff5d0'); g.addColorStop(1, '#c8a040');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,180,0.4)';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.ellipse(cx, cy+i*8, r*0.9, 3, 0, 0, Math.PI*2); ctx.stroke();
      }
    }
  },
  {
    name: 'Earth',
    color: '#4fa3e0',
    radius: 104,
    draw(cx, cy, r, t) {
      ctx.fillStyle = '#2255aa';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3ab54a';
      ctx.beginPath(); ctx.ellipse(cx-5, cy-6, 10, 8, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+7, cy+4, 8, 6, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx-3, cy+8, 6, 5, 0.2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(cx, cy-r*0.4, r*0.7, 4, 0, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Mars',
    color: '#c1440e',
    radius: 88,
    draw(cx, cy, r, t) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#e06030'); g.addColorStop(1, '#8b2500');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Polar ice cap
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.ellipse(cx, cy-r+4, 7, 4, 0, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Jupiter',
    color: '#c88b3a',
    radius: 160,
    draw(cx, cy, r, t) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, '#e8c080'); g.addColorStop(1, '#a06020');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Bands
      const bands = [
        {y:-16, h:6, c:'rgba(140,80,20,0.6)'},
        {y:-6,  h:5, c:'rgba(200,160,80,0.5)'},
        {y:4,   h:7, c:'rgba(130,70,20,0.65)'},
        {y:14,  h:5, c:'rgba(180,130,60,0.4)'},
      ];
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      for (const b of bands) {
        ctx.fillStyle = b.c;
        ctx.fillRect(cx-r, cy+b.y, r*2, b.h);
      }
      // Great Red Spot
      ctx.fillStyle = 'rgba(180,60,20,0.85)';
      ctx.beginPath(); ctx.ellipse(cx+12, cy+4, 10, 7, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
  },
  {
    name: 'Saturn',
    color: '#e4d19a',
    radius: 136,
    draw(cx, cy, r, t) {
      // Rings first (behind)
      ctx.strokeStyle = 'rgba(210,190,130,0.7)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.7, r*0.35, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = 'rgba(180,160,100,0.5)';
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*2.0, r*0.42, 0, 0, Math.PI*2); ctx.stroke();
      // Planet
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#f5eac0'); g.addColorStop(1, '#b09050');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Subtle bands
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
      for (const [yo, h, a] of [[-10,5,0.3],[0,4,0.25],[10,5,0.3]]) {
        ctx.fillStyle = `rgba(160,130,70,${a})`;
        ctx.fillRect(cx-r, cy+yo, r*2, h);
      }
      ctx.restore();
    }
  },
  {
    name: 'Uranus',
    color: '#7de8e8',
    radius: 120,
    draw(cx, cy, r, t) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#b0f8f8'); g.addColorStop(1, '#4ab8c8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Tilted ring
      ctx.strokeStyle = 'rgba(100,220,220,0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.5, r*0.25, Math.PI*0.2, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Neptune',
    color: '#3f54ba',
    radius: 112,
    draw(cx, cy, r, t) {
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#6080e0'); g.addColorStop(1, '#1a2880');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Storm spot
      ctx.fillStyle = 'rgba(20,20,120,0.7)';
      ctx.beginPath(); ctx.ellipse(cx-8, cy-5, 8, 5, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,130,220,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.4, r*0.2, 0, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Pluto',
    color: '#c8a882',
    radius: 56,
    draw(cx, cy, r, t) {
      ctx.fillStyle = '#b89870';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#e8c8a0';
      ctx.beginPath(); ctx.arc(cx-3, cy-3, r*0.45, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#a07850';
      for (const [ox,oy,cr] of [[-2,5,2],[5,2,1.5],[0,-2,1.5]]) {
        ctx.beginPath(); ctx.arc(cx+ox, cy+oy, cr, 0, Math.PI*2); ctx.fill();
      }
    }
  },
  {
    name: 'Ceres',
    color: '#a0a0b0',
    radius: 44,
    draw(cx, cy, r, t) {
      // Grey rocky dwarf planet with bright white spots
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#c0c0cc'); g.addColorStop(1, '#606070');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Bright Occator crater spots
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(cx+r*0.2, cy-r*0.1, r*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+r*0.28, cy-r*0.05, r*0.07, 0, Math.PI*2); ctx.fill();
      // Craters
      ctx.strokeStyle = 'rgba(80,80,90,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx-r*0.3, cy+r*0.2, r*0.2, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx-r*0.1, cy-r*0.3, r*0.15, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Haumea',
    color: '#d4c8b0',
    radius: 44,
    draw(cx, cy, r, t) {
      // Egg-shaped (elongated ellipsoid) with a ring
      ctx.strokeStyle = 'rgba(200,180,140,0.5)';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.8, r*0.3, 0, 0, Math.PI*2); ctx.stroke();
      // Elongated body
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.2, r*0.1, cx, cy, r);
      g.addColorStop(0, '#ede0c8'); g.addColorStop(1, '#8c7860');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.4, r*0.8, 0, 0, Math.PI*2); ctx.fill();
      // Surface detail
      ctx.strokeStyle = 'rgba(100,85,65,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, r*1.0, r*0.55, 0, 0, Math.PI*2); ctx.stroke();
    }
  },
  {
    name: 'Makemake',
    color: '#c87840',
    radius: 44,
    draw(cx, cy, r, t) {
      // Reddish-brown icy world
      const g = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
      g.addColorStop(0, '#e09060'); g.addColorStop(1, '#803010');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Dark patches
      ctx.fillStyle = 'rgba(60,20,5,0.4)';
      ctx.beginPath(); ctx.ellipse(cx+r*0.2, cy+r*0.2, r*0.3, r*0.2, 0.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx-r*0.25, cy-r*0.15, r*0.2, r*0.15, -0.3, 0, Math.PI*2); ctx.fill();
    }
  },
  {
    name: 'Eris',
    color: '#d8d8e0',
    radius: 50,
    draw(cx, cy, r, t) {
      // Pale icy distant world
      const g = ctx.createRadialGradient(cx-r*0.35, cy-r*0.35, r*0.05, cx, cy, r);
      g.addColorStop(0, '#f0f0f8'); g.addColorStop(0.6, '#d0d0dc'); g.addColorStop(1, '#8888a0');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
      // Subtle icy sheen
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(cx-r*0.2, cy-r*0.25, r*0.5, r*0.25, -0.4, 0, Math.PI*2); ctx.fill();
      // A few faint surface marks
      ctx.strokeStyle = 'rgba(140,140,160,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx+r*0.2, cy+r*0.1, r*0.25, 0, Math.PI*2); ctx.stroke();
    }
  }
];

// ─── Canvas setup ────────────────────────────────────────────────────────────
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ─── Starfield ───────────────────────────────────────────────────────────────
const WORLD_W = 3000;
const WORLD_H = 3000;

const stars = [];
for (let i = 0; i < 600; i++) {
  stars.push({
    x: Math.random() * WORLD_W,
    y: Math.random() * WORLD_H,
    r: Math.random() * 1.8 + 0.3,
    brightness: Math.random(),
    twinkle: Math.random() * Math.PI * 2
  });
}

// ─── Game state ───────────────────────────────────────────────────────────────
let currentPlanetIndex = 0;
let placedPlanets = []; // [{planet, sx, sy}] in solar system coords
let phase = 'explore'; // 'explore' | 'fireworks' | 'transit' | 'solar' | 'done'

let playerX = WORLD_W / 2;
let playerY = WORLD_H / 2;
let camX = 0;
let camY = 0;

// Name token position (random each round)
let tokenX = 0;
let tokenY = 0;
let tokenFound = false;
let tokenPulse = 0;

// Keys
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup',   e => { keys[e.key] = false; });

// Fireworks particles
let particles = [];
let transitTimer = 0;
let doneFireworks = [];

// Solar system display
const ssCanvas = document.getElementById('ss-canvas');
const ssCtx = ssCanvas.getContext('2d');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function rnd(min, max) { return Math.random() * (max - min) + min; }

function spawnToken() {
  // Place name somewhere in the world, not too close to player start
  let tx, ty;
  do {
    tx = rnd(100, WORLD_W - 100);
    ty = rnd(100, WORLD_H - 100);
  } while (Math.hypot(tx - playerX, ty - playerY) < 400);
  tokenX = tx;
  tokenY = ty;
  tokenFound = false;
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
  for (let burst = 0; burst < 12; burst++) {
    const bx = rnd(W * 0.1, W * 0.9);
    const by = rnd(H * 0.1, H * 0.7);
    const delay = burst * 18;
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rnd(1, 8);
      doneFireworks.push({
        x: bx, y: by,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        delay,
        decay: rnd(0.008, 0.02),
        color: `hsl(${Math.floor(Math.random()*360)},100%,65%)`,
        size: rnd(2, 6)
      });
    }
  }
}

// ─── Solar system layout ──────────────────────────────────────────────────────
// Orbital radii for display (just visual, not accurate)
const ORBIT_RADII = [80, 115, 155, 195, 260, 330, 390, 440, 475, 505, 535, 565, 600];

function getSolarPos(index, cx, cy) {
  const r = ORBIT_RADII[index];
  return { x: cx + r, y: cy };
}

// ─── Main update ─────────────────────────────────────────────────────────────
const SPEED = 4;
let t = 0;
let transitProgress = 0;
let transitStart = null;
let transitEnd = null;

function update() {
  t++;
  tokenPulse = (tokenPulse + 0.06) % (Math.PI * 2);

  if (phase === 'explore') {
    // Movement
    let dx = 0, dy = 0;
    if (keys['ArrowLeft']  || keys['a']) dx -= SPEED;
    if (keys['ArrowRight'] || keys['d']) dx += SPEED;
    if (keys['ArrowUp']    || keys['w']) dy -= SPEED;
    if (keys['ArrowDown']  || keys['s']) dy += SPEED;

    playerX = Math.max(0, Math.min(WORLD_W, playerX + dx));
    playerY = Math.max(0, Math.min(WORLD_H, playerY + dy));

    // Camera follows player
    camX = playerX - W / 2;
    camY = playerY - H / 2;
    camX = Math.max(0, Math.min(WORLD_W - W, camX));
    camY = Math.max(0, Math.min(WORLD_H - H, camY));

    // Check collision with token
    const planet = PLANETS[currentPlanetIndex];
    const dist = Math.hypot(playerX - tokenX, playerY - tokenY);
    if (dist < planet.radius + 40) {
      tokenFound = true;
      phase = 'fireworks';
      spawnFireworks(playerX - camX, playerY - camY);
      // Also fireworks at token screen pos
      spawnFireworks(tokenX - camX, tokenY - camY);
      transitTimer = 120; // frames to show fireworks
    }
  }

  if (phase === 'fireworks') {
    transitTimer--;
    if (transitTimer <= 0) {
      phase = 'transit';
      // Set up transit: planet flies from current pos to solar system
      transitProgress = 0;
      transitStart = { x: playerX - camX, y: playerY - camY };
      // Solar system will be drawn centered on screen
      const ssCX = W / 2;
      const ssCY = H / 2;
      const sp = getSolarPos(currentPlanetIndex, ssCX, ssCY);
      transitEnd = sp;
    }
  }

  if (phase === 'transit') {
    transitProgress += 0.018;
    if (transitProgress >= 1) {
      transitProgress = 1;
      // Planet landed
      placedPlanets.push({ index: currentPlanetIndex });
      currentPlanetIndex++;
      if (currentPlanetIndex >= PLANETS.length) {
        phase = 'done';
        spawnBigFireworks();
      } else {
        phase = 'solar';
        // Show solar system for a moment, then go back to explore
        transitTimer = 140;
        // Reset player position
        playerX = WORLD_W / 2;
        playerY = WORLD_H / 2;
        spawnToken();
      }
    }
  }

  if (phase === 'solar') {
    transitTimer--;
    if (transitTimer <= 0) {
      phase = 'explore';
    }
  }

  // Update particles
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.08;
    p.life -= p.decay;
  }

  // Done fireworks
  let tick = 0;
  for (const p of doneFireworks) {
    if (p.delay > 0) { p.delay--; continue; }
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.05;
    p.life -= p.decay;
  }
  doneFireworks = doneFireworks.filter(p => p.life > 0 || p.delay > 0);
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function drawStars() {
  for (const s of stars) {
    const sx = s.x - camX;
    const sy = s.y - camY;
    if (sx < -5 || sx > W+5 || sy < -5 || sy > H+5) continue;
    const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.twinkle + t * 0.03));
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawToken() {
  if (tokenFound) return;
  const sx = tokenX - camX;
  const sy = tokenY - camY;
  if (sx < -100 || sx > W+100 || sy < -100 || sy > H+100) {
    // Draw arrow indicator at screen edge
    const angle = Math.atan2(tokenY - playerY, tokenX - playerX);
    const ex = W/2 + Math.cos(angle) * (Math.min(W,H)/2 - 60);
    const ey = H/2 + Math.sin(angle) * (Math.min(W,H)/2 - 60);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.fillStyle = `rgba(255,255,100,${0.5 + 0.5*Math.sin(tokenPulse)})`;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('➤', 0, 0);
    ctx.restore();
    return;
  }

  const pulse = 1 + 0.15 * Math.sin(tokenPulse);
  const glow = 8 + 4 * Math.sin(tokenPulse);
  const planet = PLANETS[currentPlanetIndex];

  // Glow
  ctx.save();
  ctx.shadowColor = planet.color;
  ctx.shadowBlur = glow * 3;
  ctx.font = `bold ${Math.round(36 * pulse)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(planet.name, sx, sy);
  // Stars around the text
  ctx.shadowBlur = 0;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + t * 0.02;
    const r2 = 50 + 8 * Math.sin(tokenPulse + i);
    const sx2 = sx + Math.cos(a) * r2;
    const sy2 = sy + Math.sin(a) * r2;
    ctx.fillStyle = planet.color;
    ctx.font = '16px Arial';
    ctx.fillText('★', sx2, sy2);
  }
  ctx.restore();
}

function drawPlayer() {
  const planet = PLANETS[currentPlanetIndex];
  const sx = playerX - camX;
  const sy = playerY - camY;
  // Glow
  ctx.save();
  ctx.shadowColor = planet.color;
  ctx.shadowBlur = 20;
  planet.draw(sx, sy, planet.radius, t);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawSolarSystem(canv, c, full) {
  const cw = canv.width, ch = canv.height;
  const cx = cw / 2, cy = ch / 2;

  c.fillStyle = '#000010';
  c.fillRect(0, 0, cw, ch);

  // Stars
  c.fillStyle = 'white';
  for (let i = 0; i < 150; i++) {
    const sx = (i * 137.5 + 30) % cw;
    const sy = (i * 97.3 + 20) % ch;
    c.fillStyle = `rgba(255,255,255,${0.3+0.7*((i%3)/3)})`;
    c.fillRect(sx, sy, 1.5, 1.5);
  }

  // Sun
  c.save();
  c.shadowColor = '#ffee00';
  c.shadowBlur = 40;
  const sg = c.createRadialGradient(cx, cy, 0, cx, cy, 35);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.4, '#ffee44'); sg.addColorStop(1, '#ff8800');
  c.fillStyle = sg;
  c.beginPath(); c.arc(cx, cy, 35, 0, Math.PI*2); c.fill();
  c.restore();

  // Orbits + placed planets
  const shown = full ? PLANETS.length : placedPlanets.length;
  for (let i = 0; i < shown; i++) {
    const r = ORBIT_RADII[i];
    c.strokeStyle = 'rgba(255,255,255,0.1)';
    c.lineWidth = 1;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.stroke();
  }

  for (const pp of placedPlanets) {
    const planet = PLANETS[pp.index];
    const r = ORBIT_RADII[pp.index];
    // Save and swap the global ctx temporarily
    const saved = { ctx, W, H };
    // We need to draw on c not ctx — use a proxy approach
    drawPlanetOn(c, planet, cx + r, cy, planet.radius * 0.7, t);
    // Label
    c.font = '10px Arial';
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.textAlign = 'center';
    c.fillText(planet.name, cx + r, cy + planet.radius * 0.7 + 14);
  }
}

// Draw a planet on an arbitrary canvas context
function drawPlanetOn(c, planet, px, py, r, t) {
  // Temporarily replace ctx
  const realCtx = ctx;
  // We'll just re-implement drawing inline using c
  // Switch global ctx to c for the duration
  Object.defineProperty(window, '_drawCtx', { value: c, configurable: true });
  const origCtx = ctx;
  // Dirty trick: redraw using c by temporarily aliasing
  drawPlanetOnContext(c, planet, px, py, r, t);
}

function drawPlanetOnContext(c, planet, px, py, r, t) {
  // Simplified planet drawing for solar system view
  const p = planet;
  if (p.name === 'Mercury') {
    c.fillStyle = '#b5b5b5';
    c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Venus') {
    c.fillStyle = '#e8c97e';
    c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Earth') {
    c.fillStyle = '#2255aa'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3ab54a'; c.beginPath(); c.ellipse(px-r*0.2, py-r*0.2, r*0.4, r*0.3, -0.3, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Mars') {
    const g = c.createRadialGradient(px-r*0.3, py-r*0.3, r*0.1, px, py, r);
    g.addColorStop(0, '#e06030'); g.addColorStop(1, '#8b2500');
    c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Jupiter') {
    c.fillStyle = '#c88b3a'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
    c.save(); c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.clip();
    c.fillStyle = 'rgba(140,80,20,0.6)'; c.fillRect(px-r, py-r*0.4, r*2, r*0.3);
    c.fillStyle = 'rgba(180,60,20,0.7)'; c.beginPath(); c.ellipse(px+r*0.3, py+r*0.1, r*0.25, r*0.18, 0, 0, Math.PI*2); c.fill();
    c.restore();
  } else if (p.name === 'Saturn') {
    c.strokeStyle = 'rgba(210,190,130,0.7)'; c.lineWidth = r*0.3;
    c.beginPath(); c.ellipse(px, py, r*1.7, r*0.35, 0, 0, Math.PI*2); c.stroke();
    c.fillStyle = '#e4d19a'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Uranus') {
    c.fillStyle = '#7de8e8'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(100,220,220,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(px, py, r*1.5, r*0.25, Math.PI*0.2, 0, Math.PI*2); c.stroke();
  } else if (p.name === 'Neptune') {
    c.fillStyle = '#3f54ba'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Pluto') {
    c.fillStyle = '#c8a882'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Ceres') {
    c.fillStyle = '#a0a0b0'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(px+r*0.2, py-r*0.1, r*0.12, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Haumea') {
    c.fillStyle = '#d4c8b0'; c.beginPath(); c.ellipse(px, py, r*1.4, r*0.8, 0, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(200,180,140,0.5)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(px, py, r*1.8, r*0.3, 0, 0, Math.PI*2); c.stroke();
  } else if (p.name === 'Makemake') {
    c.fillStyle = '#c87840'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
  } else if (p.name === 'Eris') {
    c.fillStyle = '#d8d8e0'; c.beginPath(); c.arc(px, py, r, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(px-r*0.2, py-r*0.2, r*0.5, r*0.25, -0.4, 0, Math.PI*2); c.fill();
  }
}

function drawTransit() {
  const planet = PLANETS[currentPlanetIndex - (phase === 'done' ? 0 : 0)];
  // Actually currentPlanetIndex hasn't advanced yet during transit
  const pidx = currentPlanetIndex; // still on current during transit
  const p = PLANETS[pidx];
  const ease = transitProgress < 1 ? 1 - Math.pow(1 - transitProgress, 3) : 1;
  const px = transitStart.x + (transitEnd.x - transitStart.x) * ease;
  const py = transitStart.y + (transitEnd.y - transitStart.y) * ease;

  // Draw a dark overlay
  ctx.fillStyle = 'rgba(0,0,10,0.85)';
  ctx.fillRect(0, 0, W, H);

  // Draw solar system in background
  drawSolarSystem(canvas, ctx, false);

  // Draw planet flying in
  ctx.save();
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 20;
  p.draw(px, py, p.radius, t);
  ctx.restore();

  // Trail
  for (let i = 1; i <= 8; i++) {
    const ep = Math.max(0, transitProgress - i * 0.015);
    const ease2 = 1 - Math.pow(1 - ep, 3);
    const trailX = transitStart.x + (transitEnd.x - transitStart.x) * ease2;
    const trailY = transitStart.y + (transitEnd.y - transitStart.y) * ease2;
    ctx.fillStyle = `rgba(${p.color.replace(/[^,]+(?=\))/,'').slice(1)}${p.color},${0.3 - i*0.03})`;
    ctx.globalAlpha = (0.3 - i * 0.03) * (1 - transitProgress);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(trailX, trailY, p.radius * (1 - i * 0.08), 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawDone() {
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, W, H);

  // Draw full solar system
  drawSolarSystem(canvas, ctx, false);

  // Big fireworks
  for (const p of doneFireworks) {
    if (p.delay > 0) continue;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Congratulations text
  const pulse = 1 + 0.08 * Math.sin(t * 0.05);
  ctx.save();
  ctx.shadowColor = '#ffee00';
  ctx.shadowBlur = 30;
  ctx.font = `bold ${Math.round(52 * pulse)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffee44';
  ctx.fillText('All Planets Found!', W/2, H/2 - 40);
  ctx.font = `bold 28px Arial`;
  ctx.fillStyle = 'white';
  ctx.fillText('Great job, space explorer!', W/2, H/2 + 20);
  ctx.restore();
}

// ─── UI ───────────────────────────────────────────────────────────────────────
const uiPlanetName = document.getElementById('planet-name');
const uiInstructions = document.getElementById('instructions');

function updateUI() {
  if (phase === 'explore') {
    const p = PLANETS[currentPlanetIndex];
    uiPlanetName.textContent = `You are: ${p.name}`;
    uiInstructions.textContent = 'Use arrow keys to find your name!';
    uiPlanetName.style.color = p.color;
    document.getElementById('ui').style.display = 'block';
  } else if (phase === 'fireworks') {
    uiInstructions.textContent = 'You found it!';
    document.getElementById('ui').style.display = 'block';
  } else {
    document.getElementById('ui').style.display = 'none';
  }
}

// ─── Game loop ────────────────────────────────────────────────────────────────
function draw() {
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, W, H);

  if (phase === 'explore' || phase === 'fireworks') {
    drawStars();
    drawToken();
    drawPlayer();
    drawParticles();
  } else if (phase === 'transit') {
    drawTransit();
    drawParticles();
  } else if (phase === 'solar') {
    // Show solar system with placed planets
    ctx.fillStyle = '#000010';
    ctx.fillRect(0, 0, W, H);
    drawSolarSystem(canvas, ctx, false);
    // Banner
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.shadowColor = PLANETS[currentPlanetIndex-1].color;
    ctx.shadowBlur = 20;
    ctx.fillText(`${PLANETS[currentPlanetIndex-1].name} is home!`, W/2, 60);
    if (currentPlanetIndex < PLANETS.length) {
      ctx.shadowBlur = 0;
      ctx.font = '22px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`Next: ${PLANETS[currentPlanetIndex].name}`, W/2, 100);
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
spawnToken();
document.getElementById('planet-name').style.color = PLANETS[0].color;
loop();
