# FRUIT MERGE

Drop fruit into a jar. Two of the same kind touch, they become the next one up.
Fill the jar past the line and it's over. Asher drew all eleven fruits.

Play: `http://localhost:3131/fruit-merge/` (registered in the kid hub as
`fruit-merge`).

## The art is the point

The fruits are Asher's drawings from the `draw` tool, cropped out of
`kid/prints/` — not redrawn, not recoloured, not smoothed. The ladder is in the
order he drew them, which is why it ends on the big green one he made last.

    cherry › blueberry › lime › plum › orange › green apple ›
    peach › coconut › strawberry › pineapple › watermelon

`tools/extract_art.mjs` builds `art/` from the prints: it crops each drawing to
its content, makes the paper transparent, skips blanks and duplicate saves, and
writes `art/fruits.json` — the ladder, with each fruit's name, colour, and the
drawing it came from.

    node tools/extract_art.mjs            # the 2026-08-21 fruit session
    node tools/extract_art.mjs 2026-09    # a later session

`art/` is derived and gets cleared on every run. The drawings in `kid/prints/`
are the permanent record. **To rename a fruit, edit `NAMES` in the tool and
re-run** — editing `art/fruits.json` by hand works until the next rebuild.

Two kinds of drawing are shown two ways, which is the one real art decision
here:

- **one colour** — the block *is* the fruit, so it fills the circle and gets
  cropped round. A red square becomes a cherry and loses nothing.
- **more than one** — the arrangement is the picture (the pineapple's crown, the
  plum's stem), so it is kept whole on a pale disc of its own colour, and it
  only ever wobbles — never tumbles crown-down.

## Playing

| | |
|---|---|
| point / drag | aim |
| tap / click | drop |
| ← → | aim (tap steps, hold glides) |
| space | drop |
| M | mute |
| R | new game |

## How it fits together

    js/config.js    every number worth arguing about — jar, sizes, scoring
    js/physics.js   circles in a box: position-based, no DOM, no randomness
    js/game.js      the rules: dropping, merging, chains, losing
    js/render.js    everything you see
    js/sfx.js       small WebAudio noises
    index.html      the shell: art loading, canvas fit, input, the loop

`physics.js`, `game.js`, and `config.js` touch no browser API, so the test
harness plays whole games in Node:

    node test_fruit_merge.mjs

It checks the art manifest, that fruit falls and settles and stays in the jar,
that same fruit merges and different fruit doesn't, cascades, the drop cooldown
and aim clamping, a 40-fruit pile for escapes and overlap, the loss condition
(and that merely *falling* past the line is not a loss), that a seed replays
identically, that a bot's game ends on its own, and that 30fps, 60fps, and
144fps all settle to the same place.

## Two things the harness caught

**A leftover sliver of a frame froze the pile.** The loop stepped whatever time
was left over after the whole fixed steps. At 30fps that remainder was 3.5e-18s
— small enough that the position change underflowed to zero, so reading the
velocity back off the movement set it to zero, every frame. Fruit fell at a
crawl. Fixed steps only now, with the remainder carried into the next frame.

**The game was unloseable.** Ending only when a fruit was *resting* above the
line sounds right and isn't: a full jar is never quite still, so the condition
never fired — a bot played 300 seconds, 858 drops, and never lost. Each fruit
now carries its own time-above-the-line, which also means falling past the line
costs nothing.
