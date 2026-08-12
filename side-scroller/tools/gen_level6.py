#!/usr/bin/env python3
"""Generate World 1-6 The Doubling Cave (Crystal Cave theme).

Carved from solid rock. The doubling is the architecture:
  chamber heights double  2 -> 4 -> 8 -> 16 rows
  chamber lengths double  8 -> 16 -> 32 -> 64 cols
  then the way out HALVES back down: 16 -> 8 -> 4 -> 2.

Inside the great cavern: monument towers 1, 2, 4, 8 — and a 16 that fills
the chamber floor-to-ceiling exactly (2^4 tall in a 2^4 chamber). Elevators
carry you where doubling outgrows your jump (4->8, 8->up). A halving coin
trail (8, 4, 2, 1 coins) runs along the ceiling ledges, ending at gems and
the backup key. Coins per chamber double 1, 2, 4, 8 on the floor route.
Gold key on the 8-tower; gold door guards the way out.
"""

WIDTH = 232
ROWS = 25

grid = [['S'] * WIDTH for _ in range(ROWS)]   # solid rock; we carve

def put(r, c1, c2, ch):
    for c in range(c1, c2 + 1):
        assert 0 <= r < ROWS and 0 <= c < WIDTH, (r, c)
        grid[r][c] = ch

def carve(r1, r2, c1, c2):
    for r in range(r1, r2 + 1):
        put(r, c1, c2, ' ')

def mark(r, c, ch):
    put(r, c, c, ch)

# ======================= chambers (doubling in, halving out) ============
carve(12, 19, 2, 13)      # entry hall (8 tall)
carve(18, 19, 14, 21)     # 2-tall  x  8 long
carve(16, 19, 22, 37)     # 4-tall  x 16 long
carve(12, 19, 38, 69)     # 8-tall  x 32 long
carve(4, 19, 70, 133)     # 16-tall x 64 long — the great cavern
carve(18, 19, 134, 134)   # door passage (1 wide, 2 tall)
carve(12, 19, 135, 149)   # out: 8-tall x 15
carve(16, 19, 150, 157)   # out: 4-tall x 8
carve(18, 19, 158, 161)   # out: 2-tall x 4
carve(12, 19, 162, 177)   # flag hall

# mossy dirt floor under every walkway
put(20, 2, 177, 'G')
put(21, 2, 177, 'G')

# spiker trenches (2 deep — hop back out, spiker keeps you honest)
carve(20, 21, 52, 54)
carve(20, 21, 112, 114)

# =========================== entry hall ================================
mark(17, 4, 'A'); mark(17, 6, 'H'); mark(17, 8, 'N')   # caterpillar cluster
mark(17, 11, 'C')

# ================= floor route: coins double per chamber ================
mark(18, 18, 'C')                                       # 1
mark(17, 28, 'C'); mark(17, 30, 'C')                    # 2
for r, c in ((16, 48), (16, 49), (17, 48), (17, 49)):   # 4
    mark(r, c, 'C')
for c in range(118, 122):                               # 8
    mark(17, c, 'C'); mark(18, c, 'C')
mark(19, 32, 'E')                                       # 1 goomba in C4
mark(19, 45, 'E'); mark(19, 60, 'E')                    # 2 in C8
mark(19, 80, 'E'); mark(19, 99, 'E'); mark(19, 122, 'E')# 3 in the cavern
mark(17, 66, 'H')                                       # cherry at C8's end
mark(21, 52, 'C'); mark(21, 54, 'C'); mark(20, 53, 'X') # trench 1
mark(20, 112, 'X'); mark(20, 113, 'Y'); mark(20, 114, 'j') # trench 2: backup gold key + red gem, spiker-guarded
# a doubled pipe pair in C8 (1-tall and 2-tall), standing on the floor
put(19, 42, 42, 'P')
put(18, 57, 57, 'P'); put(19, 57, 57, 'p')

# ================= great cavern: doubling monuments =====================
MON = [(74, 1, '1'), (77, 2, '2'), (81, 4, '4'), (88, 8, '8')]
for c, h, ch in MON:
    for r in range(20 - h, 20):
        put(r, c, c, ch)
# ...and SIXTEEN lies down: a 16-tile inlay along the cavern floor
put(20, 96, 111, '6')
mark(17, 74, 'C'); mark(16, 77, 'C'); mark(14, 81, 'C')
mark(10, 88, 'Y')                                       # gold key on the 8
# (elevators between 4->8 and 8->up are in movingPlatforms)
mark(9, 85, 'F')

# ceiling ledge from the upper elevator, then the halving coin trail
put(7, 95, 100, 'I')
put(8, 103, 106, 'I')
put(8, 109, 112, 'I')
for c in range(109, 113):                               # 8 coins (2x4)
    mark(6, c, 'C'); mark(7, c, 'C')
put(8, 115, 117, 'I')
mark(6, 115, 'C'); mark(6, 116, 'C'); mark(7, 115, 'C'); mark(7, 116, 'C')  # 4
put(8, 120, 121, 'I')
mark(6, 120, 'C'); mark(6, 121, 'C')                    # 2
put(9, 125, 127, 'I')
mark(7, 125, 'C')                                       # 1
mark(7, 127, 'J')                                       # blue gem: the series' limit
mark(10, 104, 'F')

# mirrored stalactite / stalagmite pairs (decor with light platforming)
put(4, 92, 92, 'S'); put(5, 92, 92, 'S')
put(18, 102, 102, 'S'); put(19, 102, 102, 'S')
put(4, 128, 128, 'S'); put(5, 128, 128, 'S')
put(17, 128, 128, 'S'); put(18, 128, 128, 'S'); put(19, 128, 128, 'S')

# ============================ gold door ================================
mark(19, 134, 'L')                                      # fills the 1-wide passage

# ================== halving out-corridors + flag hall ==================
for c in (138, 141, 144, 147):                          # 4
    mark(18, c, 'C')
mark(19, 140, 'E')
mark(18, 152, 'C'); mark(18, 155, 'C')                  # 2
mark(18, 153, 'N')                                      # banana
mark(18, 159, 'C')                                      # 1
arc = [(17, 165), (16, 166), (15, 167), (16, 168), (17, 169)]
for r, c in arc:
    mark(r, c, 'C')

# =============================== emit ==================================
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles6_out.txt', 'w') as f:
    f.write(out + '\n')

for lo, hi in ((0, 120), (100, 180)):
    print(f'cols {lo}-{hi-1}:')
    print('   ' + ''.join(str((c // 10) % 10) for c in range(lo, hi)))
    print('   ' + ''.join(str(c % 10) for c in range(lo, hi)))
    for r, ln in enumerate(lines):
        print(f'{r:2d} ' + ln[lo:hi])
    print()
