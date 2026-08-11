// =============================================================================
// LEVEL — The four worlds of the Grinch's night, built programmatically.
//
// Levels are still character grids (same legend as the side-scroller engine),
// but they're assembled by builder functions instead of hand-typed strings —
// the house stamper guarantees every Whoville house has a chimney you can
// drop down and a door you can walk out of.
//
// Legend:
//   G ground   B wall/ledge   ? gift block   S stone/ice   I one-way ledge
//   P chimney top   p chimney/brick   D pushable crate
//   C present   E mouse   F who-bird   X frost-lump
//   Y/y keys   L/l locked doors   O gift house (W4)   w Cindy Lou
// =============================================================================

import { CONFIG } from './config.js';
import { THEMES } from './themes.js';
import {
  Goomba, Present, MovingPlatform, Flyguy, Spiker, PushBlock,
  Key, Door, GiftHouse, CindyLou,
} from './entities.js';
import { drawSleigh, drawPresent, drawHeart } from './characters.js';

const ROWS = 25;

// ---------------------------------------------------------------------------
// grid helpers
// ---------------------------------------------------------------------------
function makeGrid(cols) {
  return Array.from({ length: ROWS }, () => Array(cols).fill(' '));
}

function set(g, col, row, ch) {
  if (row >= 0 && row < ROWS && col >= 0 && col < g[0].length) g[row][col] = ch;
}

function fillRect(g, c0, r0, c1, r1, ch) {
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) set(g, c, r, ch);
  }
}

function clearRect(g, c0, r0, c1, r1) {
  fillRect(g, c0, r0, c1, r1, ' ');
}

function toStrings(g) {
  return g.map(row => row.join(''));
}

// A terrace: solid ground from `topRow` down to the bottom of the level.
function terrace(g, c0, c1, topRow, ch = 'G') {
  fillRect(g, c0, topRow, c1, ROWS - 1, ch);
}

// Arc of presents (a little rainbow of gifts over a jump)
function presentArc(g, cMid, rowTop, span = 2) {
  for (let i = -span; i <= span; i++) {
    const lift = span - Math.abs(i);
    set(g, cMid + i, rowTop - Math.ceil(lift / 2), 'C');
  }
}

// Whoville house with an enterable interior.
// c = left column, ground = first solid street row. 12 cols wide.
// Roof at ground-7, interior floor = street, door gap on the right wall.
// Chimney shaft (2 cols) drops from above the roof into the living room.
function stampHouse(g, c, ground, wallCh = 'B') {
  const roofRow = ground - 7;         // solid roof slab row
  const wallTop = roofRow + 1;

  // walls, with door gaps (2 tall) at street level on BOTH sides —
  // you can stroll straight through a house, or come down the chimney
  fillRect(g, c, wallTop, c, ground - 3, wallCh);                 // left wall
  fillRect(g, c + 11, wallTop, c + 11, ground - 3, wallCh);       // right wall

  // roof slab with chimney gap at c+6..c+7
  fillRect(g, c, roofRow, c + 5, roofRow, wallCh);
  fillRect(g, c + 8, roofRow, c + 11, roofRow, wallCh);

  // chimney: brick walls either side of the open shaft, rising 2 above the
  // roof with a walkable rim (an easy hop from the rooftop)
  fillRect(g, c + 5, roofRow - 2, c + 5, roofRow - 1, 'p');
  fillRect(g, c + 8, roofRow - 2, c + 8, roofRow - 1, 'p');
  set(g, c + 5, roofRow - 3, 'P');
  set(g, c + 8, roofRow - 3, 'P');

  // roof-access ledges climbing up the left side
  fillRect(g, c - 7, ground - 3, c - 5, ground - 3, 'I');
  fillRect(g, c - 4, ground - 5, c - 2, ground - 5, 'I');

  return { roofRow, doorCol: c + 11, interior: { c0: c + 1, c1: c + 10, floor: ground - 1 } };
}

