// Turn Asher's saved drawings into game sprites.
//
// The drawings in kid/prints are full-canvas screenshots: a near-white sheet
// with a small block of colour somewhere in the middle. This tool crops each
// one to its content, drops the near-white pixels to transparent, and writes
// art/NN-name.png plus art/fruits.json (the merge ladder itself).
//
// The drawings are the permanent record; art/ is derived and rebuildable.
// Re-run after Asher draws more:  node tools/extract_art.mjs
//
// Ordering is the order he drew them — the ladder climbs the way he worked,
// so the big green one he finished with is the last fruit in the game.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gameDir = join(__dirname, '..');
const printsDir = join(gameDir, '..', 'kid', 'prints');
const artDir = join(gameDir, 'art');

// A pixel this pale is paper, not paint.
const WHITE = 245;

// ---- PNG read -------------------------------------------------------------

function decodePng(file) {
  const buf = readFileSync(file);
  let off = 8, width = 0, height = 0, colorType = 2;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8) throw new Error(`${file}: only 8-bit channels supported`);
      colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    off += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!bpp) throw new Error(`${file}: unsupported colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = 1 + width * bpp;
  const px = Buffer.alloc(width * height * bpp);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    for (let i = 0; i < width * bpp; i++) {
      const v = raw[y * stride + 1 + i];
      const a = i >= bpp ? px[y * width * bpp + i - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * width * bpp + i] : 0;
      const c = i >= bpp && y > 0 ? px[(y - 1) * width * bpp + i - bpp] : 0;
      let out;
      if (filter === 0) out = v;
      else if (filter === 1) out = v + a;
      else if (filter === 2) out = v + b;
      else if (filter === 3) out = v + ((a + b) >> 1);
      else {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        out = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      px[y * width * bpp + i] = out & 255;
    }
  }
  return { width, height, bpp, px };
}

// ---- PNG write (RGBA) -----------------------------------------------------

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([len, typed, crc]);
}

function encodePngRgba(width, height, rgba) {
  const stride = 1 + width * 4;
  const rawData = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    rawData[y * stride] = 0; // filter: none
    rgba.copy(rawData, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(rawData, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- crop + de-paper ------------------------------------------------------

function cropToContent(img) {
  const { width, height, bpp, px } = img;
  const paper = (o) =>
    (bpp === 4 && px[o + 3] < 8) ||
    (px[o] >= WHITE && px[o + 1] >= WHITE && px[o + 2] >= WHITE);

  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (paper((y * width + x) * bpp)) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null; // nothing drawn

  const w = maxX - minX + 1, h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  const tally = new Map();
  let painted = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = ((minY + y) * width + minX + x) * bpp;
      const dst = (y * w + x) * 4;
      if (paper(src)) continue; // stays transparent
      out[dst] = px[src];
      out[dst + 1] = px[src + 1];
      out[dst + 2] = px[src + 2];
      out[dst + 3] = 255;
      painted++;
      const key = `${px[src]},${px[src + 1]},${px[src + 2]}`;
      tally.set(key, (tally.get(key) || 0) + 1);
    }
  }
  const colours = [...tally].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({
    rgb: k.split(',').map(Number),
    share: n / painted,
  }));
  return { w, h, rgba: out, colours, painted };
}

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// ---- the ladder -----------------------------------------------------------

// Names for the shapes Asher drew, in the order he drew them. Anything past
// this list gets called "fruit N" — rename freely, the game reads these from
// art/fruits.json and nothing else depends on them.
const NAMES = [
  'cherry', 'blueberry', 'lime', 'plum', 'orange', 'green apple',
  'peach', 'coconut', 'strawberry', 'pineapple', 'watermelon',
];

// Only the fruit-drawing session. Asher's earlier prints in the same folder are
// other pictures, not game art. Widen with:  node tools/extract_art.mjs 2026-09
const SET = process.argv[2] || '2026-08-21';
const files = readdirSync(printsDir)
  .filter((f) => f.startsWith(`drawing-asher-${SET}`) && f.endsWith('.png'))
  .sort(); // ISO timestamps sort chronologically

// art/ is derived, so clear it rather than letting renamed tiers pile up.
mkdirSync(artDir, { recursive: true });
for (const stale of readdirSync(artDir)) {
  if (stale.endsWith('.png')) rmSync(join(artDir, stale));
}

const seen = new Set();
const fruits = [];
let skippedBlank = 0, skippedDup = 0;

for (const file of files) {
  const full = join(printsDir, file);
  const cropped = cropToContent(decodePng(full));
  if (!cropped) { skippedBlank++; console.log(`  skip (blank)      ${file}`); continue; }

  // Two saves of the same picture should not become two fruits.
  const fingerprint = createHash('sha1').update(cropped.rgba).digest('hex');
  if (seen.has(fingerprint)) { skippedDup++; console.log(`  skip (duplicate)  ${file}`); continue; }
  seen.add(fingerprint);

  const tier = fruits.length;
  const name = NAMES[tier] || `fruit ${tier + 1}`;
  const out = `${String(tier + 1).padStart(2, '0')}-${name.replace(/\s+/g, '-')}.png`;
  writeFileSync(join(artDir, out), encodePngRgba(cropped.w, cropped.h, cropped.rgba));

  fruits.push({
    tier,
    name,
    file: out,
    // Accent colour: the paint he used most. Two fruits can share a colour, so
    // the game rings each tier and sizes them apart as well.
    color: hex(cropped.colours[0].rgb),
    palette: cropped.colours.filter((c) => c.share > 0.02).map((c) => hex(c.rgb)),
    art: { w: cropped.w, h: cropped.h },
    drawing: file,
  });
  console.log(`  tier ${String(tier).padStart(2)}  ${out.padEnd(22)} ${cropped.w}x${cropped.h}  ${hex(cropped.colours[0].rgb)}`);
}

writeFileSync(
  join(artDir, 'fruits.json'),
  JSON.stringify({ note: 'Derived from kid/prints by tools/extract_art.mjs — do not hand-edit except names.', fruits }, null, 2) + '\n'
);

console.log(`\n  ${fruits.length} fruits  (${skippedBlank} blank, ${skippedDup} duplicate skipped)`);
console.log(`  wrote art/fruits.json`);
