// =============================================================================
// LEVEL — Level loading, tile rendering, background rendering
// =============================================================================

import { CONFIG } from './config.js';
import { THEMES } from './themes.js';
import { Goomba, Coin, MovingPlatform, Flyguy, Spiker, PushBlock, Food, Key, Gem, Door } from './entities.js';

// =============================================================================
// LEVEL DEFINITIONS
// =============================================================================
export const LEVELS = [
  {
    name: 'World 1-1',
    theme: 'grassland',
    playerStart: { col: 3, row: 14 },
    // Legend:
    // G = ground, B = brick, ? = question block, S = stone
    // I = one-way platform, P = pipe top, p = pipe body
    // C = coin, E = goomba, F = flyguy, X = spiker, D = pushable block
    // A = food(apple), H = food(cherry), N = food(banana)
    // Y = key(gold), y = key(silver), J = gem(blue), j = gem(red)
    // L = door(gold), l = door(silver)
    //   (space) = empty
    tiles: [
      '                                                                                                                                                                                                                                        ',
      '                                                                                                                                                                                                                                        ',
      '                                                                                                                                                                           C                                                            ',
      '                                                                                           C                                                                  C                           J                                             ',
      '                                                                                           C                                                                       CCCC   III                  F                                        ',
      '                                                                                          B B                                                     C  C C A   III                         BBBB         C                                 ',
      '                                                                                          B B                                                                      BBBB                         III                                     ',
      '                                                                                          B B                                                 C   BBGGGGGG                                           III                                ',
      '                                                                       C                  B B                                                   BBBBGGGGGG                                                                              ',
      '                                C  C  C                         F      C                  B B                                             C   BBBBBBGGGGGG                                                                              ',
      '               ?    B?B?B                        BBBB                  C                  B B                                               BBBBBBBBGGGGGG                                                                              ',
      '                                                                                          B B                                         C   BBBBBBBBBBGGGGGG                                                            C                 ',
      '    C          A   H   N               E       I I I I         C  C  C       D D          B B          J                                BBBBBBBBBBBBGGGGGG  C                                                        C C                ',
      '         E                                                   B?B?B?B     Y     E    X     B B     E                                   BBBBBBBBBBBBBBGGGGGG            C       C       C       C     C   C           C   C  A   E        ',
      '                         PP                PP                                             B B         L                             BBBBBBBBBBBBBBBBGGGGGG                                                                              ',
      '  GGGGGGGGGGGGGGGG  GGGGppGGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG        GGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGppGGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  C   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG    GGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG    GGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                         C C        j             GGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  C                                               GGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG         C C C  H   E   B?B?B   D       N  E C CGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                                                GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      '  GGGGGGGGGGGGGGGG  GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    // Moving platforms defined separately
    movingPlatforms: [
      { col: 57, row: 12, widthTiles: 3, rangeX: 0, rangeY: 64, speed: 1 },
      { col: 178, row: 6, widthTiles: 3, rangeX: 112, rangeY: 0, speed: 1.2 },
    ],
    // Goal/flag position
    goalCol: 226,
    goalRow: 15,        // ground row the flag stands on
    undergroundRow: 17, // rows at/below this get the dark cave backdrop
  },
  {
    name: 'World 1-2 Underground',
    theme: 'underground',
    playerStart: { col: 2, row: 14 },
    tiles: [
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'S                                                                                                                                                         C                                                                            S',
      'S                                                                                                                                            C                           J                                                             S',
      'S                                                                                                                                                 CCCC   III                  F              C C                                       S',
      'S                                                                                                                                C  C C H   III                         SSSS                                                           S',
      'S                                                                                                                                                 SSSS                          III         SSSS    C                                  S',
      'S                                                                                                                            C   SSSSSSSS                                             III                                              S',
      'S                       C  C  C             C  C                    F                                                          SSSSSSSSSS                                                          III                                 S',
      'S                      BBBBBBBB           ?B?B?              BBB                                                         C   SSSSSSSSSSSS                                                                                              S',
      'S                                                                                                                          SSSSSSSSSSSSSS                                                                                              S',
      'S          ?            H   A   N    E     F        E        I I I       C  C  C  C        j                         C   SSSSSSSSSSSSSSSS  C          C       C       C       C       C       C                       C                S',
      'S     E          BB                                                   BBBBBBBBBB        X                              SSSSSSSSSSSSSSSSSS                                                                            C C               S',
      'S                            D D            BB         BB                                                 C C C A    SSSSSSSSSSSSSSSSSSSS    C SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS          C   C  A  E        S',
      'S              PP                PP                PP             D D                                              SSSSSSSSSSSSSSSSSSSSSS      SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS                             S',
      'SGGGGGGGGGG  GGppGGGGGGGG  GGGGGGppGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSS  C                                                                      GGGGGGGGGGGGGGGGGGGGGS',
      'SGGGGGGGGGG  GGppGGGGGGGG  GGGGGGppGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSS                                                                       GGGGGGGGGGGGGGGGGGGGGGGS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS    C                                                                SSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS                                                                     SSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS  C                     C C                                        SSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS                                                 j                 SSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS    C               E  B?B?B                           E         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS         C C C   H             D   X   N   C C             C C   SSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
    ],
    movingPlatforms: [
      { col: 161, row: 5, widthTiles: 3, rangeX: 112, rangeY: 0, speed: 1.2 },
    ],
    goalCol: 226,
    goalRow: 14,
  },
  {
    name: 'World 1-3 Castle',
    theme: 'castle',
    playerStart: { col: 3, row: 15 },
    tiles: [
      '                                                                                                                                                                        S  S                                                           S',
      '                                               S S                            F                                                                                         SSSS      SS                                                   S',
      '                                               SSS            C       C               J       C           C                                                             SSSS      SS      C                            F  C C          S',
      '                                               SSS        S       S       S       S       S       S               S                                                     SSSS      SS                 C    C    C    C                  S',
      '                                               SSS   SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS   SSSSSSSSSSSSSS                                                SSSS      SS     III       S    S    S    S                    S',
      '                                               SSS   SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS   SSSSSSSSSSSSSS                                                SSSS      SS  C      SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                                               SSS               C           C           C           IIII                                                               SSSS      SS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                                               SSS                                                         C                                                            SSSS      SS III     SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                                               SSS              BBB         BBB         BBB                                                                             SSSS      SS      C  SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                                               SSS                                          F            IIII                                                           SSSS      SS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                                               SSS                                                     C                                                                SSSS      SS     III SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                           y                   SSS                                                                                          CC              Y           SSSS      SS  C      SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '      C C C   A   H   N                     C  SSS C     C                             C          C   IIII                          C               H   C               SSSS      SS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                        E  S                                SS      E   SS    B?B?B E         SS                                        E   PP              S                 C      III     SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '                           S    II   II         l           SS          SS                    SS                                            pp              S            L                C  SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG          GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGG           SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG          GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      GGGGGGGGGGGGGGSS     III SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG    C     SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS   SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS    SSSSSSSSSSSSSSSSSS  C      SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG          SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS C SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS    SSSSSSSSSSSSSSSSSS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                                                                      C                                                          SSSSSSSSSSSSSSSSSSSS III     SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  C                                                                                                                j   Y         SSSSSSSSSSSSSSSSSSSS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG      C     C C   X C      C   C     D     N               E     C   B?B       X         C    C        E       C               SSSSSSSSSSSSSSSSSSSSSS         SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                                                                                                                               SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
    ],
    movingPlatforms: [
      // moat elevator: rides between the bridge (row 14) and the moat floor
      { col: 34, row: 18, widthTiles: 3, rangeX: 0, rangeY: 128, speed: 1.2 },
    ],
    goalCol: 222,
    goalRow: 5,         // flag stands on the keep rooftop
    undergroundRow: 17, // dungeon + moat bottom get the dark backdrop
  },
  {
    name: 'World 1-4 Jungle',
    theme: 'jungle',
    playerStart: { col: 3, row: 15 },
    tiles: [
      '                                                                                                                                                                                                                                        ',
      '                                                                                                                                                                                                                                        ',
      '                                                                                            y    F                                                                                           C    F                                     ',
      '                                         F  C                      C                                       C      J                                               C                  C                                                  ',
      '                                                           C                         C     IIII    C                                                                  F                     IIII                                        ',
      '                                     C     IIII    C              IIII     C                              IIII   IIII                     C C             C      IIII               IIII                                                ',
      '                                                          IIII                      IIII          IIII                                                                          III                                                     ',
      '                                    IIII          IIII                    IIII                                                         SSSSSS     IIII   IIII            IIII                                                           ',
      '                                PP                                              PP                                                   SSSSSSSS                                                       SS                                  ',
      '                             IIIpp                                              pp                                                 SSSSSSSSSS                                                       SS                                  ',
      '                                pp                                              pp                                               SSSSSSSSSSSSSSS                                                      SS              C                 ',
      '                                pp             C C                              pp                                             SSSSSSSSSSSSSS                                                         SS             C C                ',
      '      C C C   A   H   N  IIII   pp  C     C                                     pp  C                  C        C            SSS           SS   SS                                                      SS          C   C  A            ',
      '                                              B?B?B   E PP                              PP   E  DD                    E    SSSSS C j C N                                                  C     C       SS        E                     ',
      '                                                        pp                              pp                               SSSSSSS               l                                                                                        ',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                         GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                 SSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                       SSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                 SSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  C                    SSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   C           SSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                     SSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG               SSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                     SSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG             SSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG                   SSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG  C  X C X C SSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   H  C  EC  C E   SSSSSSGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    ],
    movingPlatforms: [
      // lily pads across the croc gorge
      { col: 64, row: 12, widthTiles: 3, rangeX: 64, rangeY: 0, speed: 1.4 },
      { col: 71, row: 13, widthTiles: 3, rangeX: 64, rangeY: 0, speed: 1.1 },
    ],
    goalCol: 222,
    goalRow: 15,        // flag in the jungle clearing
    undergroundRow: 17, // gorge + root cave get the dark backdrop
  },
];

// =============================================================================
// LEVEL LOADER — Parse tile map into entities
// =============================================================================
export function loadLevel(levelIndex) {
  const def = LEVELS[levelIndex];
  const ts = CONFIG.tile.size;
  const entities = [];

  // Scan for entity markers in tile data
  const tiles = def.tiles.map((row, rowIdx) => {
    let newRow = '';
    for (let col = 0; col < row.length; col++) {
      const ch = row[col];
      if (ch === 'C') {
        entities.push(new Coin(col * ts, rowIdx * ts));
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
      } else if (ch === 'A') {
        entities.push(new Food(col * ts, rowIdx * ts, 'apple'));
        newRow += ' ';
      } else if (ch === 'H') {
        entities.push(new Food(col * ts, rowIdx * ts, 'cherry'));
        newRow += ' ';
      } else if (ch === 'N') {
        entities.push(new Food(col * ts, rowIdx * ts, 'banana'));
        newRow += ' ';
      } else if (ch === 'Y') {
        entities.push(new Key(col * ts, rowIdx * ts, 'gold'));
        newRow += ' ';
      } else if (ch === 'y') {
        entities.push(new Key(col * ts, rowIdx * ts, 'silver'));
        newRow += ' ';
      } else if (ch === 'J') {
        entities.push(new Gem(col * ts, rowIdx * ts, 'blue'));
        newRow += ' ';
      } else if (ch === 'j') {
        entities.push(new Gem(col * ts, rowIdx * ts, 'red'));
        newRow += ' ';
      } else if (ch === 'L') {
        entities.push(new Door(col * ts, rowIdx * ts, 'gold'));
        newRow += ' ';
      } else if (ch === 'l') {
        entities.push(new Door(col * ts, rowIdx * ts, 'silver'));
        newRow += ' ';
      } else {
        newRow += ch;
      }
    }
    return newRow;
  });

  // Add moving platforms
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

  const theme = THEMES[def.theme] || THEMES.grassland;
  const playerX = def.playerStart.col * ts;
  const playerY = def.playerStart.row * ts - CONFIG.player.height;

  return {
    name: def.name,
    theme,
    tiles,
    entities,
    playerX,
    playerY,
    goalCol: def.goalCol * ts,
    goalGroundY: (def.goalRow ?? tiles.length - 2) * ts,
    undergroundY: def.undergroundRow != null ? def.undergroundRow * ts : null,
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
  const ch = CONFIG.canvas.height;

  // Only draw visible tiles
  const startCol = Math.max(0, Math.floor(camera.x / ts));
  const endCol = Math.min(
    Math.max(...tiles.map(r => r.length)),
    Math.ceil((camera.x + cw) / ts) + 1
  );
  const startRow = Math.max(0, Math.floor(camera.y / ts));
  const endRow = Math.min(tiles.length, Math.ceil((camera.y + ch) / ts) + 1);

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      if (col >= tiles[row].length) continue;
      const ch = tiles[row][col];
      if (!ch || ch === ' ') continue;

      const tileDef = theme.tiles[ch];
      if (!tileDef) continue;

      const x = col * ts;
      const y = row * ts;

      // Main tile body
      ctx.fillStyle = tileDef.color;
      ctx.fillRect(x, y, ts, ts);

      // Top edge highlight
      ctx.fillStyle = tileDef.topColor;
      ctx.fillRect(x, y, ts, 4);

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(x, y, ts, ts);

      // Label (for ? blocks)
      if (tileDef.label) {
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tileDef.label, x + ts / 2, y + ts / 2);
      }
    }
  }
}