// ---------------------------------------------------------------------------
// WORLD 1 — Down Mount Crumpit
// ---------------------------------------------------------------------------
function buildWorld1() {
  const cols = 200;
  const g = makeGrid(cols);

  // descending terraces, summit to valley
  const steps = [
    [0, 15, 6], [16, 31, 8], [32, 47, 10], [48, 65, 12],
    [66, 85, 14], [86, 107, 16], [108, 131, 18], [132, 199, 20],
  ];
  for (const [c0, c1, top] of steps) terrace(g, c0, c1, top);

  // crevasse at the t5/t6 boundary — safe floor, presents, stair exit
  // (every rise is a single tile so nobody wall-slide-bounces forever)
  clearRect(g, 104, 16, 107, 21);
  fillRect(g, 104, 22, 107, ROWS - 1, 'G');
  set(g, 104, 21, 'C');
  set(g, 105, 21, 'B');
  fillRect(g, 106, 20, 106, 21, 'B');
  fillRect(g, 107, 19, 107, 21, 'B');

  // presents & gift blocks along the terraces
  set(g, 8, 4, 'C'); set(g, 10, 4, 'C');
  set(g, 22, 6, 'C'); set(g, 24, 6, 'C');
  fillRect(g, 26, 5, 28, 5, 'I'); set(g, 27, 3, 'C');
  set(g, 38, 7, '?'); set(g, 40, 7, '?');
  presentArc(g, 56, 10);
  set(g, 58, 9, '?');
  fillRect(g, 72, 11, 74, 11, 'I'); set(g, 73, 9, 'C');
  set(g, 78, 12, 'C'); set(g, 80, 12, 'C');
  set(g, 92, 13, '?'); set(g, 94, 13, '?');
  presentArc(g, 118, 14);
  fillRect(g, 122, 15, 124, 15, 'I'); set(g, 123, 13, 'C');
  set(g, 140, 18, 'C'); set(g, 143, 18, 'C'); set(g, 146, 18, 'C');
  set(g, 152, 16, '?'); set(g, 154, 16, '?');
  presentArc(g, 166, 18);
  set(g, 178, 18, 'C'); set(g, 180, 17, 'C'); set(g, 182, 18, 'C');

  // critters
  set(g, 42, 9, 'E');
  set(g, 60, 11, 'E');
  set(g, 76, 13, 'E');
  set(g, 100, 15, 'X');
  set(g, 120, 17, 'E');
  set(g, 136, 19, 'E');
  set(g, 160, 19, 'X');
  set(g, 172, 19, 'E');
  set(g, 50, 8, 'F');
  set(g, 90, 12, 'F');
  set(g, 148, 15, 'F');

  return {
    name: 'World 1: Down Mount Crumpit',
    theme: 'crumpitNight',
    story: [
      'The Grinch HATED Christmas!',
      'He tiptoed down Mount Crumpit with Max,',
      'to play a wonderful, awful trick...',
    ],
    playerStart: { col: 3, row: 6 },
    tiles: toStrings(g),
    movingPlatforms: [],
    goalCol: 190,
    goalRow: 20,
    goalType: 'sleigh',
  };
}

