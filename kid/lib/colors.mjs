export const COLORS = {
  red:     { name: 'red',     rgb: [255, 0, 0] },
  blue:    { name: 'blue',    rgb: [0, 0, 255] },
  yellow:  { name: 'yellow',  rgb: [255, 255, 0] },
  green:   { name: 'green',   rgb: [0, 160, 0] },
  orange:  { name: 'orange',  rgb: [255, 165, 0] },
  purple:  { name: 'purple',  rgb: [128, 0, 128] },
  pink:    { name: 'pink',    rgb: [255, 192, 203] },
  brown:   { name: 'brown',   rgb: [139, 69, 19] },
  black:   { name: 'black',   rgb: [0, 0, 0] },
  white:   { name: 'white',   rgb: [255, 255, 255] },
  gray:    { name: 'gray',    rgb: [128, 128, 128] },
  grey:    { name: 'grey',    rgb: [128, 128, 128] },
  cyan:    { name: 'cyan',    rgb: [0, 255, 255] },
  magenta: { name: 'magenta', rgb: [255, 0, 255] },
};

// Hardcoded paint-mixing results for intuitive kid-friendly combos
const MIX_TABLE = {
  'red+blue': 'purple',
  'blue+red': 'purple',
  'red+yellow': 'orange',
  'yellow+red': 'orange',
  'blue+yellow': 'green',
  'yellow+blue': 'green',
  'red+white': 'pink',
  'white+red': 'pink',
  'red+green': 'brown',
  'green+red': 'brown',
  'black+white': 'gray',
  'white+black': 'gray',
  'blue+white': 'cyan',
  'white+blue': 'cyan',
  'red+blue+yellow': 'brown',
  'purple+yellow': 'brown',
  'yellow+purple': 'brown',
  'orange+blue': 'brown',
  'blue+orange': 'brown',
  'green+red': 'brown',
  'red+green': 'brown',
  'pink+blue': 'purple',
  'blue+pink': 'purple',
};

export function isColor(token) {
  return token.toLowerCase() in COLORS;
}

export function getColor(token) {
  return COLORS[token.toLowerCase()] || null;
}

function rgbToCmyk([r, g, b]) {
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const k = 1 - Math.max(r1, g1, b1);
  if (k >= 1) return [0, 0, 0, 1];
  return [
    (1 - r1 - k) / (1 - k),
    (1 - g1 - k) / (1 - k),
    (1 - b1 - k) / (1 - k),
    k
  ];
}

function cmykToRgb([c, m, y, k]) {
  return [
    Math.round(255 * (1 - c) * (1 - k)),
    Math.round(255 * (1 - m) * (1 - k)),
    Math.round(255 * (1 - y) * (1 - k)),
  ];
}

export function mixColors(color1, color2) {
  // Try hardcoded table first
  if (color1.name && color2.name) {
    const key = `${color1.name}+${color2.name}`;
    if (MIX_TABLE[key]) {
      return { ...COLORS[MIX_TABLE[key]] };
    }
  }

  // Fallback: CMYK average mixing
  const cmyk1 = rgbToCmyk(color1.rgb);
  const cmyk2 = rgbToCmyk(color2.rgb);
  const mixed = [
    (cmyk1[0] + cmyk2[0]) / 2,
    (cmyk1[1] + cmyk2[1]) / 2,
    (cmyk1[2] + cmyk2[2]) / 2,
    (cmyk1[3] + cmyk2[3]) / 2,
  ];
  const rgb = cmykToRgb(mixed);
  return { name: null, rgb };
}

// Convert RGB to nearest 256-color index (compatible with Terminal.app)
export function rgbTo256(r, g, b) {
  // Check grayscale ramp first (indices 232-255)
  if (r === g && g === b) {
    if (r < 8) return 16;   // black
    if (r > 248) return 231; // white
    return Math.round((r - 8) / 247 * 23) + 232;
  }
  // Map to 6x6x6 color cube (indices 16-231)
  const ri = Math.round(r / 255 * 5);
  const gi = Math.round(g / 255 * 5);
  const bi = Math.round(b / 255 * 5);
  return 16 + 36 * ri + 6 * gi + bi;
}

export function colorBlock(rgb) {
  const code = rgbTo256(rgb[0], rgb[1], rgb[2]);
  return `\x1b[48;5;${code}m  \x1b[0m`;
}

// Color cycle for drawing mode
export const COLOR_CYCLE = [
  COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green,
  COLORS.blue, COLORS.purple, COLORS.pink, COLORS.white,
  COLORS.cyan, COLORS.brown, COLORS.black, COLORS.gray,
];
