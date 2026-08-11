# The Grinch — a Whoville adventure

A side-scroller based on the 1966 animated special, built on the kid-games
side-scroller engine. Play the Grinch (or Max) through four worlds that follow
the story: down Mount Crumpit, through Whoville's chimneys, back up the
mountain, and home again on Christmas morning to light every house and grow
your heart three sizes.

All art is procedural canvas drawing (see `js/characters.js` for the
pose-based Grinch/Max figures); music is an original WebAudio loop.

## Run

```bash
npm run dev        # serves on http://localhost:8123
npm test           # headless playtest bot: completes all 4 worlds
```

Or play it from the kid-games hub at `/grinch/`.

## Controls

- Arrows / WASD — sneak & jump (walking IS sneaking; hold Shift to run)
- Down/S/X — pick up & place crates
- Q — switch between the Grinch and Max
- M — music on/off
- 1-4 on the title screen — jump to a world

`poses.html` is a dev page showing every animation pose at large scale.
