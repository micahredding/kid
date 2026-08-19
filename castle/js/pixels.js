// =============================================================================
// PIXELS — palette, a 5x7 bitmap font, and hand-drawn sprites.
//
// Everything is authored as rows of characters so it can be read and corrected
// by eye. test_castle.mjs dumps every glyph and sprite back out as ASCII, which
// is how a ragged row or a wrong letter gets caught.
//
// The canvas is a real 320x200 buffer scaled up with pixelated rendering, so one
// unit here is one fat visible pixel — the Apple II look, with a wider palette.
// =============================================================================

export const PALETTE = {
  k: '#000000', d: '#2b1d14', n: '#7a4f2a', o: '#d98f3a', s: '#f2c49b',
  y: '#f5d23c', G: '#ffc21e', w: '#ffffff', l: '#c8d4e0', g: '#78859a',
  D: '#39424f', b: '#3a6ea5', B: '#1c3f6e', c: '#7fd3ff', e: '#4a9e3f',
  E: '#235f27', r: '#d43d2f', R: '#8f1f16', p: '#f2a0b5', m: '#8a4fbd',
  t: '#5b3a91',
};

// ---- 5x7 font ---------------------------------------------------------------
// Rows top to bottom, '#' on, '.' off. Uppercase only: this is a pre-reader's
// game and capitals are what he meets first on blocks and signs.
const F = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '#####/..#../..#../..#../..#../..#../#####',
  J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#...#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  1: '..#../.##../..#../..#../..#../..#../#####',
  2: '.###./#...#/....#/...#./..#../.#.../#####',
  3: '####./....#/....#/.###./....#/....#/####.',
  4: '...#./..##./.#.#./#..#./#####/...#./...#.',
  5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '..##./.#.../#..../####./#...#/#...#/.###.',
  7: '#####/....#/...#./..#../.#.../.#.../.#...',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
  9: '.###./#...#/#...#/.####/....#/...#./.##..',
  '.': '...../...../...../...../...../.##../.##..',
  ',': '...../...../...../...../.##../.##../.#...',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '-': '...../...../...../#####/...../...../.....',
  x: '...../...../#...#/.#.#./..#../.#.#./#...#',
  '=': '...../...../#####/...../#####/...../.....',
  '?': '.###./#...#/....#/..##./..#../...../..#..',
  '!': '..#../..#../..#../..#../..#../...../..#..',
  ':': '...../.##../.##../...../.##../.##../.....',
  '/': '....#/...#./...#./..#../.#.../.#.../#....',
  "'": '..#../..#../...../...../...../...../.....',
  ' ': '...../...../...../...../...../...../.....',
};

export const FONT = {};
for (const [ch, spec] of Object.entries(F)) FONT[ch] = spec.split('/');
export const GLYPH_W = 5, GLYPH_H = 7;

