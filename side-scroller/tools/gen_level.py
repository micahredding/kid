#!/usr/bin/env python3
"""Generate the extended World 1-1 tile map for the kid-games side-scroller."""

WIDTH = 232
ROWS = 25

# Existing World 1-1 rows (0-16), verbatim from level.js
existing = [
    '                                                                                                                        ',
    '                                                                                                                        ',
    '                                                                                                                        ',
    '                                                                                           C                            ',
    '                                                                                           C                            ',
    '                                                                                          B B                           ',
    '                                                                                          B B                           ',
    '                                                                                          B B                           ',
    '                                                                       C                  B B                           ',
    '                                C  C  C                         F      C                  B B                           ',
    '               ?    B?B?B                        BBBB                  C                  B B                           ',
    '                                                                                          B B                           ',
    '    C          A   H                   E       I I I I         C  C  C       D D          B B          J                ',
    '         E                                                   B?B?B?B     Y     E    X     B B     E                     ',
    '                         PP                PP                                             B B         L                 ',
    '  GGGGGGGGGGGGGGGG  GGGGppGGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
    '  GGGGGGGGGGGGGGGG  GGGGppGGGGGGGGGGGGGGGGppGGGGGGGGGGGGGGGGGGGGGGGGGGG   GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
]

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

# --- Early fruit cluster: banana joins the original apple+cherry so the
# caterpillar can transform near the start (needs 3 fruits) ---
mark(12, 23, 'N')

# --- Segment A: surface ground continues past the old flag ---
put(15, 110, 153, 'G')
put(16, 110, 153, 'G')

# --- Segment B: long staircase up, 8 steps, 2 cols wide, 1 tile rise each ---
for i in range(8):
    c = 132 + 2 * i
    for r in range(14 - i, 15):
        put(r, c, c + 1, 'B')
for i in (1, 3, 5, 7):   # coins on alternating steps
    mark(12 - i, 132 + 2 * i, 'C')

# --- Segment C: plateau at the top (surface row 7); the route splits here ---
for r in range(7, 15):
    put(r, 148, 153, 'G')
mark(5, 149, 'C')
mark(5, 151, 'C')
mark(5, 153, 'A')   # apple at the split point

# --- Shaft down (cols 154-159): open all the way to the tunnel floor ---
mark(12, 156, 'C')
mark(16, 156, 'C')
mark(20, 156, 'C')

# --- Tunnel: floor rows 23-24 (cols 154-207), roof rows 15-18 (cols 160-201) ---
put(23, 154, 207, 'G')
put(24, 154, 207, 'G')
for r in range(15, 19):
    put(r, 160, 201, 'G')

# --- Sky route (above the roof) ---
put(5, 157, 159, 'I');  mark(3, 158, 'C')
put(6, 163, 166, 'B')
for c in (163, 164, 165, 166):
    mark(4, c, 'C')
put(4, 170, 172, 'I');  mark(2, 171, 'C')
# (moving platform crosses cols ~174-185, defined in movingPlatforms)
put(5, 185, 188, 'B');  mark(3, 186, 'J')   # blue gem over the island
mark(4, 191, 'F')                            # flyguy in the gap
put(6, 192, 194, 'I')
put(7, 197, 199, 'I');  mark(5, 198, 'C')
# coins along the roof-top path
for c in (166, 174, 182, 190, 196, 200):
    mark(13, c, 'C')

# --- Underground tunnel contents (open rows 19-22) ---
for c in (163, 165, 167):
    mark(21, c, 'C')
mark(21, 170, 'H')                           # cherry
mark(21, 174, 'E')                           # goomba
put(21, 178, 182, 'B'); mark(21, 179, '?'); mark(21, 181, '?')
mark(19, 179, 'C'); mark(19, 181, 'C')
mark(21, 186, 'D')                           # pushable block
mark(19, 190, 'j')                           # red gem
mark(21, 194, 'N')                           # banana
mark(21, 197, 'E')                           # goomba
mark(21, 199, 'C'); mark(21, 201, 'C')

# --- Canyon steps: climb out of the tunnel back to the surface (cols 202-207) ---
for r in range(21, 25):
    put(r, 202, 203, 'G')
for r in range(19, 25):
    put(r, 204, 205, 'G')
for r in range(17, 25):
    put(r, 206, 207, 'G')

# --- Final sunny stretch on the surface (cols 208-231) ---
# 1-tile lip at 208-209 so the climb out of the canyon is all single rises
put(15, 210, WIDTH - 1, 'G')
put(16, 208, WIDTH - 1, 'G')
arc = [(13, 212), (12, 213), (11, 214), (12, 215), (13, 216)]
for r, c in arc:
    mark(r, c, 'C')
mark(13, 219, 'A')
mark(13, 223, 'E')

# --- Fill solid dirt below any solid surface (keeps old pits open & deadly) ---
for c in range(0, 154):
    if grid[15][c] in ('G', 'p'):
        for r in range(17, 25):
            if grid[r][c] == ' ':
                grid[r][c] = 'G'
for c in range(208, WIDTH):
    for r in range(17, 25):
        if grid[r][c] == ' ':
            grid[r][c] = 'G'

# --- Emit as JS string literals ---
lines = [''.join(row) for row in grid]
for ln in lines:
    assert len(ln) == WIDTH
out = '\n'.join("      '" + ln + "'," for ln in lines)
with open('/private/tmp/claude-501/-Users-micahredding-Dropbox-1-Notational/700d11b4-0fff-49e0-8f96-7950235e1aa7/scratchpad/tiles_out.txt', 'w') as f:
    f.write(out + '\n')

# ASCII preview of the extension for eyeballing
print('cols 118-231 preview:')
print('   ' + ''.join(str((c // 10) % 10) for c in range(118, 232)))
print('   ' + ''.join(str(c % 10) for c in range(118, 232)))
for r, ln in enumerate(lines):
    print(f'{r:2d} ' + ln[118:232])