// ---------------------------------------------------------------------------
// WORLD 2 — Whoville by night
// ---------------------------------------------------------------------------
function buildWorld2() {
  const cols = 232;
  const g = makeGrid(cols);
  const ground = 20;

  terrace(g, 0, cols - 1, ground);

  // three who-houses
  const h1 = stampHouse(g, 28, ground, 'B');
  const h2 = stampHouse(g, 84, ground, 'S');
  const h3 = stampHouse(g, 150, ground, 'B');

  // interiors: presents under the roofs, a mouse or two, gift blocks
  set(g, 30, ground - 1, 'C'); set(g, 33, ground - 1, 'C'); set(g, 36, ground - 1, 'C');
  set(g, 34, ground - 4, '?');
  set(g, 31, ground - 1, 'E');
  set(g, 38, ground - 1, 'D');

  set(g, 86, ground - 1, 'C'); set(g, 89, ground - 1, 'C'); set(g, 92, ground - 1, 'C');
  set(g, 90, ground - 4, '?');
  set(g, 88, ground - 1, 'w');       // Cindy Lou, by the tree
  set(g, 94, ground - 1, 'C');

  set(g, 152, ground - 1, 'C'); set(g, 155, ground - 1, 'C'); set(g, 158, ground - 1, 'C');
  set(g, 156, ground - 4, '?');
  set(g, 154, ground - 1, 'E');
  set(g, 160, ground - 1, 'D');

  // rooftop route between the houses: ledges + presents + who-birds
  fillRect(g, 44, 11, 46, 11, 'I');
  set(g, 45, 9, 'C');
  fillRect(g, 52, 12, 54, 12, 'I');
  set(g, 53, 10, 'C');
  fillRect(g, 62, 13, 64, 13, 'I');
  set(g, 63, 11, 'C');
  set(g, 58, 10, 'F');

  fillRect(g, 100, 11, 102, 11, 'I');
  set(g, 101, 9, 'C');
  fillRect(g, 110, 12, 112, 12, 'I');
  set(g, 111, 10, 'C');
  fillRect(g, 120, 13, 122, 13, 'I');
  set(g, 121, 11, 'C');
  set(g, 116, 10, 'F');
  fillRect(g, 130, 14, 132, 14, 'I');
  set(g, 131, 12, 'C');

  // chimney presents — one bonus gift floating over each chimney mouth
  set(g, 34, 8, 'C'); set(g, 35, 8, 'C');
  set(g, 91, 8, 'C');
  set(g, 157, 8, 'C');

  // street life
  set(g, 12, ground - 1, 'C'); set(g, 16, ground - 1, 'C');
  set(g, 20, ground - 4, '?');
  set(g, 50, ground - 1, 'E');
  set(g, 70, ground - 4, '?'); set(g, 72, ground - 4, '?');
  set(g, 74, ground - 1, 'E');
  set(g, 108, ground - 1, 'E');
  set(g, 126, ground - 4, '?');
  set(g, 140, ground - 1, 'E');
  set(g, 168, ground - 1, 'C'); set(g, 171, ground - 1, 'C');
  set(g, 176, ground - 4, '?'); set(g, 178, ground - 4, '?');
  set(g, 182, ground - 1, 'E');
  presentArc(g, 195, ground - 2);
  set(g, 205, ground - 1, 'C'); set(g, 208, ground - 1, 'C'); set(g, 211, ground - 1, 'C');
  set(g, 214, ground - 2, 'C'); set(g, 216, ground - 1, 'C');

  return {
    name: 'World 2: Whoville',
    theme: 'whoville',
    story: [
      'Whoville lay fast asleep.',
      'Slip down the chimneys and gather',
      'every present — quiet as a mouse!',
    ],
    playerStart: { col: 3, row: ground },
    tiles: toStrings(g),
    movingPlatforms: [],
    goalCol: 222,
    goalRow: ground,
    goalType: 'sleigh',
  };
}

// ---------------------------------------------------------------------------
// WORLD 3 — Up Mount Crumpit (hauling the sack)
// ---------------------------------------------------------------------------
function buildWorld3() {
  const cols = 200;
  const g = makeGrid(cols);

  // ascending terraces, valley to summit
  const steps = [
    [0, 30, 20], [31, 52, 18], [53, 74, 16], [75, 96, 14],
    [97, 120, 12], [121, 144, 10], [145, 168, 8], [169, 199, 6],
  ];
  for (const [c0, c1, top] of steps) terrace(g, c0, c1, top);

  // 1-tile lip before every 2-row rise — a 2-tile wall triggers the
  // wall-slide bounce loop when you jump while hugging it (engine quirk)
  for (let i = 1; i < steps.length; i++) {
    const [c0] = steps[i];
    const prevTop = steps[i - 1][2];
    set(g, c0 - 1, prevTop - 1, 'B');
  }

  // ravine in t3 — a moving snow ledge crosses the top; if you fall in,
  // presents wait at the bottom and stone stairs climb back out the east side
  clearRect(g, 86, 14, 93, 18);
  fillRect(g, 86, 19, 93, ROWS - 1, 'G');
  set(g, 87, 18, 'C'); set(g, 89, 18, 'C'); set(g, 91, 18, 'C');
  set(g, 92, 18, 'B');
  fillRect(g, 93, 16, 93, 18, 'B');

  // presents and gift blocks up the climb
  set(g, 10, 19, 'C'); set(g, 14, 19, 'C');
  set(g, 20, 16, '?');
  set(g, 36, 17, 'C'); set(g, 40, 17, 'C');
  fillRect(g, 44, 15, 46, 15, 'I'); set(g, 45, 13, 'C');
  set(g, 58, 15, 'C'); set(g, 62, 15, 'C');
  set(g, 66, 12, '?');
  presentArc(g, 106, 11);
  set(g, 112, 9, '?');
  fillRect(g, 126, 7, 128, 7, 'I'); set(g, 127, 5, 'C');
  set(g, 132, 9, 'C'); set(g, 136, 9, 'C');
  set(g, 152, 7, 'C'); set(g, 156, 7, 'C');
  set(g, 160, 5, '?');
  presentArc(g, 178, 4);
  set(g, 186, 5, 'C'); set(g, 188, 5, 'C');

  // crates for optional stacking fun
  set(g, 48, 17, 'D');
  set(g, 116, 11, 'D'); set(g, 117, 11, 'D');

  // critters — colder and pricklier on the way up
  set(g, 26, 19, 'E');
  set(g, 46, 17, 'X');
  set(g, 70, 15, 'E');
  set(g, 82, 13, 'F');
  set(g, 104, 11, 'X');
  set(g, 124, 9, 'E');
  set(g, 140, 9, 'F');
  set(g, 150, 7, 'X');
  set(g, 174, 5, 'E');

  return {
    name: 'World 3: The Climb',
    theme: 'crumpitClimb',
    story: [
      'Three thousand feet up!',
      'He hauled the whole sack',
      'back up Mount Crumpit to dump it!',
    ],
    playerStart: { col: 3, row: 20 },
    tiles: toStrings(g),
    movingPlatforms: [
      { col: 88, row: 13, widthTiles: 3, rangeX: 160, rangeY: 0, speed: 1.3 },
    ],
    goalCol: 190,
    goalRow: 6,
    goalType: 'sleigh',
  };
}

