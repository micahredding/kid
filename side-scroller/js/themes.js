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

  jungle: {
    name: 'Jungle',
    sky: '#79b85e',
    tiles: {
      G: { color: '#6b4a2b', topColor: '#46c33c', label: '' },   // earth + bright grass
      B: { color: '#9c6b34', topColor: '#b47f42', label: '' },   // wood
      '?': { color: '#FFD700', topColor: '#FFC800', label: '?' },
      P: { color: '#3aa655', topColor: '#7fe08a', label: '' },   // bamboo top
      p: { color: '#3aa655', topColor: '#3aa655', label: '' },   // bamboo trunk
      S: { color: '#7d8f72', topColor: '#a3b892', label: '' },   // mossy stone
      I: { color: '#7a5230', topColor: '#4ccb52', label: '' },   // leafy branch
      D: { color: '#b08350', topColor: '#c9a06b', label: '' },   // crate
    },
    player: {
      bodyColor: '#FF0000',
      headColor: '#FFB366',
      overallsColor: '#0000CC',
    },
    enemies: {
      goomba: { bodyColor: '#8b5a2b', headColor: '#6f4420' },
      koopa: { bodyColor: '#228B22', shellColor: '#006400' },
      flyguy: { bodyColor: '#e07b39', wingColor: '#FFFFFF' },
      spiker: { bodyColor: '#4f6b4f', spikeColor: '#c9d6c0' },
    },
    coin: { color: '#FFD700', sparkle: '#FFF8DC' },
    background: {
      hillColor: '#2f6b39',
      cloudColor: '#eaf7dc',
      bushColor: '#255c2e',
    },
  },

  numberland: {
    name: 'Numberland',
    sky: '#8fb8e8',
    tiles: {
      G: { color: '#8a6a3d', topColor: '#59c94f', label: '' },
      B: { color: '#c98a4b', topColor: '#daa05f', label: '' },
      '?': { color: '#FFD700', topColor: '#FFC800', label: '?' },
      P: { color: '#4aa8a0', topColor: '#7fd0c8', label: '' },
      p: { color: '#4aa8a0', topColor: '#4aa8a0', label: '' },
      S: { color: '#8a93a8', topColor: '#a8b0c2', label: '' },
      I: { color: '#9a8fb8', topColor: '#cfc8e8', label: '' },
      D: { color: '#b08350', topColor: '#c9a06b', label: '' },
      // Numberblock tiles — solid, colored by number
      '1': { color: '#e03c3c', topColor: '#f06060', label: '' },
      '2': { color: '#f08c28', topColor: '#ffb050', label: '' },
      '3': { color: '#f5d327', topColor: '#ffe866', label: '' },
      '4': { color: '#3fa93f', topColor: '#66cc66', label: '' },
      '5': { color: '#3f6fd8', topColor: '#6f9fff', label: '' },
      '6': { color: '#5a3fb8', topColor: '#8468d8', label: '' },
      '7': { color: '#8f4fd8', topColor: '#b07fe8', label: '' },
      '8': { color: '#e858a8', topColor: '#ff88c8', label: '' },
      '9': { color: '#8a8a92', topColor: '#aaaab2', label: '' },
      '0': { color: '#f2f2f2', topColor: '#e04848', label: '' },
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

  crystalcave: {
    name: 'Crystal Cave',
    sky: '#0a0a14',
    tiles: {
      G: { color: '#4a3a30', topColor: '#6a8a5a', label: '' },   // cave dirt + moss
      B: { color: '#5a4a7a', topColor: '#7a6a9a', label: '' },
      '?': { color: '#FFD700', topColor: '#FFC800', label: '?' },
      P: { color: '#5a7ab8', topColor: '#8fb8e8', label: '' },   // crystal pillar
      p: { color: '#5a7ab8', topColor: '#5a7ab8', label: '' },
      S: { color: '#3a4a6a', topColor: '#4a5c80', label: '' },   // deep blue stone
      I: { color: '#7a9ac8', topColor: '#b8d4f0', label: '' },   // crystal ledge
      D: { color: '#7a6644', topColor: '#8a7755', label: '' },
      '1': { color: '#e03c3c', topColor: '#f06060', label: '' },
      '2': { color: '#f08c28', topColor: '#ffb050', label: '' },
      '3': { color: '#f5d327', topColor: '#ffe866', label: '' },
      '4': { color: '#3fa93f', topColor: '#66cc66', label: '' },
      '5': { color: '#3f6fd8', topColor: '#6f9fff', label: '' },
      '6': { color: '#5a3fb8', topColor: '#8468d8', label: '' },
      '7': { color: '#8f4fd8', topColor: '#b07fe8', label: '' },
      '8': { color: '#e858a8', topColor: '#ff88c8', label: '' },
      '9': { color: '#8a8a92', topColor: '#aaaab2', label: '' },
      '0': { color: '#f2f2f2', topColor: '#e04848', label: '' },
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
      spiker: { bodyColor: '#555555', spikeColor: '#99aacc' },
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