// =============================================================================
// BACKGROUND RENDERER — Parallax hills, clouds, bushes
// =============================================================================
export function drawBackground(ctx, theme, camera, levelWidth, undergroundY = null) {
  const cw = CONFIG.canvas.width;
  const ch = CONFIG.canvas.height;
  const bg = theme.background;

  // Sky (screen space — this runs before the camera transform is applied)
  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, cw, ch);

  // Dark cave backdrop below the ground line
  if (undergroundY != null) {
    const screenY = undergroundY - camera.y;
    if (screenY < ch) {
      ctx.fillStyle = '#2a1c10';
      ctx.fillRect(0, Math.max(0, screenY), cw, ch - Math.max(0, screenY));
    }
  }

  if (!bg.cloudColor && !bg.hillColor) return;

  // Clouds (slow parallax)
  if (bg.cloudColor) {
    ctx.fillStyle = bg.cloudColor;
    const cloudParallax = 0.3;
    const cloudOffsetX = camera.x * cloudParallax;
    for (let i = 0; i < levelWidth / 200; i++) {
      const cx = i * 250 + 50 - cloudOffsetX;
      const cy = 40 + (i % 3) * 30 + camera.y * 0.1;
      drawCloud(ctx, cx, cy);
    }
  }

  // Hills (medium parallax)
  if (bg.hillColor) {
    const hillParallax = 0.5;
    const hillOffsetX = camera.x * hillParallax;

    ctx.fillStyle = bg.hillColor;
    for (let i = 0; i < levelWidth / 150; i++) {
      const hx = i * 300 + 80 - hillOffsetX;
      const hy = CONFIG.canvas.height - 60 + camera.y;
      const hr = 40 + (i % 3) * 25;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, Math.PI, 0);
      ctx.fill();
    }
  }

  // Bushes (faster parallax, near ground)
  if (bg.bushColor) {
    ctx.fillStyle = bg.bushColor;
    const bushParallax = 0.7;
    const bushOffsetX = camera.x * bushParallax;
    for (let i = 0; i < levelWidth / 120; i++) {
      const bx = i * 220 + 30 - bushOffsetX;
      const by = CONFIG.canvas.height - 34 + camera.y;
      ctx.beginPath();
      ctx.ellipse(bx, by, 20 + (i % 2) * 10, 12, 0, Math.PI, 0);
      ctx.fill();
    }
  }
}

function drawCloud(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 5, 16, 0, Math.PI * 2);
  ctx.arc(x + 35, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 15, y + 8, 14, 0, Math.PI * 2);
  ctx.fill();
}

// =============================================================================
// GOAL FLAG
// =============================================================================
export function drawGoalFlag(ctx, goalX, groundY) {
  const flagHeight = 160;

  // Pole
  ctx.fillStyle = '#888';
  ctx.fillRect(goalX + 14, groundY - flagHeight, 4, flagHeight);

  // Ball on top
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(goalX + 16, groundY - flagHeight, 6, 0, Math.PI * 2);
  ctx.fill();

  // Flag
  ctx.fillStyle = '#00AA00';
  ctx.beginPath();
  ctx.moveTo(goalX + 18, groundY - flagHeight + 8);
  ctx.lineTo(goalX + 48, groundY - flagHeight + 20);
  ctx.lineTo(goalX + 18, groundY - flagHeight + 32);
  ctx.fill();
}