// ---------------------------------------------------------------------------
// WORLD 4 — Christmas Morning (the heart grows three sizes)
// ---------------------------------------------------------------------------
function buildWorld4() {
  const cols = 232;
  const g = makeGrid(cols);
  const ground = 20;

  terrace(g, 0, cols - 1, ground);

  // five dark houses waiting for their presents (marker row = just above street)
  const houseCols = [30, 65, 100, 140, 180];
  for (const c of houseCols) set(g, c, ground - 1, 'O');

  // plenty of presents along the road (you need one per house) —
  // at least two sit right on the street before each house
  set(g, 10, ground - 1, 'C'); set(g, 14, ground - 1, 'C'); set(g, 18, ground - 2, 'C');
  set(g, 40, ground - 1, 'C'); set(g, 44, ground - 1, 'C');
  presentArc(g, 50, ground - 2);
  set(g, 54, ground - 4, '?');
  set(g, 90, ground - 1, 'C'); set(g, 94, ground - 1, 'C');
  set(g, 120, ground - 1, 'C'); set(g, 124, ground - 1, 'C');
  set(g, 162, ground - 1, 'C'); set(g, 166, ground - 1, 'C');
  fillRect(g, 74, ground - 4, 76, ground - 4, 'I');
  set(g, 75, ground - 6, 'C');
  set(g, 82, ground - 1, 'C'); set(g, 86, ground - 1, 'C');
  presentArc(g, 118, ground - 2);
  set(g, 126, ground - 4, '?');
  fillRect(g, 130, ground - 4, 132, ground - 4, 'I');
  set(g, 131, ground - 6, 'C');
  set(g, 152, ground - 1, 'C'); set(g, 156, ground - 1, 'C'); set(g, 160, ground - 2, 'C');
  presentArc(g, 170, ground - 2);
  set(g, 192, ground - 1, 'C'); set(g, 196, ground - 1, 'C');
  set(g, 200, ground - 4, '?');

  // gentle morning life — a few mice, happy who-birds, no frost-lumps
  set(g, 58, ground - 1, 'E');
  set(g, 112, ground - 1, 'E');
  set(g, 90, ground - 6, 'F');
  set(g, 165, ground - 6, 'F');
  set(g, 205, ground - 6, 'F');

  return {
    name: 'World 4: Christmas Morning',
    theme: 'dawn',
    story: [
      'Then his heart grew THREE sizes!',
      'Hurry — bring every present back',
      'and light up every house in Whoville!',
    ],
    playerStart: { col: 3, row: ground },
    tiles: toStrings(g),
    movingPlatforms: [],
    goalCol: 222,
    goalRow: ground,
    goalType: 'feast',
  };
}

export const LEVELS = [buildWorld1(), buildWorld2(), buildWorld3(), buildWorld4()];

