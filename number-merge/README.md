# NUMBER MERGE

Drop numbers into a jar. Two of the same touch, they add up. Fill the jar past
the line and it's over. Asher drew all thirteen numbers.

Play: `http://localhost:3131/number-merge/` (registered in the kid hub as
`number-merge`).

    0  1  2  4  8  16  32  64  128  256  512  1024  2048

## One rule, and it is real arithmetic

**Two blocks merge when their sum is a number on the ladder.** That is the whole
game, and everything follows from it:

| | |
|---|---|
| `1 + 1 = 2` | merges |
| `2 + 2 = 4` | merges — every pair of equals doubles, which is what a ladder of powers of two means |
| `1 + 2 = 3` | no. Three is not on this ladder, so a One and a Two just sit next to each other |
| `128 + 0 = 128` | merges, and nothing changes. Zero adds nothing, so it disappears into whatever it lands on |
| `0 + 0 = 0` | merges. Two Zeros are still nothing |
| `2048 + 2048` | 4096, past the top. Both leave, and that is the game you are playing for |

Zero is the interesting one. It is not a hazard and it is not a wildcard — it is
the additive identity, and it behaves like one. Dropping a Zero on a 128 leaves
a 128, one Zero lighter. It scores nothing, breaks no chain, and never hurts
you. It is also the smallest ball, and about one drop in fourteen.

**The score is the exact total of every block you have ever assembled.** A merge
pays what it made and nothing else — no chain multiplier, on purpose. Four Ones
become an Eight and score `2 + 2 + 4 = 8`. Eight Ones score 24. That makes the
number in the corner a fact rather than a videogame number, which for this
player is the better toy. Chains still exist and still get celebrated; they just
pay in bigger blocks rather than in bonus points.

## The art is the point, and so is the label

The blocks are Asher's drawings from the `draw` tool, not redrawn, not
recoloured, not smoothed. He worked out his own notation without being asked:
**each digit is painted in that digit's Numberblocks colour, and the digits are
arranged inside each other.**

    0 blank   1 red   2 orange   3 yellow   4 green   5 blue   6 purple   8 pink

So Sixteen is a purple Six under a red One. Thirty-Two is an orange Two inside a
yellow Three. Five Hundred Twelve is a blue Five holding a red One and an orange
Two. Every digit of every power of two up to 2048 is covered by that palette,
and he was consistent across all thirteen.

It is a real system. It is also completely unreadable unless you already know
it — which is why **the numeral goes on the ball**: outlined, and upright
whatever the ball is doing. The colours say *which* block this is at a glance;
the numeral says what it is *worth*. Neither alone is enough.

The ink is picked by the paint's brightness, not fixed: white on his red, green,
blue and purple, dark on the pale yellow of Thirty-Two and the pale pink of
Eight, where a white numeral reads weakly even outlined. Orange sits at 0.68
perceived brightness and stays white. Zero's ball is blank white, so it takes
dark ink too.

Zero is the exception it deserves to be. He drew a blank page for it, which is
the correct picture, so it gets no sprite at all: an empty white ball with a
dashed edge and a dark `0`.

Two kinds of drawing are shown two ways, which is the one real art decision:

- **one colour** (1, 2, 4, 8) — the block *is* the number, so it fills the circle
  edge to edge and gets cropped round, and it may spin freely.
- **more than one** (16 and up) — the arrangement *is* the number, so it is kept
  whole on a pale wash of its own colour, and it only ever wobbles. Sixteen
  never lands upside down.

## Rebuilding the art

`source/` holds his drawings, one per rung, named `<value>-<the original save>`.
The value comes from the filename, not from the order he drew them: he made
Eight before Four and Thirty-Two after Two Thousand Forty-Eight, so the ladder is
the arithmetic, not the session.

    node tools/extract_art.mjs

It crops each drawing to its content, makes the paper transparent, throws away
stray specks, and writes `art/blocks.json` — the ladder, with each rung's value,
word, colour, and the drawing it came from. `art/` is derived and gets cleared on
every run; `source/` is the permanent record and is checked in, so this game
rebuilds from nothing but the repo.

