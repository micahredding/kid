#!/usr/bin/env python3
"""Generate the extended World 1-2 Underground tile map."""

WIDTH = 232
ROWS = 25

# Existing World 1-2 rows (0-16), verbatim from level.js
existing = [
    'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
    'S                                                                                                 S',
    'S                                                                                                 S',
    'S                                                                                                 S',
    'S                                                                                                 S',
    'S                                                                                                 S',
    'S                                                                                                 S',
    'S                       C  C  C             C  C                    F                              S',
    'S                      BBBBBBBB           ?B?B?              BBB                                  S',
    'S                                                                                                 S',
    'S          ?                A   N    E     F        E        I I I       C  C  C  C        j        S',
    'S     E          BB                                                   BBBBBBBBBB        X         S',
    'S                            D D            BB         BB                                         S',
    'S              PP                PP                PP             D D                              S',
    'SGGGGGGGGGG  GGppGGGGGGGG  GGGGGGppGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGG',
    'SGGGGGGGGGG  GGppGGGGGGGG  GGGGGGppGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGG',
    'SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
]

# Strip the old right-hand wall on interior rows so the cave continues
for r in range(1, 14):
    row = existing[r].rstrip()
    assert row.endswith('S'), r
    existing[r] = row[:-1]

grid = [[' '] * WIDTH for _ in range(ROWS)]
for r, row in enumerate(existing):
    for c, ch in enumerate(row):
        grid[r][c] = ch

def put(r, c1, c2, ch):
    for c in range(c1, c2 + 1):
        assert 0 <= r < ROWS and 0 <= c < WIDTH, (r, c)
        grid[r][c] = ch

def mark(r, c, ch):
    put(r, c, c, ch)

# --- Early fruit cluster: cherry joins the original apple+banana so the
# caterpillar can transform near the start (needs 3 fruits) ---
mark(10, 24, 'H')

# --- Cave shell: ceiling, right wall, bottom, and rock under the old section ---
put(0, 0, WIDTH - 1, 'S')
for r in range(0, 25):
    put(r, 231, 231, 'S')
put(24, 0, WIDTH - 1, 'S')
for r in range(17, 24):
    put(r, 0, 101, 'S')

# --- Entry corridor: floor continues at rows 14-15 (cols ~98-114) ---
put(14, 95, 114, 'G')
put(15, 95, 114, 'G')
for r in range(16, 24):
    put(r, 95, 114, 'S')
for c in (106, 108, 110):
    mark(12, c, 'C')
mark(12, 112, 'A')

# --- Stone staircase up: 8 steps, 2 wide, 1 rise each (cols 115-130) ---
for i in range(8):
    c = 115 + 2 * i
    for r in range(13 - i, 14):
        put(r, c, c + 1, 'S')
    for r in range(14, 24):
        put(r, c, c + 1, 'S')
for i in (1, 3, 5, 7):
    mark(11 - i, 115 + 2 * i, 'C')

# --- Plateau at the top (surface row 6); solid to bottom = lower cave's left wall ---
for r in range(6, 24):
    put(r, 131, 136, 'S')
mark(4, 132, 'C')
mark(4, 134, 'C')
mark(4, 136, 'H')   # cherry at the split point

# --- Shaft down (cols 137-142), coins on the way ---
mark(10, 139, 'C')
mark(14, 139, 'C')
mark(18, 139, 'C')
mark(12, 141, 'C')
mark(16, 141, 'C')
mark(20, 141, 'C')

# --- Lower cave floor rows 22-23 (cols 137-201) ---
put(22, 137, 201, 'G')
put(23, 137, 201, 'G')

# --- Mid shelf rows 12-13 (cols 143-201): catches missed jumps, walkable ---
put(12, 143, 201, 'S')
put(13, 143, 201, 'S')
for c in (150, 158, 166, 174, 182, 190):
    mark(10, c, 'C')

# --- Upper route (above the shelf) ---
put(4, 140, 142, 'I');  mark(2, 141, 'C')
put(5, 146, 149, 'S')
for c in (146, 147, 148, 149):
    mark(3, c, 'C')
put(3, 153, 155, 'I');  mark(1, 154, 'C')
# (moving platform crosses cols ~157-167, defined in movingPlatforms)
put(4, 168, 171, 'S');  mark(2, 169, 'J')   # blue gem over the island
mark(3, 174, 'F')                            # flyguy in the gap
put(5, 176, 178, 'I')
put(6, 182, 184, 'I')
put(5, 188, 191, 'S')
mark(3, 189, 'C'); mark(3, 191, 'C')
put(7, 195, 197, 'I');  mark(5, 196, 'C')

# --- Lower gallery contents (open rows 14-21 under the shelf) ---
for c in (146, 148, 150):
    mark(21, c, 'C')
mark(21, 154, 'H')                           # cherry
mark(20, 157, 'E')                           # goomba
put(20, 160, 164, 'B'); mark(20, 161, '?'); mark(20, 163, '?')
mark(18, 161, 'C'); mark(18, 163, 'C')
mark(21, 168, 'D')                           # pushable block
mark(21, 172, 'X')                           # spiker
mark(21, 176, 'N')                           # banana
mark(21, 180, 'C'); mark(21, 182, 'C')
mark(19, 186, 'j')                           # red gem, jump to grab
mark(20, 192, 'E')                           # goomba
mark(21, 196, 'C'); mark(21, 198, 'C')

# --- Canyon steps: climb back up (cols 202-207) ---
for r in range(20, 24):
    put(r, 202, 203, 'S')
for r in range(18, 24):
    put(r, 204, 205, 'S')
for r in range(16, 24):
    put(r, 206, 207, 'S')

# --- Final stretch at the original floor height (cols 208-230) ---
# 1-tile lip at 208-209 so the climb out of the canyon is all single rises
put(14, 210, 230, 'G')
put(15, 208, 230, 'G')
for r in range(16, 24):
    put(r, 208, 230, 'S')
arc = [(12, 212), (11, 213), (10, 214), (11, 215), (12, 216)]
for r, c in arc:
    mark(r, c, 'C')
mark(12, 219, 'A')
mark(12, 222, 'E')

# --- Emit ---
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles2_out.txt', 'w') as f:
    f.write(out + '\n')

print('cols 94-231 preview:')
print('   ' + ''.join(str((c // 10) % 10) for c in range(94, 232)))
print('   ' + ''.join(str(c % 10) for c in range(94, 232)))
for r, ln in enumerate(lines):
    print(f'{r:2d} ' + ln[94:232])