// =============================================================================
// LEVEL LOADER — Parse tile map into entities
// =============================================================================
export function loadLevel(levelIndex) {
  const def = LEVELS[levelIndex];
  const ts = CONFIG.tile.size;
  const entities = [];
  let housesRequired = 0;

  const tiles = def.tiles.map((row, rowIdx) => {
    let newRow = '';
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      if (ch === 'C') {
        entities.push(new Present(col * ts, rowIdx * ts));
        newRow += ' ';
      } else if (ch === 'E') {
        entities.push(new Goomba(col * ts + 2, rowIdx * ts + (ts - CONFIG.enemies.goomba.height)));
        newRow += ' ';
      } else if (ch === 'F') {
        entities.push(new Flyguy(col * ts + 2, rowIdx * ts + (ts - CONFIG.enemies.flyguy.height)));
        newRow += ' ';
      } else if (ch === 'X') {
        entities.push(new Spiker(col * ts + 1, rowIdx * ts + (ts - CONFIG.enemies.spiker.height)));
        newRow += ' ';
      } else if (ch === 'D') {
        entities.push(new PushBlock(col * ts, rowIdx * ts));
        newRow += ' ';
      } else if (ch === 'Y') {
        entities.push(new Key(col * ts, rowIdx * ts, 'gold'));
        newRow += ' ';
      } else if (ch === 'y') {
        entities.push(new Key(col * ts, rowIdx * ts, 'silver'));
        newRow += ' ';
      } else if (ch === 'L') {
        entities.push(new Door(col * ts, rowIdx * ts, 'gold'));
        newRow += ' ';
      } else if (ch === 'l') {
        entities.push(new Door(col * ts, rowIdx * ts, 'silver'));
        newRow += ' ';
      } else if (ch === 'O') {
        entities.push(new GiftHouse(col * ts, rowIdx * ts));
        housesRequired++;
        newRow += ' ';
      } else if (ch === 'w') {
        entities.push(new CindyLou(col * ts, rowIdx * ts));
        newRow += ' ';
      } else {
        newRow += ch;
      }
    }
    return newRow;
  });

  for (const mp of def.movingPlatforms) {
    entities.push(new MovingPlatform(
      mp.col * ts,
      mp.row * ts,
      (mp.widthTiles || 3) * ts,
      mp.rangeX || 0,
      mp.rangeY || 0,
      mp.speed || CONFIG.movingPlatform.defaultSpeed,
    ));
  }

  const theme = THEMES[def.theme] || THEMES.crumpitNight;
  const playerX = def.playerStart.col * ts;
  const playerY = def.playerStart.row * ts - CONFIG.player.height;

  return {
    name: def.name,
    story: def.story || [],
    theme,
    tiles,
    entities,
    playerX,
    playerY,
    goalCol: def.goalCol * ts,
    goalGroundY: (def.goalRow ?? tiles.length - 2) * ts,
    goalType: def.goalType || 'sleigh',
    housesRequired,
    width: Math.max(...tiles.map(r => r.length)) * ts,
    height: tiles.length * ts,
  };
}