**Two of the drawings carry a single stray cell out at the right-hand edge** — a
slip of the finger. Cropping to the bounding box of *all* the paint made 128
three times too wide. The tool finds every connected blob and drops any smaller
than 2% of the biggest, which fixed both without touching the pictures.

## Demo images

`demo.html` is a showcase page, not the game — it puts every number on screen at
once using the real renderer and the real solver, rendered at 3x for sharing.
Three views:

- **the sheet** (`?raw=sheet`) — all thirteen at a uniform size with their number
  words, plus a strip underneath at true relative scale, because the doubling is
  the game
- **the jar** (`?raw=jar`) — one of each rung, hand-placed and then genuinely
  settled. 2048 and 1024 can't sit side by side (248 + 210 is wider than the 428
  jar), so they stack and the small numbers fill the crevices
- **as he drew them** (`?raw=drawn`) — the thirteen drawings on paper, at their
  own aspect ratios, with no ball around them and no numeral over them. The only
  view where you can actually see the notation, so **the colour key lives on this
  one**

All three are checked in at `../docs/number-merge-the-thirteen.png`,
`../docs/number-merge-full-jar.png` and
`../docs/number-merge-as-he-drew-them.png` — outside the served game tree on
purpose, so they don't land in every kid device's offline cache. To regenerate,
open `/number-merge/demo.html` and use the save buttons, or render headless:

    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
      --headless=new --disable-gpu --force-device-scale-factor=1 \
      --user-data-dir=/tmp/p1 --window-size=2700,2820 \
      --screenshot=the-thirteen.png \
      "http://localhost:3131/number-merge/demo.html?raw=sheet"

`?raw=` strips the page to one canvas at true pixel size, so a
window-sized screenshot is exactly the image. Use a fresh `--user-data-dir` per
render; reusing one makes the second Chrome attach to the first and hang.
Headless Chrome may not exit after writing the file — wait for the PNG, then kill
it.

The showcase jar settles with `world.step()` rather than `game.step()`. Two
reasons: no two blocks in it share a value so nothing could double anyway, and
the Zero would otherwise be absorbed on contact — the rule working correctly,
but it would leave the picture a rung short.

## It has to start

The ladder is arithmetic and the numeral is painted on the ball, so a missing
manifest and missing sprites degrade to plain coloured discs with the right
numbers on them — entirely playable. `fallbackBlocks()` in `config.js` builds
that ladder from nothing but `config.js` itself, colouring each rung with its
first digit's paint, which is the colour he actually used most on eleven of the
thirteen (Sixteen and 2048 are the two where a later digit dominated).

This exists because the first version could hang on `LOADING…` for ever with no
clue why, and the device he plays on has no console to check:

- `await fetch('./art/blocks.json').then((r) => r.json())` had no catch. The
  service worker answers a cache miss it cannot fetch with a **plain-text** 503
  body, so `.json()` throws, the module dies mid-evaluation, and the LOADING line
  never comes down.
- `new Image()` with only `onload`/`onerror` never settles if a request stalls
  rather than failing, so one hung sprite held up the whole game. Every sprite
  now has a 6s deadline.
- A syntax error in the module could not be reported by anything inside the
  module. There is now a **boot watchdog in a classic script** that replaces the
  LOADING line after 9s with `COULD NOT START`, the path, and tap-to-reload.

`node test_number_merge.mjs` plays a whole game on the fallback ladder and
asserts it has the same rungs, values and words as the real one, so it cannot
quietly drift.

## Playing

| | |
|---|---|
| point / drag | aim |
| tap / click | drop |
| ← → | aim (tap steps, hold glides) |
| space | drop |
| M | mute |
| R | new game |

Touch, canvas fit and the loop are byte-for-byte the same as `fruit-merge`, which
is already what he plays on the iPad and the phone.

## How it fits together

    js/config.js    every number worth arguing about — the ladder, the rule, sizes, scoring
    js/physics.js   circles in a box: position-based, no DOM, no randomness
    js/game.js      the rules: dropping, merging, chains, losing
    js/render.js    everything you see, numerals included
    js/sfx.js       small WebAudio noises
    index.html      the shell: art loading, canvas fit, input, the loop

