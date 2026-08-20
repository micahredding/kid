#!/usr/bin/env python3
"""Generate World 1-7 The Cloud Elevators (Sky Heights theme).

A mountain climbed by machinery instead of jumping. Every band of the
mountain is a 6-row terrace separated from the next by a sheer 5-row
cliff — taller than any jump (apex ~4.1 tiles) — so the only ways up are
ELEVATORS (cabs that cycle between two decks) and LADDERS.

Safety is structural, not incidental:
  * the bottom of the world is solid rock; nothing is a death pit
  * every deck's span sits over the deck below it, so ANY fall lands on a
    floor at most one band (6 rows) down — checked by drop_report() below
  * elevator shafts are bridged at the top by one-way planks, so the deck
    reads as continuous and you cannot walk into an open shaft
  * ladders are one-way tiles too: you walk over them and only descend by
    deliberately pressing down

Route (directions alternate, so each deck gets traversed):
  valley -E1-> A -L1(left)-> B -E2(right)-> C -L2(left)-> D -ferry+right->
  E3 -> E -left-> E4 -> cloud island -right across the sky-> summit ridge
"""

WIDTH = 176
ROWS = 46

grid = [[' '] * WIDTH for _ in range(ROWS)]

def put(r, c1, c2, ch):
    for c in range(c1, c2 + 1):
        assert 0 <= r < ROWS and 0 <= c < WIDTH, (r, c)
        grid[r][c] = ch

def mark(r, c, ch):
    put(r, c, c, ch)

def fill(r1, r2, c1, c2, ch):
    for r in range(r1, r2 + 1):
        put(r, c1, c2, ch)

# ============================ the massif ================================
# Each band of rows is solid rock from face_col rightward. Consecutive
# faces step ~17 cols right per 6 rows up, which leaves a 5-row cliff
# between each terrace and the shelf above it.
BANDS = [
    (38, 43, 59),    # valley band
    (32, 37, 76),
    (26, 31, 93),
    (20, 25, 110),
    (14, 19, 127),
    (8, 13, 144),
]
for r1, r2, face in BANDS:
    fill(r1, r2, face, WIDTH - 1, 'M')

fill(44, 45, 0, WIDTH - 1, 'M')       # bedrock: the floor of the world
fill(0, 45, 0, 1, 'M')                # left wall

# stepped summit: 1-tile risers all the way to the flag
put(7, 158, WIDTH - 1, 'M')
put(6, 164, WIDTH - 1, 'M')
put(5, 170, WIDTH - 1, 'M')
fill(0, 4, 174, WIDTH - 1, 'M')       # the peak itself, and the right wall

# ============================== decks ===================================
# 'M' where the deck rests on the mountain, 'W' where it is a catwalk
# bolted to the face over open air.
put(43, 2, 58, 'M')                   # valley floor

put(37, 40, 58, 'W'); put(37, 59, 75, 'M')      # deck A
put(31, 42, 75, 'W'); put(31, 76, 92, 'M')      # deck B
put(25, 60, 92, 'W'); put(25, 93, 109, 'M')     # deck C
put(19, 62, 87, 'W'); put(19, 97, 109, 'W'); put(19, 110, 126, 'M')  # deck D (ferry gap 88-96)
put(13, 98, 126, 'W'); put(13, 127, 143, 'M')   # deck E

# ===================== elevator landings (one-way) ======================
# The cab's top stop is the deck row; a one-way plank bridges the shaft so
# the walkway is continuous but the cab can still lift you up through it.
put(37, 56, 58, 'I')    # E1 top  (valley -> A)
put(25, 90, 92, 'I')    # E2 top  (B -> C)
put(13, 124, 126, 'I')  # E3 top  (D -> E)

# ============================== ladders =================================
# Ladder tiles run from the upper deck's floor row down to one row above
# the lower deck, so climbing out leaves you standing on the upper deck.
def ladder(col, top_row, bottom_row):
    for r in range(top_row, bottom_row + 1):
        mark(r, col, '=')

put(38, 6, 13, 'I')     # the lookout ledge L0 climbs to — five rows up,
                        # one more than a jump clears, so the ladder is the way
ladder(10, 38, 42)      # L0: tutorial, valley -> lookout ledge
ladder(42, 31, 36)      # L1: A -> B
ladder(87, 19, 24)      # L2: C -> D
ladder(100, 25, 30)     # L3: C -> the crystal pocket (dead end, treasure)

# ===================== the pocket inside the mountain ===================
fill(27, 30, 96, 106, ' ')   # hollowed out of the massif; row 31 is its floor
                             # (level.js draws a `hollows` rect behind it so it
                             #  reads as inside the mountain, not a hole to the sky)
mark(30, 104, 'J')           # blue gem
mark(30, 98, 'N')            # banana
for c in (100, 101, 102):
    mark(29, c, 'C')