// =============================================================================
// TILE RENDERER
// =============================================================================
export function drawTiles(ctx, tiles, theme, camera) {
  const ts = CONFIG.tile.size;
  const cw = CONFIG.canvas.width;
  const chh = CONFIG.canvas.height;

  const startCol = Math.max(0, Math.floor(camera.x / ts));
  const endCol = Math.min(
    Math.max(...tiles.map(r => r.length)),
    Math.ceil((camera.x + cw) / ts) + 1
  );
  const startRow = Math.max(0, Math.floor(camera.y / ts));
  const endRow = Math.min(tiles.length, Math.ceil((camera.y + chh) / ts) + 1);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (col >= tiles[row].length) continue;
      const ch = tiles[row][col];
      if (!ch || ch === ' ') continue;

      const tileDef = theme.tiles[ch];
      if (!tileDef) continue;

      const x = col * ts;
      const y = row * ts;

      if (tileDef.gift) {
        // gift block — a wrapped box you bonk from below
        drawPresent(ctx, x + 2, y + 2, ts - 4, ts - 4, tileDef.color, '#ffd700');
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + ts / 2, y + ts / 2 + 2);
        continue;
      }

      ctx.fillStyle = tileDef.color;
      ctx.fillRect(x, y, ts, ts);

      if (tileDef.brick) {
        // brick courses for chimneys
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + ts / 2); ctx.lineTo(x + ts, y + ts / 2);
        ctx.moveTo(x + ts / 2, y); ctx.lineTo(x + ts / 2, y + ts / 2);
        ctx.moveTo(x + ts / 4, y + ts / 2); ctx.lineTo(x + ts / 4, y + ts);
        ctx.moveTo(x + 3 * ts / 4, y + ts / 2); ctx.lineTo(x + 3 * ts / 4, y + ts);
        ctx.stroke();
      }

      // top edge: heaped snow (exposed tiles) — buried tiles stay plain
      const above = row > 0 && col < tiles[row - 1].length ? tiles[row - 1][col] : ' ';
      const exposed = !above || above === ' ' || above === 'I';
      if (tileDef.snowCap && !exposed) {
        // buried under more ground: no cap, just the grid line
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.strokeRect(x, y, ts, ts);
        continue;
      }
      if (tileDef.snowCap && exposed) {
        ctx.fillStyle = tileDef.topColor;
        ctx.beginPath();
        ctx.moveTo(x, y + 6);
        ctx.quadraticCurveTo(x + ts * 0.25, y - 2, x + ts * 0.5, y + 5);
        ctx.quadraticCurveTo(x + ts * 0.75, y - 3, x + ts, y + 6);
        ctx.lineTo(x + ts, y + 8);
        ctx.lineTo(x, y + 8);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = tileDef.topColor;
        ctx.fillRect(x, y, ts, 4);
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(x, y, ts, ts);
    }
  }
}

// =============================================================================
// BACKGROUND RENDERER — night skies, stars, moon, mountains, Whoville
// =============================================================================
export function drawBackground(ctx, theme, camera, levelWidth, time = 0) {
  const cw = CONFIG.canvas.width;
  const chh = CONFIG.canvas.height;
  const bg = theme.background;

  // sky (screen space, before the camera transform)
  if (theme.skyGradient) {
    const grad = ctx.createLinearGradient(0, 0, 0, chh);
    grad.addColorStop(0, theme.skyGradient[0]);
    grad.addColorStop(1, theme.skyGradient[1]);
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = theme.sky;
  }
  ctx.fillRect(0, 0, cw, chh);

  // stars — fixed pseudo-random field, slow parallax, gentle twinkle
  if (bg.stars) {
    const off = camera.x * 0.1;
    for (let i = 0; i < 70; i++) {
      const sx = ((pseudo(i) * levelWidth * 0.5) - off) % cw;
      const x = sx < 0 ? sx + cw : sx;
      const y = pseudo(i + 100) * chh * 0.7 - camera.y * 0.05;
      const tw = Math.sin(time * 0.03 + i * 2.7) * 0.3 + 0.55;
      ctx.fillStyle = `rgba(255,255,240,${tw})`;
      ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1.2, i % 5 === 0 ? 2 : 1.2);
    }
  }

  // moon
  if (bg.moon) {
    const mx = cw - 140 - camera.x * 0.04;
    const my = 80 - camera.y * 0.03;
    ctx.fillStyle = '#f4f0dc';
    ctx.beginPath();
    ctx.arc(mx, my, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200,195,170,0.5)';
    for (const [dx, dy, r] of [[-10, -6, 6], [12, 10, 4], [4, -16, 3]]) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(244,240,220,0.12)';
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.fill();
  }

  // distant mountain ridges (two parallax layers)
  if (bg.mountains) {
    ridge(ctx, camera, cw, chh, 0.25, chh * 0.55, '#1c1c40', time);
    ridge(ctx, camera, cw, chh, 0.45, chh * 0.72, '#26264e', time + 40);
  }

  // Whoville skyline: curvy houses with (maybe lit) windows.
  // Bases sit at the street line (world row 20) so they peek over the tiles.
  if (bg.houses) {
    const off = camera.x * 0.4;
    const streetScreenY = 20 * CONFIG.tile.size - camera.y;
    for (let i = 0; i < Math.ceil(levelWidth / 130); i++) {
      const hx = i * 170 + 40 - off;
      if (hx < -120 || hx > cw + 60) continue;
      const hw = 60 + (i % 3) * 18;
      const hh = 70 + pseudo(i + 30) * 60;
      const hy = streetScreenY - hh;
      silhouetteHouse(ctx, hx, hy, hw, hh, i, time, bg.housesLit);
    }
  }
}