// ---- sprites ---------------------------------------------------------------
// All 16x16 unless noted, so placement maths stays boring.
const S = {
  // The player: a child in a red tunic, front-facing. Legs swap for walking,
  // which reads as movement at this size without needing side views.
  kid: [
    '....nnnn....',
    '...nnnnnn...',
    '...snnnns...',
    '...ssssss...',
    '...skssks...',
    '...ssssss...',
    '....ssss....',
    '...rrrrrr...',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '...rrrrrr...',
    '...bb..bb...',
    '...bb..bb...',
    '...dd..dd...',
    '...dd..dd...',
  ],
  kidWalk: [
    '....nnnn....',
    '...nnnnnn...',
    '...snnnns...',
    '...ssssss...',
    '...skssks...',
    '...ssssss...',
    '....ssss....',
    '...rrrrrr...',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '..rrrrrrrr..',
    '...rrrrrr...',
    '...bb..bb...',
    '..bb....bb..',
    '..dd....dd..',
    '..dd....dd..',
  ],
  // A white bear needs a grey outline or it is invisible against snow.
  bear: [
    '................',
    '..gg........gg..',
    '.gwwg......gwwg.',
    '.gwwggggggggwwg.',
    'gwwwwwwwwwwwwwwg',
    'gwwkwwwwwwwwkwwg',
    'gwwwwwwwwwwwwwwg',
    'gwwwwwwkkwwwwwwg',
    '.gwwwwwkkwwwwwg.',
    '..gwwwwwwwwwwg..',
    '.gwwwwwwwwwwwwg.',
    'gwwwwwwwwwwwwwwg',
    'gwwwwwwwwwwwwwwg',
    'gwwg........gwwg',
    'gwwg........gwwg',
    '.gg..........gg.',
  ],
  lion: [
    '................',
    '....GGGGGGGG....',
    '..GGGGGGGGGGGG..',
    '.GGGGooooooGGGG.',
    '.GGGGooooooGGGG.',
    '.GGGGokookoGGGG.',
    '.GGGGooooooGGGG.',
    '.GGGGookkooGGGG.',
    '..GGGooooooGGG..',
    '....oooooooo....',
    '...oooooooooo...',
    '..oooooooooooo..',
    '..oooooooooooo..',
    '..oo..oooo..oo..',
    '..oo..oooo..oo..',
    '..dd..dddd..dd..',
  ],
  rocket: [
    '.......w........',
    '......www.......',
    '.....wwwww......',
    '.....wrrrw......',
    '.....wrrrw......',
    '.....wwwww......',
    '.....wwwww......',
    '....wwwwwww.....',
    '...ww.www.ww....',
    '..rww.www.wwr...',
    '..rw..www..wr...',
    '..r...www...r...',
    '......ooo.......',
    '.....oyyyo......',
    '......oyo.......',
    '.......o........',
  ],
  train: [
    '................',
    '....bbbbbb......',
    '...bbbbbbbb.....',
    '...bbcccbbb.....',
    '...bbbbbbbb.....',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbcccbbcccbb..',
    '..bbcccbbcccbb..',
    '..bbbbbbbbbbbb..',
    '..rrrrrrrrrrrr..',
    '..DDDDDDDDDDDD..',
    '..DkkDDkkDDkkD..',
    '..DkkDDkkDDkkD..',
    '...DD..DD..DD...',
    '................',
  ],
  apple: [
    '................',
    '.......e........',
    '......ee........',
    '.....eee........',
    '....rrrrrr......',
    '...rrrrrrrr.....',
    '..rrrrrrrrrr....',
    '..rrRrrrrrrr....',
    '..rrRrrrrrrr....',
    '..rrrrrrrrrr....',
    '..rrrrrrrrrr....',
    '...rrrrrrrr.....',
    '....rrrrrr......',
    '.....rrrr.......',
    '................',
    '................',
  ],
  key: [
    '................',
    '....GGGGG.......',
    '...GG...GG......',
    '...GG...GG......',
    '...GG...GG......',
    '....GGGGG.......',
    '.....GGG........',
    '.....GGG........',
    '.....GGGG.......',
    '.....GGG........',
    '.....GGGG.......',
    '.....GGG........',
    '.....GGGG.......',
    '.....GGG........',
    '................',
    '................',
  ],
  // Tail on the left, eye and mouth on the right, so it reads as facing forward.
  fish: [
    '................',
    '................',
    '.......ooo......',
    '.....ooooooo....',
    'o...ooooooooo...',
    'oo.oooooooooooo.',
    'ooooooooooookoo.',
    'ooooooooooooooo.',
    'oo.oooooooooooo.',
    'o...ooooooooo...',
    '.....ooooooo....',
    '.......ooo......',
    '................',
    '................',
    '................',
    '................',
  ],
  dove: [
    '................',
    '.........wwww...',
    '........wwwwww..',
    '.......wwwwkww..',
    '......wwwwwwwwo.',
    '...wwwwwwwwwww..',
    '..wwwwlllwwwww..',
    '..wwwlllllwww...',
    '..wwwwlllww.....',
    '...wwwwwww......',
    '....wwwww.......',
    '.....www........',
    '................',
    '................',
    '................',
    '................',
  ],
  flower: [
    '................',
    '......ppp.......',
    '.....ppppp......',
    '....ppyyypp.....',
    '....ppyyypp.....',
    '.....ppppp......',
    '......ppp.......',
    '.......e........',
    '.......e........',
    '.....eeee.......',
    '.......e........',
    '.......e.eee....',
    '.......e........',
    '.......e........',
    '................',
    '................',
  ],
  moon: [
    '................',
    '......yyyy......',
    '....yyyyyyy.....',
    '...yyyyy..yy....',
    '..yyyy.....yy...',
    '..yyy.......y...',
    '.yyy............',
    '.yyy............',
    '.yyy............',
    '.yyy............',
    '..yyy.......y...',
    '..yyyy.....yy...',
    '...yyyyy..yy....',
    '....yyyyyyy.....',
    '......yyyy......',
    '................',
  ],
  boat: [
    '................',
    '.......w........',
    '.......ww.......',
    '.......www......',
    '.......wwww.....',
    '.......wwwww....',
    '.......w........',
    '.......w........',
    '..rrrrrrrrrrr...',
    '..rrrrrrrrrrr...',
    '...RRRRRRRRR....',
    '....RRRRRRR.....',
    '................',
    '................',
    '................',
    '................',
  ],
  cake: [
    '................',
    '.......r........',
    '.......y........',
    '................',
    '...wwwwwwww.....',
    '..wwwwwwwwww....',
    '..wpwpwpwpww....',
    '..wwwwwwwwww....',
    '..wwwwwwwwww....',
    '..wpwpwpwpww....',
    '..wwwwwwwwww....',
    '..nnnnnnnnnn....',
    '..nnnnnnnnnn....',
    '................',
    '................',
    '................',
  ],
};

