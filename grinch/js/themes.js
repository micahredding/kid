// =============================================================================
// THEMES — Visual appearance definitions for the four Grinch worlds
// (palette inspired by the 1966 Chuck Jones special: deep night blues,
//  candy-colored Whoville, Grinch green, Santa red)
// =============================================================================

export const THEMES = {
  // World 1 — sneaking DOWN Mount Crumpit at night
  crumpitNight: {
    name: 'Mount Crumpit',
    sky: '#10102e',
    skyGradient: ['#0a0a22', '#232350'],
    snowfall: true,
    santaSuit: true,
    tiles: {
      G: { color: '#3a3a55', topColor: '#e8f0ff', label: '', snowCap: true },  // snowy rock
      B: { color: '#4a4a68', topColor: '#e8f0ff', label: '', snowCap: true },  // rock ledge
      '?': { color: '#cc2936', topColor: '#e05563', label: '?', gift: true },  // gift box
      P: { color: '#6a5a78', topColor: '#e8f0ff', label: '', snowCap: true },  // crag top
      p: { color: '#5a4a68', topColor: '#5a4a68', label: '' },                 // crag body
      S: { color: '#7a9ac8', topColor: '#c8e0f8', label: '', snowCap: true },  // ice
      I: { color: '#8aa8d0', topColor: '#e8f0ff', label: '', snowCap: true },  // snow ledge (one-way)
      D: { color: '#9c6b34', topColor: '#e8f0ff', label: '', snowCap: true },  // crate
    },
    enemies: {
      goomba: { bodyColor: '#9a8f85', headColor: '#b8ada0', noseColor: '#e8a0a8' },   // mouse
      flyguy: { bodyColor: '#b8d8f0', wingColor: '#ffffff' },                          // snowbird
      spiker: { bodyColor: '#8ab0d8', spikeColor: '#d8ecff' },                         // ice lump
    },
    coin: { ribbon: '#ffd700', wraps: ['#cc2936', '#3a9a5a', '#4a6ad8', '#c85ac8'] },  // presents
    background: { mountains: true, stars: true, moon: true, houses: false },
  },

  // World 2 — Whoville by night: rooftops, chimneys, living rooms
  whoville: {
    name: 'Whoville',
    sky: '#1a1a40',
    skyGradient: ['#12122f', '#2d2d5e'],
    snowfall: true,
    santaSuit: true,
    tiles: {
      G: { color: '#4a4a68', topColor: '#e8f0ff', label: '', snowCap: true },  // snowy street
      B: { color: '#e58ab8', topColor: '#f0a8cc', label: '' },                 // who-house wall (pink)
      '?': { color: '#cc2936', topColor: '#e05563', label: '?', gift: true },
      P: { color: '#a04848', topColor: '#e8f0ff', label: '', snowCap: true },  // chimney top
      p: { color: '#8a3a3a', topColor: '#8a3a3a', label: '', brick: true },    // chimney/brick
      S: { color: '#5ab8b8', topColor: '#7ad0d0', label: '' },                 // who-house wall (teal)
      I: { color: '#7a5a9a', topColor: '#e8f0ff', label: '', snowCap: true },  // rooftop ledge (one-way)
      D: { color: '#9c6b34', topColor: '#bb8850', label: '' },                 // furniture crate
    },
    enemies: {
      goomba: { bodyColor: '#9a8f85', headColor: '#b8ada0', noseColor: '#e8a0a8' },
      flyguy: { bodyColor: '#e8a0b8', wingColor: '#ffffff' },                          // who-bird
      spiker: { bodyColor: '#8ab0d8', spikeColor: '#d8ecff' },
    },
    coin: { ribbon: '#ffd700', wraps: ['#cc2936', '#3a9a5a', '#4a6ad8', '#c85ac8'] },
    background: { mountains: false, stars: true, moon: true, houses: true },
  },

  // World 3 — hauling the sack UP Mount Crumpit before dawn
  crumpitClimb: {
    name: 'The Climb',
    sky: '#0c0c26',
    skyGradient: ['#08081c', '#1c1c44'],
    snowfall: true,
    santaSuit: true,
    tiles: {
      G: { color: '#32324c', topColor: '#dce8fc', label: '', snowCap: true },
      B: { color: '#42425e', topColor: '#dce8fc', label: '', snowCap: true },
      '?': { color: '#cc2936', topColor: '#e05563', label: '?', gift: true },
      P: { color: '#5a4a70', topColor: '#dce8fc', label: '', snowCap: true },
      p: { color: '#4c3c60', topColor: '#4c3c60', label: '' },
      S: { color: '#6a8ab8', topColor: '#b8d4f0', label: '', snowCap: true },
      I: { color: '#7a98c4', topColor: '#dce8fc', label: '', snowCap: true },
      D: { color: '#9c6b34', topColor: '#dce8fc', label: '', snowCap: true },
    },
    enemies: {
      goomba: { bodyColor: '#9a8f85', headColor: '#b8ada0', noseColor: '#e8a0a8' },
      flyguy: { bodyColor: '#b8d8f0', wingColor: '#ffffff' },
      spiker: { bodyColor: '#8ab0d8', spikeColor: '#d8ecff' },
    },
    coin: { ribbon: '#ffd700', wraps: ['#cc2936', '#3a9a5a', '#4a6ad8', '#c85ac8'] },
    background: { mountains: true, stars: true, moon: true, houses: false },
  },

  // World 4 — the heart grows three sizes: dawn, color returns
  dawn: {
    name: 'Christmas Morning',
    sky: '#ff9e7d',
    skyGradient: ['#5a3a8a', '#ff9e7d'],
    snowfall: true,
    snowSparse: true,
    santaSuit: true,
    tiles: {
      G: { color: '#7a6a8a', topColor: '#fff4f8', label: '', snowCap: true },  // morning-lit snow
      B: { color: '#e58ab8', topColor: '#f0a8cc', label: '' },
      '?': { color: '#cc2936', topColor: '#e05563', label: '?', gift: true },
      P: { color: '#a04848', topColor: '#fff4f8', label: '', snowCap: true },
      p: { color: '#8a3a3a', topColor: '#8a3a3a', label: '', brick: true },
      S: { color: '#5ab8b8', topColor: '#7ad0d0', label: '' },
      I: { color: '#c88ab0', topColor: '#fff4f8', label: '', snowCap: true },
      D: { color: '#9c6b34', topColor: '#bb8850', label: '' },
    },
    enemies: {
      goomba: { bodyColor: '#9a8f85', headColor: '#b8ada0', noseColor: '#e8a0a8' },
      flyguy: { bodyColor: '#e8a0b8', wingColor: '#ffffff' },
      spiker: { bodyColor: '#8ab0d8', spikeColor: '#d8ecff' },
    },
    coin: { ribbon: '#ffd700', wraps: ['#cc2936', '#3a9a5a', '#4a6ad8', '#c85ac8'] },
    background: { mountains: false, stars: false, moon: false, houses: true, housesLit: true },
  },
};

// Shared character palette (the Grinch looks the same in every world;
// themes flip santaSuit to dress him in the coat and hat)
export const GRINCH_COLORS = {
  fur: '#89c053',
  furShade: '#6da33e',
  furLight: '#a4d472',
  belly: '#b8dc8c',
  eye: '#f4e04d',
  pupil: '#c23616',
  suit: '#cc2936',
  suitShade: '#a01f2a',
  trim: '#f8f4ec',
};

export const MAX_COLORS = {
  fur: '#b98a5a',
  furShade: '#9a6f42',
  earInner: '#8a5f38',
  muzzle: '#d8b088',
  antler: '#8a6a3a',
  rope: '#a04040',
};