`physics.js`, `game.js`, and `config.js` touch no browser API, so the test
harness plays whole games in Node:

    node test_number_merge.mjs

127 checks. Beyond what the fruit harness covers, it pins down the arithmetic:
that every pair of equals doubles and no unequal pair above Zero ever merges,
that a Zero leaves the block it lands on exactly where it was and worth exactly
what it was, that a column of nine Zeros collapses to one, that a Zero on a One
leaves a One and not a Two, that four Ones score 8 and eight Ones score 24, and
that two 2048s leave the jar for 4096.

## Losing, and the bounce that wasn't a loss

You lose by *leaving* a block above the line. Each block carries its own clock,
and the clock has three states:

| where it is | the clock |
|---|---|
| below the line | cleared — falling past the line on the way down costs nothing |
| above it, settled | counts |
| above it, still flying | **held** — neither counted nor cleared |

The hold is the part that took a bug report. The solver resolves a deep overlap
in one step, which can squeeze a block clean out of the jar at thousands of
pixels a second; it flies far above the rim, and the round trip easily takes
longer than the 1.2s grace. Timing that flight as if the block had been
*abandoned* up there ended the game on a bounce — which is what it looked like,
because the renderer clips above the rim, so the ball popped up, vanished, and
the jar was declared full. Measured over 40 bot games before the fix: 38 of 40
losses were a block that was not at rest, one of them 5764px above the canvas.

Two things had to be true at once, and each one is easy to get wrong on its own:

- **"Settled" cannot mean "at rest."** That is the trap `fruit-merge` fell into
  and documented: a full jar is never quite still, so a rest requirement makes
  the game unloseable. The measured gap is enormous, so the threshold is not
  delicate — a settled full pile moves at 2px/s median and 16px/s at the 95th
  centile, while a squeezed-out block leaves at hundreds to thousands.
  `dangerSettleSpeed` is 260.
- **The hold must not be a reset.** If flying *cleared* the clock, a block that
  popped up and settled back above the line would restart every time it was
  jostled, and the jar could never fill.

After the fix, 60 bot games: 60 of 60 losses were a genuinely settled block, none
were in flight, and none of the games became unloseable.

The squeeze-out itself is also capped now (`RULES.maxSpeed`, 2600px/s, applied
after the bounce term so the cap actually holds). Falling the full height of this
jar is worth about 1740px/s, so the clamp never touches normal motion. It does
not eliminate ejection — blocks still leave the jar on about 0.4% of frames and
reach ~1100px above the canvas, down from 3500 — but they no longer cost you the
game, and they come back.

## What the harness caught

**A test that passed for the wrong reason.** The original loss test stacked nine
equal blocks in a column and asserted the game ended. It did end — but not
because the jar was full. Nine overlapping blocks explode apart, fly above the
rim, and time out up there; the pile they actually settle into is three rows and
sits well below the line. That test *was* the bounce bug, asserted as correct
behaviour, and it went green for exactly as long as the bug existed. Fixing the
bug turned it red, which is the only reason it was caught. It now builds a real
overfull jar — one of every rung from One up, so nothing can merge it back down
and the total area exceeds what the jar holds — and there are separate tests for
a high pop-up not ending the game and for all three states of the clock.

**A column of Zeros only collapses if the Zeros actually touch.** The first
version of that test spaced nine Zeros 40px apart with 34px diameters, expected
one left, and got three. The game was right: Zeros resting in separate columns
never contact each other, so nothing merges. The test was wrong, and the fix was
to drop them all down one line — which is also the honest thing to tell a player
about Zero. It cleans up what it lands on, not the whole jar.

Inherited from `fruit-merge`, and still true here: fixed physics steps only (a
leftover sliver of a frame underflows and freezes the pile), and per-block
time-above-the-line rather than "is anything resting above the line" (a full jar
is never quite still, so a rest requirement makes the game unloseable).
