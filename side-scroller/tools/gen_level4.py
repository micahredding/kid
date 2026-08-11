#!/usr/bin/env python3
"""Generate World 1-4 Jungle.

Three lanes: leafy canopy (I-branches + bamboo trunks, rows 4-8), jungle
floor (rows 15-16), and two underworld pockets — a croc gorge (61-79,
crossed by moving lily pads) and a root cave under the temple pit (151-175).
A mossy pyramid (121-146) hides a chamber gated by a silver door; the key
hangs in the canopy. Flag in a clearing at col 222.
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

# ============================ floor lane ================================
ground(0, 60)          # clearing + deep jungle west of gorge
ground(80, 150)        # between gorge and temple pit
ground(176, WIDTH - 1) # final stretch

# start clearing
for c in (6, 8, 10):
    mark(12, c, 'C')
mark(12, 14, 'A'); mark(12, 18, 'H'); mark(12, 22, 'N')   # early fruit cluster

# ? blocks + floor decor west of gorge
put(13, 46, 50, 'B'); mark(13, 47, '?'); mark(13, 49, '?')
mark(11, 47, 'C'); mark(11, 49, 'C')
put(13, 56, 57, 'P'); put(14, 56, 57, 'p')                 # bamboo stump
mark(13, 54, 'E')
mark(12, 36, 'C'); mark(12, 42, 'C')

# deep jungle floor (80-120)
put(13, 88, 89, 'P'); put(14, 88, 89, 'p')  # bamboo stump (hoppable)
mark(13, 93, 'E')
mark(13, 96, 'D'); mark(13, 97, 'D')                        # crates
mark(13, 118, 'E')
mark(12, 84, 'C'); mark(12, 103, 'C'); mark(12, 112, 'C')

# final stretch floor
mark(13, 210, 'E')
arc = [(12, 212), (11, 213), (10, 214), (11, 215), (12, 216)]
for r, c in arc:
    mark(r, c, 'C')
mark(12, 219, 'A')
mark(13, 186, 'C'); mark(13, 192, 'C')

# ========================== croc gorge (61-79) ==========================
put(22, 61, 79, 'G'); put(23, 61, 79, 'G'); put(24, 61, 79, 'G')
mark(21, 66, 'X'); mark(21, 70, 'X')                        # crocs
mark(21, 63, 'C'); mark(21, 68, 'C'); mark(21, 72, 'C')
mark(18, 64, 'C')
# exit stairs (east end)
put(20, 74, 75, 'S'); put(21, 74, 75, 'S')
put(18, 76, 77, 'S'); put(19, 76, 77, 'S'); put(20, 76, 77, 'S'); put(21, 76, 77, 'S')
put(16, 78, 79, 'S'); put(17, 78, 79, 'S'); put(18, 78, 79, 'S'); put(19, 78, 79, 'S'); put(20, 78, 79, 'S'); put(21, 78, 79, 'S')
# (lily-pad moving platforms cross at rows 12-13 — defined in movingPlatforms)

# ============================ canopy lane ===============================
# tree 1: climb up from the clearing
put(12, 25, 28, 'I')
put(9, 29, 31, 'I')
put(8, 32, 33, 'P')
for r in range(9, 13):      # trunk stops at row 12: 2-tile walk-under clearance
    put(r, 32, 33, 'p')
# westward branch run
put(7, 36, 39, 'I');  mark(5, 37, 'C')
put(5, 43, 46, 'I');  mark(3, 44, 'C')
mark(3, 41, 'F')
put(7, 50, 53, 'I');  mark(5, 51, 'C')
put(6, 58, 61, 'I');  mark(4, 59, 'C')
# over the gorge
put(5, 66, 69, 'I');  mark(3, 67, 'C')
put(7, 74, 77, 'I');  mark(5, 75, 'C')
# tree 2
put(8, 80, 81, 'P')
for r in range(9, 13):      # 2-tile walk-under clearance
    put(r, 80, 81, 'p')
put(6, 84, 87, 'I');  mark(4, 85, 'C')
put(4, 91, 94, 'I');  mark(2, 92, 'y')                      # silver key on high branch
mark(2, 97, 'F')
put(6, 98, 101, 'I'); mark(4, 99, 'C')
put(5, 106, 109, 'I'); mark(3, 107, 'C')
put(5, 113, 116, 'I'); mark(3, 114, 'J')                    # blue gem

# ===================== temple pyramid (121-146) =========================
for i in range(8):                                          # left steps up
    c = 121 + 2 * i
    for r in range(14 - i, 15):
        put(r, c, c + 1, 'S')
for r in range(7, 15):                                      # plateau
    put(r, 137, 140, 'S')
mark(5, 138, 'C'); mark(5, 140, 'C')
put(10, 141, 143, 'S')                                      # floating descent blocks
put(12, 144, 145, 'S')
# hidden chamber + corridor (carved out of the mass)
for r in range(12, 15):
    put(r, 128, 138, ' ')
for r in range(13, 15):
    put(r, 139, 146, ' ')
mark(14, 143, 'l')                                          # silver door
mark(13, 129, 'C'); mark(13, 133, 'C')
mark(13, 131, 'j')                                          # red gem
mark(13, 135, 'N')                                          # banana
# canopy bridge east of the plateau
put(7, 146, 149, 'I')

# ====================== temple pit + root cave (151-175) ================
put(22, 151, 175, 'G'); put(23, 151, 175, 'G'); put(24, 151, 175, 'G')
mark(17, 153, 'C')
mark(21, 154, 'H')                                          # cherry
mark(21, 157, 'C'); mark(21, 161, 'C'); mark(21, 164, 'C')
mark(21, 160, 'E'); mark(21, 166, 'E')
# exit stairs (east end)
put(20, 170, 171, 'S'); put(21, 170, 171, 'S')
put(18, 172, 173, 'S'); put(19, 172, 173, 'S'); put(20, 172, 173, 'S'); put(21, 172, 173, 'S')
put(16, 174, 175, 'S'); put(17, 174, 175, 'S'); put(18, 174, 175, 'S'); put(19, 174, 175, 'S'); put(20, 174, 175, 'S'); put(21, 174, 175, 'S')
# canopy over the pit
put(7, 153, 156, 'I'); mark(5, 154, 'C')
put(5, 161, 164, 'I'); mark(3, 162, 'C')
put(7, 169, 172, 'I')
mark(4, 166, 'F')

# ======================= final canopy run + descent =====================
put(6, 176, 178, 'I')
put(5, 180, 183, 'I'); mark(3, 181, 'C')
put(4, 188, 191, 'I'); mark(2, 189, 'C')
mark(2, 194, 'F')
# giant stairsteps back down to the clearing
put(8, 196, 197, 'S');  put(9, 196, 197, 'S')
put(10, 198, 199, 'S'); put(11, 198, 199, 'S')
put(12, 200, 201, 'S'); put(13, 200, 201, 'S')
# (no lower step: the last drop to the floor is a safe 3-tile hop, and a
#  bottom step would pinch the floor lane under the slab above)

# =============================== emit ==================================
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles4_out.txt', 'w') as f:
    f.write(out + '\n')

for lo, hi in ((0, 120), (112, 232)):
    print(f'cols {lo}-{hi-1}:')
    print('   ' + ''.join(str((c // 10) % 10) for c in range(lo, hi)))
    print('   ' + ''.join(str(c % 10) for c in range(lo, hi)))
    for r, ln in enumerate(lines):
        print(f'{r:2d} ' + ln[lo:hi])
    print()
