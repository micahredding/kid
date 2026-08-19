// Dump every glyph and sprite back out as ASCII so the art can be checked by
// eye. Ragged rows and wrong letter shapes are invisible in source and obvious
// here. Run: node castle/tools/show_art.mjs [font|sprites]
import { FONT, SPRITES, PALETTE, GLYPH_W, GLYPH_H } from '../js/pixels.js';

const what = process.argv[2] || 'all';
let problems = 0;

function checkGrid(name, rows, expectW) {
  const widths = new Set(rows.map((r) => r.length));
  if (widths.size !== 1) {
    console.log(`  !! ${name}: ragged rows ${[...widths].join(',')}`);
    problems++;
  } else if (expectW && rows[0].length !== expectW) {
    console.log(`  !! ${name}: width ${rows[0].length}, expected ${expectW}`);
    problems++;
  }
}

if (what === 'font' || what === 'all') {
  console.log('=== FONT (5x7) ===');
  const keys = Object.keys(FONT);
  for (const ch of keys) checkGrid(`glyph ${ch}`, FONT[ch], GLYPH_W);
  // Print in rows of 13 glyphs side by side.
  for (let i = 0; i < keys.length; i += 13) {
    const group = keys.slice(i, i + 13);
    console.log(group.map((c) => ` ${c}   `).join(''));
    for (let r = 0; r < GLYPH_H; r++) {
      console.log(group.map((c) => (FONT[c][r] || '.....').replace(/#/g, '█').replace(/\./g, ' ')).join(' '));
    }
    console.log('');
  }
}

if (what === 'sprites' || what === 'all') {
  console.log('=== SPRITES ===');
  for (const [name, rows] of Object.entries(SPRITES)) {
    checkGrid(name, rows);
    const unknown = new Set();
    for (const row of rows) for (const ch of row) if (ch !== '.' && !PALETTE[ch]) unknown.add(ch);
    if (unknown.size) { console.log(`  !! ${name}: no palette entry for ${[...unknown].join(',')}`); problems++; }
    console.log(`\n--- ${name} (${rows[0].length}x${rows.length}) ---`);
    for (const row of rows) console.log(row.replace(/\./g, ' ').replace(/(.)/g, '$1$1'));
  }
}

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nart OK: no ragged rows, no unknown colours');
process.exit(problems ? 1 : 0);
