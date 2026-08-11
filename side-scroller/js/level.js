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
// TILE RENDERER — themed tile texturing + decoration pass (visual only)
// =============================================================================

// Deterministic per-tile hash so details never flicker between frames
function tileHash(col, row) {
  let h = (col * 374761393 + row * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

// Lighten (f > 1) or darken (f < 1) a #rrggbb color
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

export function drawTiles(ctx, tiles, theme, camera) {
  const ts = CONFIG.tile.size;
  const cw = CONFIG.canvas.width;
  const ch = CONFIG.canvas.height;
  const style = theme.name; // 'Grassland' | 'Underground' | 'Castle' | 'Jungle'
  const time = (typeof performance !== 'undefined' ? performance.now() : 0) * 0.001;

  const maxCol = Math.max(...tiles.map(r => r.length));
  const startCol = Math.max(0, Math.floor(camera.x / ts));
  const endCol = Math.min(maxCol, Math.ceil((camera.x + cw) / ts) + 1);
  const startRow = Math.max(0, Math.floor(camera.y / ts));
  const endRow = Math.min(tiles.length, Math.ceil((camera.y + ch) / ts) + 1);

  const at = (c, r) => {
    if (r < 0 || r >= tiles.length) return ' ';
    if (c < 0 || c >= tiles[r].length) return ' ';
    return tiles[r][c] || ' ';
  };
  const empty = (c, r) => at(c, r) === ' ';

  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tch = at(col, row);
      if (tch === ' ') continue;
      const tileDef = theme.tiles[tch];
      if (!tileDef) continue;

      const x = col * ts;
      const y = row * ts;
      const h = tileHash(col, row);
      const base = tileDef.color;

      switch (tch) {
        case 'G': {
          const surface = empty(col, row - 1);
          ctx.fillStyle = surface ? base : shade(base, 0.92);
          ctx.fillRect(x, y, ts, ts);
          // dirt speckles
          ctx.fillStyle = shade(base, 0.75);
          for (let i = 0; i < 3; i++) {
            const sx = x + 4 + ((h >> (i * 5)) % (ts - 10));
            const sy = y + 8 + ((h >> (i * 7 + 3)) % (ts - 12));
            ctx.fillRect(sx, sy, 3, 2);
          }
          ctx.fillStyle = shade(base, 1.15);
          ctx.fillRect(x + 6 + (h % 14), y + 10 + ((h >> 9) % 14), 2, 2);
          if (surface) {
            // turf cap + hanging edge
            ctx.fillStyle = tileDef.topColor;
            ctx.fillRect(x, y, ts, 6);
            ctx.fillStyle = shade(tileDef.topColor, 0.8);
            for (let i = 0; i < 4; i++) {
              ctx.fillRect(x + 2 + i * 8 + ((h >> i) % 3), y + 6, 4, 3);
            }
            // grass blades poking up
            if (style === 'Grassland' || style === 'Jungle') {
              ctx.strokeStyle = shade(tileDef.topColor, 1.15);
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let i = 0; i < 3; i++) {
                const bx = x + 5 + i * 10 + ((h >> (i * 3)) % 5);
                ctx.moveTo(bx, y + 1);
                ctx.lineTo(bx + (((h >> i) % 3) - 1) * 2, y - 4 - ((h >> (i * 2)) % 4));
              }
              ctx.stroke();
            }
          } else if (empty(col, row + 1) && (style === 'Jungle' || style === 'Grassland')) {
            // dangling roots under cave ceilings
            if (h % 3 === 0) {
              ctx.strokeStyle = shade(base, 0.7);
              ctx.lineWidth = 2;
              ctx.beginPath();
              const rx = x + 6 + (h % 20);
              ctx.moveTo(rx, y + ts);
              ctx.quadraticCurveTo(rx + 3, y + ts + 6, rx - 1, y + ts + 10 + (h % 8));
              ctx.stroke();
            }
          }
          break;
        }

        case 'B': {
          ctx.fillStyle = base;
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = shade(base, 1.2);
          ctx.fillRect(x, y, ts, 3);
          // mortar joints (staggered like real brickwork)
          ctx.strokeStyle = shade(base, 0.65);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y + ts / 2); ctx.lineTo(x + ts, y + ts / 2);
          const off = (row % 2) * (ts / 2);
          ctx.moveTo(x + ((ts / 4 + off) % ts), y); ctx.lineTo(x + ((ts / 4 + off) % ts), y + ts / 2);
          ctx.moveTo(x + ((3 * ts / 4 + off) % ts), y + ts / 2); ctx.lineTo(x + ((3 * ts / 4 + off) % ts), y + ts);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
          break;
        }

        case 'S': {
          const surface = empty(col, row - 1);
          ctx.fillStyle = base;
          ctx.fillRect(x, y, ts, ts);
          // chiseled block inset
          ctx.strokeStyle = shade(base, 0.72);
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, ts - 4, ts - 4);
          ctx.strokeStyle = shade(base, 1.18);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + ts - 4); ctx.lineTo(x + 3, y + 3); ctx.lineTo(x + ts - 4, y + 3);
          ctx.stroke();
          // occasional crack
          if (h % 5 === 0) {
            ctx.strokeStyle = shade(base, 0.6);
            ctx.lineWidth = 1;
            ctx.beginPath();
            const cx0 = x + 8 + (h % 12), cy0 = y + 6 + ((h >> 4) % 8);
            ctx.moveTo(cx0, cy0);
            ctx.lineTo(cx0 + 4, cy0 + 7);
            ctx.lineTo(cx0 + 1, cy0 + 13);
            ctx.stroke();
          }
          if (surface && (style === 'Jungle' || style === 'Castle')) {
            // moss creeping over the top edge
            ctx.fillStyle = style === 'Jungle' ? '#4c9b3f' : '#4c6b4c';
            for (let i = 0; i < 3; i++) {
              const mx = x + 2 + i * 11 + ((h >> i) % 4);
              ctx.fillRect(mx, y, 7, 3 + ((h >> (i + 2)) % 3));
            }
          }
          break;
        }

        case 'P':
        case 'p': {
          ctx.fillStyle = base;
          ctx.fillRect(x, y, ts, ts);
          // cylindrical shading — only on the outer edges of the whole trunk
          if (at(col - 1, row) !== 'P' && at(col - 1, row) !== 'p') {
            ctx.fillStyle = shade(base, 1.35);
            ctx.fillRect(x + 4, y, 5, ts);
          }
          if (at(col + 1, row) !== 'P' && at(col + 1, row) !== 'p') {
            ctx.fillStyle = shade(base, 0.7);
            ctx.fillRect(x + ts - 6, y, 4, ts);
          }
          if (tch === 'P') {
            // cap lip
            ctx.fillStyle = tileDef.topColor;
            ctx.fillRect(x - (empty(col - 1, row) ? 2 : 0), y, ts + (empty(col + 1, row) ? 2 : 0) + (empty(col - 1, row) ? 2 : 0), 7);
            ctx.fillStyle = shade(base, 0.8);
            ctx.fillRect(x, y + 7, ts, 2);
          }
          if (style === 'Jungle') {
            // bamboo node ring
            ctx.fillStyle = shade(base, 0.65);
            ctx.fillRect(x, y + ts - 4, ts, 3);
            ctx.fillStyle = shade(base, 1.25);
            ctx.fillRect(x, y + ts - 6, ts, 2);
          }
          break;
        }

        case 'I': {
          // one-way platform drawn as a plank/branch at the top of the tile
          const leftEnd = at(col - 1, row) !== 'I';
          const rightEnd = at(col + 1, row) !== 'I';
          if (style === 'Jungle') {
            // branch wood
            ctx.fillStyle = base;
            ctx.fillRect(x, y + 2, ts, 8);
            ctx.fillStyle = shade(base, 0.7);
            ctx.fillRect(x, y + 8, ts, 2);
            // leaf clusters along the top
            const leaf = tileDef.topColor;
            for (let i = 0; i < 3; i++) {
              const lx = x + 5 + i * 11 + ((h >> i) % 4);
              ctx.fillStyle = (h >> (i * 2)) % 2 ? leaf : shade(leaf, 0.82);
              ctx.beginPath();
              ctx.arc(lx, y + 1 - ((h >> (i * 3)) % 3), 6, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = base;
            ctx.fillRect(x, y + 2, ts, 9);
            ctx.fillStyle = tileDef.topColor;
            ctx.fillRect(x, y + 2, ts, 3);
            ctx.fillStyle = shade(base, 0.7);
            ctx.fillRect(x, y + 9, ts, 2);
            // little support nubs on the ends
            ctx.fillStyle = shade(base, 0.85);
            if (leftEnd) ctx.fillRect(x + 2, y + 11, 4, 5);
            if (rightEnd) ctx.fillRect(x + ts - 6, y + 11, 4, 5);
          }
          break;
        }

        case '?': {
          ctx.fillStyle = base;
          ctx.fillRect(x, y, ts, ts);
          // bevel
          ctx.fillStyle = shade(base, 1.25);
          ctx.fillRect(x, y, ts, 3); ctx.fillRect(x, y, 3, ts);
          ctx.fillStyle = shade(base, 0.7);
          ctx.fillRect(x, y + ts - 3, ts, 3); ctx.fillRect(x + ts - 3, y, 3, ts);
          // rivets
          ctx.fillStyle = shade(base, 0.6);
          for (const [rx, ry] of [[6, 6], [ts - 6, 6], [6, ts - 6], [ts - 6, ts - 6]]) {
            ctx.beginPath(); ctx.arc(x + rx, y + ry, 2, 0, Math.PI * 2); ctx.fill();
          }
          break;
        }

        default: {
          ctx.fillStyle = base;
          ctx.fillRect(x, y, ts, ts);
          ctx.fillStyle = tileDef.topColor;
          ctx.fillRect(x, y, ts, 4);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.strokeRect(x, y, ts, ts);
        }
      }

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

  // --- Decoration pass (drawn over tiles, purely cosmetic) ------------------
  for (let row = startRow; row < endRow; row++) {
    for (let col = startCol; col < endCol; col++) {
      const tch = at(col, row);
      if (tch === ' ') continue;
      const h = tileHash(col, row);
      const x = col * ts;
      const y = row * ts;
      const surface = empty(col, row - 1);

      // flowers / ferns / mushrooms on walkable grass
      if (tch === 'G' && surface) {
        if ((style === 'Grassland' || style === 'Jungle') && h % 7 === 0) {
          const fx = x + 8 + (h % 16);
          ctx.strokeStyle = '#2e7d32';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(fx, y); ctx.lineTo(fx, y - 9); ctx.stroke();
          const petals = ['#ff5a5a', '#ffd93b', '#ff9ff3', '#fdfdfd'];
          ctx.fillStyle = petals[(h >> 6) % petals.length];
          for (let a = 0; a < 5; a++) {
            ctx.beginPath();
            ctx.arc(fx + Math.cos(a * 1.257) * 3.4, y - 11 + Math.sin(a * 1.257) * 3.4, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#f9a825';
          ctx.beginPath(); ctx.arc(fx, y - 11, 2, 0, Math.PI * 2); ctx.fill();
        } else if (style === 'Jungle' && h % 5 === 1) {
          // fern: three arcs
          const fx = x + 6 + (h % 18);
          ctx.strokeStyle = '#2f8f3f';
          ctx.lineWidth = 2;
          for (let a = -1; a <= 1; a++) {
            ctx.beginPath();
            ctx.moveTo(fx, y);
            ctx.quadraticCurveTo(fx + a * 8, y - 12, fx + a * 12, y - 8);
            ctx.stroke();
          }
        } else if (style === 'Underground' && h % 9 === 2) {
          // glowing mushroom
          const mx = x + 8 + (h % 14);
          ctx.fillStyle = '#d8d0c0';
          ctx.fillRect(mx - 1, y - 6, 3, 6);
          ctx.fillStyle = (h >> 5) % 2 ? '#e05f4e' : '#7fc7de';
          ctx.beginPath(); ctx.arc(mx, y - 6, 5, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(mx - 2, y - 8, 2, 2);
        } else if (style === 'Castle' && h % 11 === 4) {
          // sparse weeds between the flagstones
          ctx.strokeStyle = '#5d7a52';
          ctx.lineWidth = 1.5;
          const wx = x + 6 + (h % 18);
          ctx.beginPath();
          ctx.moveTo(wx, y); ctx.lineTo(wx - 2, y - 5);
          ctx.moveTo(wx + 2, y); ctx.lineTo(wx + 3, y - 6);
          ctx.stroke();
        }
      }

      // stalactites on underground ceilings
      if (style === 'Underground' && (tch === 'S' || tch === 'G') && empty(col, row + 1) && h % 5 < 2) {
        const base2 = theme.tiles[tch].color;
        ctx.fillStyle = shade(base2, 0.85);
        const sx = x + 4 + (h % 12);
        const len = 8 + ((h >> 4) % 10);
        ctx.beginPath();
        ctx.moveTo(sx, y + ts); ctx.lineTo(sx + 10, y + ts); ctx.lineTo(sx + 5, y + ts + len);
        ctx.closePath(); ctx.fill();
      }

      // hanging vines from jungle branches
      if (style === 'Jungle' && tch === 'I' && h % 4 === 0) {
        const time2 = (typeof performance !== 'undefined' ? performance.now() : 0) * 0.001;
        const vx = x + 8 + (h % 16);
        const sway = Math.sin(time2 * 1.4 + col) * 3;
        const len = 36 + (h % 30);
        ctx.strokeStyle = '#2f7d3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx, y + 10);
        ctx.quadraticCurveTo(vx + sway, y + 10 + len * 0.6, vx + sway * 1.6, y + 10 + len);
        ctx.stroke();
        ctx.fillStyle = '#3f9b4a';
        for (let i = 1; i <= 2; i++) {
          ctx.beginPath();
          ctx.ellipse(vx + sway * i * 0.6 + 2, y + 10 + (len / 3) * i, 4, 2.5, 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // arched windows deep in castle masonry
      if (style === 'Castle' && tch === 'S'
          && !empty(col, row - 1) && !empty(col, row + 1)
          && !empty(col - 1, row) && !empty(col + 1, row)
          && h % 17 === 0) {
        const wx = x + ts / 2, wy = y + 8;
        ctx.fillStyle = '#141428';
        ctx.beginPath();
        ctx.moveTo(wx - 5, y + ts - 8);
        ctx.lineTo(wx - 5, wy + 5);
        ctx.arc(wx, wy + 5, 5, Math.PI, 0);
        ctx.lineTo(wx + 5, y + ts - 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = shade(theme.tiles.S.color, 1.15);
        ctx.fillRect(wx - 7, y + ts - 8, 14, 2);
      }
    }
  }
}

// =============================================================================
// BACKGROUND RENDERER — layered parallax scenery per theme
// =============================================================================
export function drawBackground(ctx, theme, camera, levelWidth, undergroundY = null) {
  const cw = CONFIG.canvas.width;
  const ch = CONFIG.canvas.height;
  const bg = theme.background;
  const style = theme.name;

  // Sky gradient (screen space — runs before the camera transform)
  const skyTops = { Grassland: '#3f7fe8', Underground: '#000000', Castle: '#0d0d1f', Jungle: '#5aa84f' };
  const skyBots = { Grassland: '#9fd4ff', Underground: '#14141f', Castle: '#33334f', Jungle: '#a9d98b' };
  const grad = ctx.createLinearGradient(0, 0, 0, ch);
  grad.addColorStop(0, skyTops[style] || theme.sky);
  grad.addColorStop(1, skyBots[style] || theme.sky);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  if (style === 'Grassland' || style === 'Jungle') {
    // sun with soft glow
    const sx = cw - 140 - camera.x * 0.05, sy = 70 - camera.y * 0.05;
    const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 70);
    glow.addColorStop(0, 'rgba(255,245,180,0.95)');
    glow.addColorStop(0.3, 'rgba(255,235,140,0.5)');
    glow.addColorStop(1, 'rgba(255,235,140,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 70, sy - 70, 140, 140);
    ctx.fillStyle = '#fff7cf';
    ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill();
  }

  if (style === 'Castle') {
    // moon + stars
    const mx = cw - 130 - camera.x * 0.04, my = 70 - camera.y * 0.04;
    ctx.fillStyle = '#f4f1d8';
    ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = skyTops.Castle;
    ctx.beginPath(); ctx.arc(mx - 8, my - 5, 16, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 40; i++) {
      const hsh = tileHash(i, 77);
      const stx = ((hsh % 977) / 977) * cw;
      const sty = ((hsh >> 10) % 331) / 331 * ch * 0.55;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + ((hsh >> 3) % 60) / 100})`;
      ctx.fillRect(stx, sty, 2, 2);
    }
    // distant castle skyline
    ctx.fillStyle = '#1b1b33';
    const skOff = camera.x * 0.25;
    for (let i = 0; i < 10; i++) {
      const bx = ((i * 420 - skOff) % (cw + 500) + cw + 500) % (cw + 500) - 250;
      const bh = 90 + (tileHash(i, 3) % 70);
      ctx.fillRect(bx, ch - 60 - bh, 60, bh + 60);
      for (let m = 0; m < 4; m++) ctx.fillRect(bx + m * 16, ch - 68 - bh, 10, 8);
      ctx.fillRect(bx + 70, ch - 60 - bh * 0.55, 90, bh * 0.55 + 60);
    }
  }

  if (style === 'Underground') {
    // rock strata + distant stalactite silhouettes
    ctx.fillStyle = '#1a1a24';
    const stOff = camera.x * 0.2;
    for (let i = 0; i < 24; i++) {
      const px = ((i * 130 - stOff) % (cw + 200) + cw + 200) % (cw + 200) - 100;
      const len = 40 + (tileHash(i, 9) % 90);
      ctx.beginPath();
      ctx.moveTo(px, 0); ctx.lineTo(px + 44, 0); ctx.lineTo(px + 22, len);
      ctx.closePath(); ctx.fill();
    }
    // faint glowing crystals
    for (let i = 0; i < 14; i++) {
      const hsh = tileHash(i, 41);
      const gx = ((hsh % 887) / 887) * cw;
      const gy = ch * 0.4 + ((hsh >> 8) % 200);
      ctx.fillStyle = ['rgba(120,180,255,0.35)', 'rgba(180,120,255,0.3)', 'rgba(120,255,200,0.3)'][hsh % 3];
      ctx.beginPath();
      ctx.moveTo(gx, gy - 6); ctx.lineTo(gx + 4, gy); ctx.lineTo(gx, gy + 6); ctx.lineTo(gx - 4, gy);
      ctx.closePath(); ctx.fill();
    }
  }

  if (style === 'Jungle') {
    // hanging canopy layers from the top of the screen
    const layers = [
      { par: 0.15, color: 'rgba(38,92,44,0.85)', depth: 70, step: 90 },
      { par: 0.3, color: 'rgba(30,75,36,0.9)', depth: 46, step: 70 },
    ];
    for (const L of layers) {
      ctx.fillStyle = L.color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const off = camera.x * L.par;
      for (let px = -60; px <= cw + 60; px += L.step) {
        const i = Math.floor((px + off) / L.step);
        const d = L.depth + (tileHash(i, 5) % 36);
        ctx.quadraticCurveTo(px + L.step / 2, d * 1.7, px + L.step, d * 0.6);
      }
      ctx.lineTo(cw, 0);
      ctx.closePath();
      ctx.fill();
    }
    // distant tree trunks
    ctx.fillStyle = 'rgba(48,66,38,0.55)';
    const tOff = camera.x * 0.35;
    for (let i = 0; i < 12; i++) {
      const tx = ((i * 260 - tOff) % (cw + 300) + cw + 300) % (cw + 300) - 150;
      const w = 16 + (tileHash(i, 13) % 14);
      ctx.fillRect(tx, 40, w, ch);
      ctx.fillRect(tx - 8, 60 + (tileHash(i, 17) % 40), w + 16, 10);
    }
  }

  // Clouds (slow parallax, fluffy)
  if (bg.cloudColor) {
    const cloudOffsetX = camera.x * 0.3;
    for (let i = 0; i < levelWidth / 200; i++) {
      const cx = i * 250 + 50 - cloudOffsetX;
      const cy = 40 + (i % 3) * 30 + camera.y * 0.1;
      drawCloud(ctx, cx, cy, bg.cloudColor, 0.9 + (i % 3) * 0.25);
    }
  }

  // Hills — two depths
  if (bg.hillColor) {
    const hy = ch - 135 + camera.y * 0.15;
    ctx.fillStyle = shade2(bg.hillColor, 1.25);
    const farOff = camera.x * 0.35;
    for (let i = 0; i < levelWidth / 130; i++) {
      const hx = i * 260 + 40 - farOff;
      const hr = 55 + (i % 4) * 22;
      ctx.beginPath(); ctx.arc(hx, hy + 14, hr, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = bg.hillColor;
    const nearOff = camera.x * 0.5;
    for (let i = 0; i < levelWidth / 150; i++) {
      const hx = i * 300 + 80 - nearOff;
      const hr = 40 + (i % 3) * 25;
      ctx.beginPath(); ctx.arc(hx, hy + 10, hr, Math.PI, 0); ctx.fill();
      // simple tree silhouettes on the near hills
      if (style === 'Grassland' && i % 2 === 0) {
        const tx2 = hx + hr * 0.4;
        ctx.fillRect(tx2 - 2, hy - hr * 0.55 + 10, 5, hr * 0.35);
        ctx.beginPath(); ctx.arc(tx2, hy - hr * 0.62 + 10, 12, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  // Bushes near the ground line
  if (bg.bushColor) {
    ctx.fillStyle = bg.bushColor;
    const bushOffsetX = camera.x * 0.7;
    for (let i = 0; i < levelWidth / 120; i++) {
      const bx = i * 220 + 30 - bushOffsetX;
      const by = ch - 105 + camera.y * 0.2;
      ctx.beginPath();
      ctx.ellipse(bx, by, 20 + (i % 2) * 10, 12, 0, Math.PI, 0);
      ctx.ellipse(bx + 18, by, 14, 9, 0, Math.PI, 0);
      ctx.fill();
    }
  }

  // Dark cave backdrop below the ground line (gradient)
  if (undergroundY != null) {
    const screenY = undergroundY - camera.y;
    if (screenY < ch) {
      const top = Math.max(0, screenY);
      const cg = ctx.createLinearGradient(0, top, 0, ch);
      cg.addColorStop(0, '#3a2a18');
      cg.addColorStop(1, '#17100a');
      ctx.fillStyle = cg;
      ctx.fillRect(0, top, cw, ch - top);
    }
  }
}

// darken/lighten for background colors (accepts #rrggbb)
function shade2(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

function drawCloud(ctx, x, y, color = '#FFFFFF', scale = 1) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 6 * scale, 16 * scale, 0, Math.PI * 2);
  ctx.arc(x + 38 * scale, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 18 * scale, y + 8 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(x + 8 * scale, y - 8 * scale, 10 * scale, 0, Math.PI * 2);
  ctx.fill();
}

// =============================================================================
// GOAL FLAG
// =============================================================================
export function drawGoalFlag(ctx, goalX, groundY) {
  const flagHeight = 160;
  const time = (typeof performance !== 'undefined' ? performance.now() : 0) * 0.003;

  // Pole with a subtle highlight
  ctx.fillStyle = '#777';
  ctx.fillRect(goalX + 14, groundY - flagHeight, 4, flagHeight);
  ctx.fillStyle = '#aaa';
  ctx.fillRect(goalX + 14, groundY - flagHeight, 1.5, flagHeight);

  // Ball on top
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(goalX + 16, groundY - flagHeight, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff2a8';
  ctx.beginPath();
  ctx.arc(goalX + 14, groundY - flagHeight - 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Waving flag
  const wave = Math.sin(time * 2.2) * 4;
  ctx.fillStyle = '#00AA00';
  ctx.beginPath();
  ctx.moveTo(goalX + 18, groundY - flagHeight + 8);
  ctx.quadraticCurveTo(goalX + 36, groundY - flagHeight + 12 + wave, goalX + 48, groundY - flagHeight + 20 + wave);
  ctx.quadraticCurveTo(goalX + 36, groundY - flagHeight + 24 + wave * 0.5, goalX + 18, groundY - flagHeight + 32);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(goalX + 18, groundY - flagHeight + 8);
  ctx.quadraticCurveTo(goalX + 30, groundY - flagHeight + 11 + wave, goalX + 40, groundY - flagHeight + 16 + wave);
  ctx.lineTo(goalX + 18, groundY - flagHeight + 14);
  ctx.fill();
}
