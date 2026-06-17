// =============================================================================
// THEMES — Visual appearance definitions
// =============================================================================

export const THEMES = {
  grassland: {
    name: 'Grassland',
    sky: '#5c94fc',
    tiles: {
      G: { color: '#8B4513', topColor: '#228B22', label: '' },    // ground
      B: { color: '#C4722B', topColor: '#D4893B', label: '' },    // brick
      '?': { color: '#FFD700', topColor: '#FFC800', label: '?' }, // question block
      P: { color: '#228B22', topColor: '#32CD32', label: '' },    // pipe (top)
      p: { color: '#228B22', topColor: '#228B22', label: '' },    // pipe (body)
      S: { color: '#888888', topColor: '#999999', label: '' },    // stone
      I: { color: '#888888', topColor: '#AAAAAA', label: '' },    // invisible/one-way
      D: { color: '#AA8855', topColor: '#BBAA77', label: '' },    // pushable block
    },
    player: {
      bodyColor: '#FF0000',
      headColor: '#FFB366',
      overallsColor: '#0000CC',
    },
    enemies: {
      goomba: { bodyColor: '#A0522D', headColor: '#8B4513' },
      koopa: { bodyColor: '#228B22', shellColor: '#006400' },
      flyguy: { bodyColor: '#CC4444', wingColor: '#FFFFFF' },
      spiker: { bodyColor: '#666666', spikeColor: '#CCCCCC' },
    },
    coin: { color: '#FFD700', sparkle: '#FFF8DC' },
    background: {
      hillColor: '#3CB371',
      cloudColor: '#FFFFFF',
      bushColor: '#2E8B57',
    },
  },

  underground: {
    name: 'Underground',
    sky: '#000000',
    tiles: {
      G: { color: '#444444', topColor: '#555555', label: '' },
      B: { color: '#666699', topColor: '#7777AA', label: '' },
      '?': { color: '#FFD700', topColor: '#FFC800', label: '?' },
      P: { color: '#228B22', topColor: '#32CD32', label: '' },
      p: { color: '#228B22', topColor: '#228B22', label: '' },
      S: { color: '#555555', topColor: '#666666', label: '' },
      I: { color: '#333333', topColor: '#444444', label: '' },
      D: { color: '#7A6644', topColor: '#8A7755', label: '' },
    },
    player: {
      bodyColor: '#FF0000',
      headColor: '#FFB366',
      overallsColor: '#0000CC',
    },
    enemies: {
      goomba: { bodyColor: '#6B3A2A', headColor: '#5B2A1A' },
      koopa: { bodyColor: '#225522', shellColor: '#004400' },
      flyguy: { bodyColor: '#993333', wingColor: '#CCCCCC' },
      spiker: { bodyColor: '#555555', spikeColor: '#999999' },
    },
    coin: { color: '#FFD700', sparkle: '#FFF8DC' },
    background: {
      hillColor: null,
      cloudColor: null,
      bushColor: null,
    },
  },

  castle: {
    name: 'Castle',
    sky: '#1a1a2e',
    tiles: {
      G: { color: '#555555', topColor: '#666666', label: '' },
      B: { color: '#777777', topColor: '#888888', label: '' },
      '?': { color: '#CC9900', topColor: '#BB8800', label: '?' },
      P: { color: '#444444', topColor: '#555555', label: '' },
      p: { color: '#444444', topColor: '#444444', label: '' },
      S: { color: '#666666', topColor: '#777777', label: '' },
      I: { color: '#333333', topColor: '#444444', label: '' },
      D: { color: '#887766', topColor: '#998877', label: '' },
    },
    player: {
      bodyColor: '#FF0000',
      headColor: '#FFB366',
      overallsColor: '#0000CC',
    },
    enemies: {
      goomba: { bodyColor: '#8B4513', headColor: '#704214' },
      koopa: { bodyColor: '#2F4F2F', shellColor: '#1A3A1A' },
      flyguy: { bodyColor: '#AA3333', wingColor: '#DDDDDD' },
      spiker: { bodyColor: '#777777', spikeColor: '#BBBBBB' },
    },
    coin: { color: '#FFD700', sparkle: '#FFF8DC' },
    background: {
      hillColor: null,
      cloudColor: null,
      bushColor: null,
    },
  },
};