export const SPRITES = S;

// ---- painter ---------------------------------------------------------------

export class Painter {
  constructor(ctx) { this.ctx = ctx; }

  clear(color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, 320, 200);
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Two-colour checkerboard fill — the cheap 80s way to get a third shade.
  // The second colour goes down semi-transparent: at full strength the grid
  // reads as a transparency checkerboard rather than as texture.
  dither(x, y, w, h, a, b, size = 1, strength = 0.34) {
    this.rect(x, y, w, h, a);
    const prev = this.ctx.globalAlpha;
    this.ctx.globalAlpha = strength;
    this.ctx.fillStyle = b;
    for (let j = 0; j < h; j += size) {
      for (let i = ((j / size) % 2) * size; i < w; i += size * 2) {
        this.ctx.fillRect(Math.round(x + i), Math.round(y + j), size, size);
      }
    }
    this.ctx.globalAlpha = prev;
  }

  // Draw sprite rows. scale fattens the pixels; flip mirrors horizontally.
  sprite(rows, x, y, { scale = 1, flip = false, tint = null, alpha = 1 } = {}) {
    const ctx = this.ctx;
    const prev = ctx.globalAlpha;
    if (alpha !== 1) ctx.globalAlpha = alpha;
    const w = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const ch = rows[r][c];
        if (ch === '.') continue;
        const color = tint || PALETTE[ch];
        if (!color) continue;
        const cx = flip ? w - 1 - c : c;
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x + cx * scale), Math.round(y + r * scale), scale, scale);
      }
    }
    ctx.globalAlpha = prev;
  }

  textWidth(str, scale = 1, tracking = 1) {
    return str.length * (GLYPH_W + tracking) * scale - tracking * scale;
  }

  text(str, x, y, { scale = 1, color = '#ffffff', tracking = 1, shadow = null } = {}) {
    const s = String(str).toUpperCase();
    let cx = x;
    for (const ch of s) {
      const glyph = FONT[ch] || FONT['?'];
      if (shadow) this.glyph(glyph, cx + scale, y + scale, scale, shadow);
      this.glyph(glyph, cx, y, scale, color);
      cx += (GLYPH_W + tracking) * scale;
    }
    return cx - tracking * scale - x;
  }

  glyph(rows, x, y, scale, color) {
    this.ctx.fillStyle = color;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (rows[r][c] !== '#') continue;
        this.ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), scale, scale);
      }
    }
  }

  // A word on a plaque, the way a label sits under a museum exhibit.
  label(str, cx, y, { scale = 1, color = '#ffffff', bg = 'rgba(0,0,0,0.65)', border = null } = {}) {
    const w = this.textWidth(str, scale);
    const x = Math.round(cx - w / 2);
    this.rect(x - 3 * scale, y - 2 * scale, w + 6 * scale, GLYPH_H * scale + 4 * scale, bg);
    if (border) {
      this.strokeRect(x - 3 * scale, y - 2 * scale, w + 6 * scale, GLYPH_H * scale + 4 * scale, border);
    }
    this.text(str, x, y, { scale, color });
    return { x: x - 3 * scale, y: y - 2 * scale, w: w + 6 * scale, h: GLYPH_H * scale + 4 * scale };
  }

  strokeRect(x, y, w, h, color, thickness = 1) {
    this.rect(x, y, w, thickness, color);
    this.rect(x, y + h - thickness, w, thickness, color);
    this.rect(x, y, thickness, h, color);
    this.rect(x + w - thickness, y, thickness, h, color);
  }
}