function pseudo(i) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function ridge(ctx, camera, cw, chh, parallax, baseY, color, seed) {
  const off = camera.x * parallax;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, chh + 10);
  const span = 180;
  const start = Math.floor(off / span) - 1;
  for (let i = start; i < start + Math.ceil(cw / span) + 3; i++) {
    const px = i * span - off;
    const peak = baseY - pseudo(i + seed) * chh * 0.35 + camera.y * 0.08;
    ctx.lineTo(px, peak);
    ctx.lineTo(px + span * 0.5, baseY + pseudo(i + seed + 7) * 30 + camera.y * 0.08);
  }
  ctx.lineTo(cw + 10, chh + 10);
  ctx.closePath();
  ctx.fill();
}

function silhouetteHouse(ctx, x, y, w, h, i, time, lit) {
  // body
  ctx.fillStyle = lit ? ['#b06a90', '#4a9898', '#b0a050'][i % 3] : '#232348';
  ctx.fillRect(x, y + h * 0.3, w, h * 0.7);
  // bent Seussian roof
  ctx.beginPath();
  ctx.moveTo(x - w * 0.1, y + h * 0.35);
  ctx.quadraticCurveTo(x + w * 0.3, y - h * 0.05, x + w * 0.6, y + h * 0.05);
  ctx.quadraticCurveTo(x + w * 0.72, y + h * 0.08, x + w * 0.68, y - h * 0.12);
  ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.02, x + w * 1.1, y + h * 0.35);
  ctx.closePath();
  ctx.fill();

  // windows: mostly dark before the presents come back, all warm after
  for (let wi = 0; wi < 3; wi++) {
    const wx = x + w * (0.2 + wi * 0.28);
    const wy = y + h * 0.55;
    const isLit = lit || pseudo(i * 3 + wi) > 0.75;
    const flicker = Math.sin(time * 0.02 + i + wi * 2) * 0.15;
    ctx.fillStyle = isLit ? `rgba(255,214,120,${0.75 + flicker})` : 'rgba(30,30,60,0.9)';
    ctx.fillRect(wx, wy, 8, 11);
  }
}

// =============================================================================
// GOAL — the sleigh (worlds 1-3) or the Christmas feast (world 4)
// =============================================================================
export function drawGoal(ctx, goalX, groundY, goalType, time, locked) {
  if (goalType === 'feast') {
    drawFeast(ctx, goalX, groundY, time);
  } else {
    drawSleigh(ctx, goalX - 20, groundY, time, 1);
  }

  if (locked) {
    // World 4: houses still dark — the feast waits
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText('Light every house first!', goalX + 20, groundY - 90);
  }
}

function drawFeast(ctx, x, groundY, time) {
  ctx.save();
  ctx.translate(x - 20, groundY);

  // long table
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(-10, -26, 100, 8);
  ctx.fillRect(0, -18, 8, 18);
  ctx.fillRect(72, -18, 8, 18);
  // tablecloth
  ctx.fillStyle = '#f0e8d8';
  ctx.fillRect(-10, -30, 100, 6);

  // the roast beast!
  ctx.fillStyle = '#b05a2a';
  ctx.beginPath();
  ctx.ellipse(40, -38, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8874a';
  ctx.beginPath();
  ctx.ellipse(40, -41, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // drumstick bones
  ctx.fillStyle = '#f0e8d8';
  ctx.beginPath();
  ctx.arc(18, -44, 3, 0, Math.PI * 2);
  ctx.arc(62, -44, 3, 0, Math.PI * 2);
  ctx.fill();

  // steam curls
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const ph = time * 0.04 + i * 2;
    ctx.beginPath();
    ctx.moveTo(28 + i * 12, -50);
    ctx.quadraticCurveTo(24 + i * 12 + Math.sin(ph) * 5, -62, 30 + i * 12 + Math.sin(ph + 1) * 5, -74);
    ctx.stroke();
  }

  // a couple of presents under the table
  drawPresent(ctx, 8, -14, 14, 12, '#3a9a5a', '#ffd700');
  drawPresent(ctx, 56, -14, 14, 12, '#4a6ad8', '#ffd700');

  // floating heart above the feast
  const beat = 1 + Math.sin(time * 0.08) * 0.08;
  drawHeart(ctx, 40, -95, 18 * beat, '#e04858', '#ffffff');

  ctx.restore();
}