# ========================= the sky bridge ===============================
# Cloud platforms (one-way) from the elevator's cloud island rightward to
# the summit shelf. Every gap is either jumpable or ferried, and anything
# you drop off lands on deck E, six rows down.
put(7, 100, 110, 'c')        # cloud island — E4's top stop
put(8, 112, 113, 'c')        # low steps: every hop is one or two tiles
put(7, 115, 119, 'c')
put(8, 121, 122, 'c')
put(6, 124, 128, 'c')        # ferry boarding cloud
put(6, 138, 142, 'c')        # last cloud before the summit shelf

# ============================ collectibles ==============================
# Coins mark the route: a little trail toward whatever lift comes next.
def coins(row, cols):
    for c in cols:
        mark(row, c, 'C')

# valley
mark(42, 5, 'A')                      # apple
coins(37, [7, 8, 12, 13])             # on the lookout ledge
coins(42, [16, 18, 20])
coins(42, [30, 32])
coins(42, [50, 52, 54])               # trail into E1's shaft
mark(42, 26, 'E')                     # goomba on the wide valley floor
put(40, 30, 34, 'I')                  # jumpable plank + coin above the floor
mark(39, 32, 'C')

# deck A — walk left to L1
coins(36, [54, 52, 50, 48])
mark(36, 46, 'H')                     # cherry
coins(36, [44, 43])
coins(35, [62, 64, 66])               # side trail right, toward the cliff
mark(35, 68, 'j')                     # red gem tucked against the rock face

# deck B — walk right to E2
coins(30, [44, 46, 48])
mark(30, 58, 'N')                     # banana
coins(30, [64, 66, 68, 70])
mark(30, 74, 'E')                     # goomba, mid-deck and far from any edge
coins(30, [80, 82, 84, 86, 88])       # trail into E2
mark(28, 56, 'F')                     # flyguy out over the drop

# deck C — short walk left to L2, or right to the pocket ladder
coins(24, [88, 86, 84])
coins(24, [94, 96, 98])               # trail right, toward L3 and the pocket
coins(23, [104, 106])

# deck D — long haul right, across the ferry gap
mark(18, 64, 'j')                     # red gem at the far left dead end
coins(18, [66, 68, 70])
coins(18, [74, 76, 78])
coins(18, [98, 100, 102])
mark(18, 106, 'H')                    # cherry
coins(18, [112, 114, 116, 118, 120, 122])   # trail into E3
mark(18, 84, 'F')                     # flyguy patrolling the ferry landing

# deck E — walk left to E4
coins(12, [122, 120, 118])
coins(12, [114, 112, 110])
mark(12, 108, 'A')                    # apple
coins(12, [106, 104])

# the sky
coins(6, [102, 104, 106, 108])
coins(6, [116, 118])
coins(5, [125, 127])
coins(5, [139, 141])
mark(4, 130, 'F')                     # flyguy over the ferry crossing
coins(7, [146, 148, 150])             # up the summit steps, at walking height
coins(7, [154, 156])
coins(6, [160, 162])
mark(5, 166, 'J')                     # blue gem, one step below the flag

# ======================= fall-safety verification =======================
SOLID = set('MW')
ONEWAY = set('I=c')
STAND = SOLID | ONEWAY

def surfaces(col):
    """Rows in this column whose top face can be stood on."""
    out = []
    for r in range(ROWS):
        if grid[r][col] in STAND and (r == 0 or grid[r - 1][col] not in SOLID):
            out.append(r)
    return out

def first_surface_below(col, row):
    for r in range(row + 1, ROWS):
        if grid[r][col] in STAND and grid[r - 1][col] not in SOLID:
            return r
    return None

def drop_report(limit=8):
    """Every place you can step off an edge, and how far that drops you.

    Edge-based on purpose: you never fall through a floor, you fall off the
    side of one. For each standable tile, look at the neighbouring column;
    if it is open at head height you can walk off there.
    """
    bad = []
    for c in range(WIDTH):
        for r in surfaces(c):
            if r == 0:
                continue                          # top of a boundary wall
            for dc in (-1, 1):
                n = c + dc
                if not (0 <= n < WIDTH):
                    continue
                if grid[r][n] in STAND or grid[r - 1][n] in SOLID:
                    continue                      # floor continues, or a wall
                below = first_surface_below(n, r - 1)
                if below is None:
                    bad.append((c, r, dc, 'falls out of the world'))
                elif below - r > limit:
                    bad.append((c, r, dc, f'{below - r}-row drop'))
    return bad

problems = drop_report()
print(f'fall check: {len(problems)} problem column(s)')
for c, r, dc, why in problems[:40]:
    print(f"   col {c} row {r} stepping {'left' if dc < 0 else 'right'}: {why}")

# ============================== emit ====================================
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
import os, sys
dest = sys.argv[1] if len(sys.argv) > 1 else 'tiles7_out.txt'
with open(dest, 'w') as f:
    f.write(out + '\n')
print(f'wrote {dest}')

for lo, hi in ((0, 62), (56, 118), (112, 176)):
    print(f'cols {lo}-{hi-1}:')
    print('   ' + ''.join(str((c // 10) % 10) for c in range(lo, hi)))
    print('   ' + ''.join(str(c % 10) for c in range(lo, hi)))
    for r, ln in enumerate(lines):
        print(f'{r:2d} ' + ln[lo:hi])
    print()
