#!/usr/bin/env python3
"""Generate World 1-5 Numberland — math built into the landscape.

  0-16    meadow (fruit cluster)
  17-52   Fibonacci towers 1,1,2,3,5,8,13 — the RISES are also Fibonacci
          (0,1,1,2,3,5); the final +5 outgrows your jump: ride the elevator.
          Blue gem crowns the 13. Falls land on safe ground below.
  53-88   powers-of-two sky run: gaps double 1,2,4,8 (the 8 needs the ferry
          platform); coin clusters double 1,2,4,8; red gem + banana at the end
  89-127  square-number garden: grounded n-x-n numberblock squares 1,2,3,4,5,
          coin arrays (2x2=4, 3x3=9) floating above, two REAL pits between the
          small squares, gold key on the 5x5, flyguy + spiker on guard
  125-158 ten-frame vault below ground: 2x5 coin frames, backup gold key,
          cherry, goombas, exit stairs (castle pattern)
  163-166 gold gate (full-height wall, door only)
  171-186 pi meadow: coin stacks 3,1,4,1,5
  184-199 THE HUNDRED: solid 10x10 numberblock, scaffold climb up its face,
          goomba patrolling the top, flag flying from the summit
"""

WIDTH = 232
ROWS = 25

grid = [[' '] * WIDTH for _ in range(ROWS)]

def put(r, c1, c2, ch):
    for c in range(c1, c2 + 1):
        assert 0 <= r < ROWS and 0 <= c < WIDTH, (r, c)
        grid[r][c] = ch

def mark(r, c, ch):
    put(r, c, c, ch)

def ground(c1, c2):
    put(15, c1, c2, 'G'); put(16, c1, c2, 'G')
    for r in range(17, 25):
        put(r, c1, c2, 'G')

# ============================ terrain ==================================
ground(0, 94)
ground(98, 104)     # island between the two pits
ground(108, WIDTH - 1)
# (pits at 95-97 and 105-107 stay open to the void — real stakes)

# ============================ meadow ===================================
mark(12, 6, 'A'); mark(12, 9, 'H'); mark(12, 12, 'N')   # caterpillar cluster
mark(13, 15, 'C')

# ===================== Fibonacci towers (17-52) ========================
# 1-wide towers so every unit block counts true (height IS the number)
FIB = [(18, 1, '1'), (22, 1, '1'), (26, 2, '2'), (30, 3, '3'),
       (34, 5, '5'), (38, 8, '8'), (43, 13, '9')]
for c, h, ch in FIB:
    for r in range(15 - h, 15):
        put(r, c, c, ch)
    mark(15 - h - 2, c, 'C')          # one coin over each tower
mark(0, 44, 'J')                       # blue gem crowns the 13
mark(5, 47, 'F')
mark(13, 24, 'E')
# (vertical elevator platform at col 46 rides rows 3-13 — in movingPlatforms)

# =================== powers-of-two sky run (53-88) =====================
put(6, 53, 56, 'I')
put(6, 58, 61, 'I')    # gap 1
put(6, 64, 67, 'I')    # gap 2
put(6, 72, 75, 'I')    # gap 4
put(6, 84, 87, 'I')    # gap 8 — ferry platform crosses (movingPlatforms)
mark(4, 54, 'C')                                        # 1
mark(4, 59, 'C'); mark(4, 60, 'C')                      # 2
for r, c in ((3, 65), (3, 66), (4, 65), (4, 66)):       # 4 (2x2)
    mark(r, c, 'C')
for c in range(72, 76):                                 # 8 (2x4)
    mark(3, c, 'C'); mark(4, c, 'C')
mark(4, 85, 'j')                                        # red gem
mark(4, 87, 'N')                                        # banana
mark(13, 61, 'E'); mark(13, 69, 'E')                    # ground lane below

# =================== square-number garden (89-127) =====================
mark(14, 92, '1')
put(13, 100, 101, '2'); put(14, 100, 101, '2')
for r in range(12, 15):
    put(r, 111, 113, '3')
for r in range(11, 15):
    put(r, 117, 120, '4')
for r in range(10, 15):
    put(r, 124, 128, '5')
# coin arrays: 2x2 = 4 and 3x3 = 9, floating over their squares
for r in (11, 12):
    for c in (100, 101):
        mark(r, c, 'C')
for r in (9, 10, 11):
    for c in (111, 112, 113):
        mark(r, c, 'C')
mark(8, 118, 'F')                                       # guards the 4x4
mark(8, 126, 'Y')                                       # gold key on the 5x5
mark(13, 115, 'X')                                      # spiker on the ground lane

# ==================== ten-frame vault (125-158) ========================
for r in range(19, 23):
    put(r, 125, 154, ' ')                               # carve the cave (incl. stairwell)
for r in range(15, 19):
    put(r, 130, 132, ' ')                               # drop-in opening
for r in range(15, 19):
    put(r, 153, 158, ' ')                               # opening over the stairs
put(21, 153, 154, 'S'); put(22, 153, 154, 'S')
put(19, 155, 156, 'S'); put(20, 155, 156, 'S'); put(21, 155, 156, 'S'); put(22, 155, 156, 'S')
put(17, 157, 158, 'S'); put(18, 157, 158, 'S'); put(19, 157, 158, 'S'); put(20, 157, 158, 'S'); put(21, 157, 158, 'S'); put(22, 157, 158, 'S')
mark(20, 127, 'Y')                                      # backup gold key
for r in (20, 21):                                      # two ten-frames (2x5)
    for c in range(134, 139):
        mark(r, c, 'C')
    for c in range(141, 146):
        mark(r, c, 'C')
mark(21, 148, 'H')                                      # cherry
mark(21, 137, 'E'); mark(21, 144, 'E')
# above the vault: a 2x3 array + flyguy
for r in (11, 12):
    for c in (136, 137, 138):
        mark(r, c, 'C')
mark(9, 143, 'F')

# ========================= gold gate (163-166) =========================
for r in range(1, 13):
    put(r, 163, 166, 'S')
mark(0, 163, 'S'); mark(0, 166, 'S')
mark(14, 164, 'L')                                      # gold door (rows 13-14)

# ==================== pi meadow: 3,1,4,1,5 (171-186) ===================
for c, h in ((174, 3), (176, 1), (178, 4), (180, 1), (182, 5)):
    for r in range(15 - h, 15):
        mark(r, c, 'C')
mark(13, 172, 'E')

# ======================= THE HUNDRED (184-199) =========================
for r in range(5, 15):
    put(r, 190, 199, '0')                               # solid 10x10
# scaffold up the left face
put(12, 184, 186, 'I')
put(9, 186, 188, 'I')
put(6, 184, 186, 'I')
mark(10, 185, 'C'); mark(7, 187, 'C'); mark(4, 185, 'C')
mark(4, 195, 'E')                                       # goomba patrols the top

# =============================== emit ==================================
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles5_out.txt', 'w') as f:
    f.write(out + '\n')

for lo, hi in ((0, 120), (112, 232)):
    print(f'cols {lo}-{hi-1}:')
    print('   ' + ''.join(str((c // 10) % 10) for c in range(lo, hi)))
    print('   ' + ''.join(str(c % 10) for c in range(lo, hi)))
    for r, ln in enumerate(lines):
        print(f'{r:2d} ' + ln[lo:hi])
    print()
