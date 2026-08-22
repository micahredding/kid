// Turn Asher's saved drawings into game sprites.
//
// source/ holds his drawings, one per rung, named <value>-<the original save>.
// The value comes from the filename, not from the order he drew them: he made
// Eight before Four and Thirty-Two after Two Thousand Forty-Eight, so the
// ladder is the arithmetic, not the session.
//
// This tool crops each drawing to its content, drops the near-white pixels to
// transparent, throws away stray single-cell specks, and writes
// art/NNNN-<value>.png plus art/blocks.json (the ladder itself).
//
// source/ is the permanent record; art/ is derived and rebuildable:
//     node tools/extract_art.mjs
//
// Zero is the exception and stays one: his Zero is a blank page. There is
// nothing to crop, so it gets a manifest row with no sprite and the game draws
// it as an empty ball.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gameDir = join(__dirname, '..');
const sourceDir = join(gameDir, 'source');
const artDir = join(gameDir, 'art');

// A pixel this pale is paper, not paint.
const WHITE = 245;

// A blob of paint smaller than this share of the biggest blob is a slip of the
// finger, not part of the picture. Two of his drawings carry one stray cell out
// at the right-hand edge, which would otherwise triple the crop width.
const SPECK = 0.02;

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

// Every painted blob, 4-connected. Returned biggest first.
function blobs(mask, width, height) {
  const label = new Int32Array(width * height).fill(-1);
  const out = [];
  const stack = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start] >= 0) continue;
    const id = out.length;
    const box = { minX: width, maxX: -1, minY: height, maxY: -1, area: 0 };
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const i = stack.pop();
      const x = i % width, y = (i - x) / width;
      box.area++;
      if (x < box.minX) box.minX = x;
      if (x > box.maxX) box.maxX = x;
      if (y < box.minY) box.minY = y;
      if (y > box.maxY) box.maxY = y;
      const neighbours = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1,
                          y > 0 ? i - width : -1, y < height - 1 ? i + width : -1];
      for (const n of neighbours) {
        if (n >= 0 && mask[n] && label[n] < 0) { label[n] = id; stack.push(n); }
      }
    }
    out.push(box);
  }
  out.sort((a, b) => b.area - a.area);
  return out;
}

function cropToContent(img) {
  const { width, height, bpp, px } = img;
  const paper = (o) =>
    (bpp === 4 && px[o + 3] < 8) ||
    (px[o] >= WHITE && px[o + 1] >= WHITE && px[o + 2] >= WHITE);

  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) if (!paper(i * bpp)) mask[i] = 1;

  const found = blobs(mask, width, height);
  if (!found.length) return null;   // nothing drawn

  // Keep the picture; drop the specks. A blob that survives is included whole.
  const keep = found.filter((b) => b.area >= found[0].area * SPECK);
  const dropped = found.length - keep.length;
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (const b of keep) {
    minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
  }

  const w = maxX - minX + 1, h = maxY - minY + 1;
  const out = Buffer.alloc(w * h * 4);
  const tally = new Map();
  let painted = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (minY + y) * width + minX + x;
      const src = si * bpp;
      const dst = (y * w + x) * 4;
      if (!mask[si]) continue; // stays transparent
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
  return { w, h, rgba: out, colours, painted, dropped };
}

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

// ---- the ladder -----------------------------------------------------------

// What to call each rung out loud. Numbers he can read on the ball; words for
// the banner, because reading is the newer skill.
const WORDS = {
  0: 'zero', 1: 'one', 2: 'two', 4: 'four', 8: 'eight', 16: 'sixteen',
  32: 'thirty-two', 64: 'sixty-four', 128: 'one hundred twenty-eight',
  256: 'two hundred fifty-six', 512: 'five hundred twelve',
  1024: 'one thousand twenty-four', 2048: 'two thousand forty-eight',
};

const files = readdirSync(sourceDir)
  .filter((f) => /^\d{4}-.*\.png$/.test(f))
  .sort((a, b) => Number(a.slice(0, 4)) - Number(b.slice(0, 4)));

// art/ is derived, so clear it rather than letting renamed rungs pile up.
mkdirSync(artDir, { recursive: true });
for (const stale of readdirSync(artDir)) {
  if (stale.endsWith('.png')) rmSync(join(artDir, stale));
}

const seen = new Map();
const blocks = [];

for (const file of files) {
  const value = Number(file.slice(0, 4));
  const tier = blocks.length;
  const cropped = cropToContent(decodePng(join(sourceDir, file)));

  if (!cropped) {
    // Zero. A blank page is the right picture for it, so it keeps its row and
    // gets no sprite; the renderer draws an empty ball.
    blocks.push({
      tier, value, word: WORDS[value], file: null, blank: true,
      color: '#ffffff', palette: ['#ffffff'], art: null, drawing: file,
    });
    console.log(`  tier ${String(tier).padStart(2)}  ${String(value).padStart(4)}  blank page — no sprite`);
    continue;
  }

  // Two saves of the same picture must not become two rungs.
  const fingerprint = createHash('sha1').update(cropped.rgba).digest('hex');
  if (seen.has(fingerprint)) {
    throw new Error(`${file} is the same picture as ${seen.get(fingerprint)} — one drawing per rung`);
  }
  seen.set(fingerprint, file);

  const out = `${String(value).padStart(4, '0')}-${value}.png`;
  writeFileSync(join(artDir, out), encodePngRgba(cropped.w, cropped.h, cropped.rgba));

  blocks.push({
    tier,
    value,
    word: WORDS[value] ?? String(value),
    file: out,
    blank: false,
    // Accent colour: the paint he used most, which for the multi-digit numbers
    // is whichever digit he drew biggest.
    color: hex(cropped.colours[0].rgb),
    palette: cropped.colours.filter((c) => c.share > 0.02).map((c) => hex(c.rgb)),
    art: { w: cropped.w, h: cropped.h },
    drawing: file,
  });
  const speck = cropped.dropped ? `  (${cropped.dropped} speck dropped)` : '';
  console.log(`  tier ${String(tier).padStart(2)}  ${String(value).padStart(4)}  ${out.padEnd(12)} ${String(cropped.w).padStart(3)}x${String(cropped.h).padStart(3)}  ${blocks.at(-1).palette.join(' ')}${speck}`);
}

writeFileSync(
  join(artDir, 'blocks.json'),
  JSON.stringify({ note: 'Derived from source/ by tools/extract_art.mjs — rebuildable, not the record.', blocks }, null, 2) + '\n'
);

console.log(`\n  ${blocks.length} rungs, 0 through ${blocks.at(-1).value}`);
console.log(`  wrote art/blocks.json`);
