#!/usr/bin/env python3
"""Generate World 1-3 Castle from scratch.

Layout (cols):
  0-30    approach: fruits, coins, silver key on a pedestal
  31-40   moat shaft: fall in -> secret dungeon entrance; I-bridge + elevator above
  41-52   ledge + gatehouse wall (silver door), secret tunnel below
  53-119  great hall: pillars, chandeliers, ? blocks, I-ladder to the roof
          battlements on the hall roof (merlons, blue gem, flyguy)
          dungeon corridor runs beneath everything (rows 19-22)
  120-167 courtyard: open sky, drop-hole to dungeon, pipe, gold key pedestal,
          dungeon exit staircase under a floor opening
  168-171 gold gate: full-height wall, door is the only way through
  172-177 landing, then tower doorway
  178-190 tower: I-platform zigzag climb up the shaft
  191-230 keep rooftop: merlons, coins, flag at 222
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

# =========================== approach (0-30) ===========================
put(15, 0, 30, 'G')
put(16, 0, 30, 'G')
for r in range(17, 25):
    put(r, 0, 30, 'G')
for c in (6, 8, 10):
    mark(12, c, 'C')
mark(12, 14, 'A'); mark(12, 18, 'H'); mark(12, 22, 'N')   # early fruit cluster
mark(13, 24, 'E')
put(13, 27, 27, 'S'); put(14, 27, 27, 'S')                # pedestal
mark(11, 27, 'y')                                          # silver key

# ======================== moat shaft (31-40) ===========================
put(23, 31, 40, 'S')
put(24, 31, 40, 'S')
put(14, 32, 33, 'I')                                       # bridge segments
put(14, 37, 38, 'I')
mark(17, 35, 'C'); mark(20, 33, 'C'); mark(21, 37, 'C')    # falling coins

# ================== ledge + gatehouse + tunnel (41-52) =================
put(15, 41, 52, 'G')
put(16, 41, 52, 'G')
put(17, 41, 52, 'S'); put(18, 41, 52, 'S')                 # tunnel ceiling
put(23, 41, 52, 'S'); put(24, 41, 52, 'S')                 # tunnel floor
for r in range(2, 13):
    put(r, 47, 49, 'S')                                    # gatehouse wall
put(15, 47, 49, 'G'); put(16, 47, 49, 'G')
mark(1, 47, 'S'); mark(1, 49, 'S')                         # merlon caps
mark(14, 48, 'l')                                          # silver door (rows 13-14)
mark(12, 44, 'C'); mark(12, 51, 'C')
mark(21, 43, 'C'); mark(21, 45, 'C'); mark(21, 51, 'C')    # tunnel coins
mark(21, 49, 'X')                                          # tunnel spiker

# ========================= great hall (53-119) =========================
put(4, 53, 119, 'S'); put(5, 53, 119, 'S')                 # roof slabs
put(4, 103, 105, ' '); put(5, 103, 105, ' ')               # roof hole (ladder exit)
put(15, 53, 119, 'G'); put(16, 53, 119, 'G')               # hall floor
put(17, 53, 163, 'S'); put(18, 53, 163, 'S')               # dungeon ceiling
put(23, 53, 163, 'S'); put(24, 53, 163, 'S')               # dungeon floor
# pillars
for c1 in (60, 72, 94):
    put(13, c1, c1 + 1, 'S'); put(14, c1, c1 + 1, 'S')
# chandeliers (butterfly bonus)
for c1 in (64, 76, 88):
    put(8, c1, c1 + 2, 'B')
mark(6, 65, 'C'); mark(6, 77, 'C'); mark(6, 89, 'C')
# ? block row
put(13, 78, 82, 'B'); mark(13, 79, '?'); mark(13, 81, '?')
mark(12, 57, 'C'); mark(12, 87, 'C'); mark(12, 98, 'C')
mark(13, 68, 'E'); mark(13, 84, 'E')
mark(9, 92, 'F')
# I-ladder to the roof hole (wide platforms, forgiving)
put(12, 102, 105, 'I')
put(9, 105, 108, 'I')
put(6, 101, 104, 'I')
mark(10, 103, 'C'); mark(7, 107, 'C')

# ================= battlements on the hall roof (53-119) ===============
for c in (58, 66, 74, 82, 90, 98, 114):
    mark(3, c, 'S')                                        # merlons
for c in (62, 70, 94, 106):
    mark(2, c, 'C')
mark(2, 86, 'J')                                           # blue gem
mark(1, 78, 'F')

# ========================= courtyard (120-167) =========================
put(15, 120, 167, 'G'); put(16, 120, 167, 'G')
put(15, 124, 126, ' '); put(16, 124, 126, ' ')             # drop-hole to dungeon
put(15, 158, 163, ' '); put(16, 158, 163, ' ')             # opening over exit stairs
put(17, 124, 126, ' '); put(18, 124, 126, ' ')             # holes pierce the ceiling
put(17, 158, 163, ' '); put(18, 158, 163, ' ')
mark(18, 125, 'C'); mark(21, 125, 'C')                     # coins in the drop
put(13, 140, 141, 'P'); put(14, 140, 141, 'p')             # courtyard pipe
mark(11, 140, 'C'); mark(11, 141, 'C')
mark(12, 132, 'C'); mark(12, 152, 'C')
mark(12, 148, 'H')                                          # cherry
mark(13, 136, 'E')
put(13, 156, 156, 'S'); put(14, 156, 156, 'S')             # gold pedestal
mark(11, 156, 'Y')                                          # gold key (main)
# dungeon exit staircase (under the opening)
put(21, 158, 159, 'S'); put(22, 158, 159, 'S')
put(19, 160, 161, 'S'); put(20, 160, 161, 'S'); put(21, 160, 161, 'S'); put(22, 160, 161, 'S')
put(17, 162, 163, 'S'); put(18, 162, 163, 'S'); put(19, 162, 163, 'S'); put(20, 162, 163, 'S'); put(21, 162, 163, 'S'); put(22, 162, 163, 'S')
for r in range(17, 25):
    put(r, 164, 167, 'S')

# =================== dungeon corridor contents (53-157) ================
for c in (58, 62, 96, 120, 142):
    mark(21, c, 'C')
mark(21, 74, 'N')                                          # banana
put(21, 100, 102, 'B'); mark(21, 101, '?')
mark(19, 101, 'C')
mark(21, 68, 'D')                                          # pushable block
mark(21, 110, 'X')                                         # spiker
mark(21, 90, 'E'); mark(21, 134, 'E')
mark(20, 146, 'j')                                         # red gem
mark(20, 150, 'Y')                                         # backup gold key

# ========================= gold gate (168-171) =========================
for r in range(1, 13):
    put(r, 168, 171, 'S')
put(15, 168, 171, 'G'); put(16, 168, 171, 'G')
for r in range(17, 25):
    put(r, 168, 171, 'S')
mark(0, 168, 'S'); mark(0, 171, 'S')                       # merlon caps
mark(14, 169, 'L')                                         # gold door (rows 13-14)

# ========================== landing (172-177) ==========================
put(15, 172, 177, 'G'); put(16, 172, 177, 'G')
for r in range(17, 25):
    put(r, 172, 177, 'S')
mark(13, 174, 'C')

# =========================== tower (178-190) ===========================
for r in range(2, 13):
    put(r, 178, 179, 'S')                                  # left wall (doorway 13-15)
for r in range(16, 25):
    put(r, 178, 179, 'S')
for r in range(5, 25):
    put(r, 189, 190, 'S')                                  # right wall (exit rows 2-4)
put(22, 180, 188, 'S'); put(23, 180, 188, 'S'); put(24, 180, 188, 'S')
mark(1, 178, 'S'); mark(1, 179, 'S')                       # cap
# zigzag I-platforms
put(19, 181, 183, 'I')
put(16, 185, 187, 'I')
put(13, 181, 183, 'I')
put(10, 185, 187, 'I')
put(7, 181, 183, 'I')
put(4, 185, 187, 'I')
mark(17, 182, 'C'); mark(14, 186, 'C'); mark(11, 182, 'C')
mark(8, 186, 'C'); mark(5, 182, 'C'); mark(2, 186, 'C')

# ======================== keep rooftop (191-230) =======================
for r in range(5, 25):
    put(r, 191, 230, 'S')
for c in (195, 200, 205, 210):
    mark(4, c, 'S')                                        # merlons
for c in (197, 202, 207, 212):
    mark(3, c, 'C')
mark(2, 215, 'F')
mark(2, 218, 'C'); mark(2, 220, 'C')
# right edge wall
for r in range(0, 25):
    put(r, 231, 231, 'S')

# =============================== emit ==================================
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles3_out.txt', 'w') as f:
    f.write(out + '\n')

for lo, hi in ((0, 120), (112, 232)):
    print(f'cols {lo}-{hi-1}:')
    print('   ' + ''.join(str((c // 10) % 10) for c in range(lo, hi)))
    print('   ' + ''.join(str(c % 10) for c in range(lo, hi)))
    for r, ln in enumerate(lines):
        print(f'{r:2d} ' + ln[lo:hi])
    print()
