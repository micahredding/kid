Original prompt: is there a way to make the draw tool have a black background

## 2026-08-02

- Requested behavior clarified as modes: `draw black` and `draw white`.
- Plain `draw`, `color`, and `colour` remain white for backward compatibility.
- Browser implementation now carries the selected background through the live canvas, drawing log, and saved PNG.
- Added deterministic browser-test hooks: `render_game_to_text` reports draw mode/background/cursor/pen/color/cell count; `advanceTime` is a no-op because this tool has no timed simulation.
- Browser tests passed for `draw black`, `draw white`, and plain `draw`: commands enter the expected mode, drawing stamps cells, screenshots match the requested backgrounds, saved PNG corner pixels match the live canvas, and no console errors appeared.
- Screenshots were visually inspected at `output/draw-modes/black.png` and `output/draw-modes/white.png`.
- PR #1 merged and deployed on mini4 at commit `883a296`.
- Final read-only browser verification against the live LAN service passed for both background modes with no console errors.
- TODO: none.

## 2026-08-11

Original prompt: extend the side-scroller so World 1-1 continues past the old flag — long stairsteps of blocks to climb, then routes above and below ground. Nothing too hard.

- World 1-1 nearly doubled (120 → 232 cols, 17 → 25 rows); goal flag moved from col 108 to col 226. The old gold door is now mid-level (hop it or use the key).
- New stretch: 8-step brick staircase up to a plateau, where the route splits — sky path (one-way platforms, brick islands, a swinging moving platform, flyguy, blue gem) or a drop-shaft into an underground tunnel (coins, ? blocks, pushblock, red gem, two goombas). Missed sky jumps land safely on the tunnel roof, which is itself a walkable third path.
- Both routes converge at a canyon of 2-tile stairsteps climbing back to a sunny finale.
- Engine tweaks: level defs may set `goalRow` (flag ground) and `undergroundRow` (dark cave backdrop below that line); sky fill in `drawBackground` now screen-space; solid dirt fills below the original ground so the taller camera view shows earth, with old pits still open and deadly.
- `playtest.mjs`: headless Node harness that stubs the DOM and drives real engine physics with a hold-right/auto-jump bot. Verified: tunnel route, sky route, and canyon exit all complete to the flag; World 1-2 unchanged.
- Deployed to mini4 working tree (serving live at :3131); not committed.

## 2026-08-11 (later)

Original prompt: extend level 2 the same way; also allow switching player characters at any time with a good key.

- World 1-2 Underground extended 102 → 232 cols, 17 → 25 rows; goal moved col 95 → 226. Old right wall removed; the cave continues: stone staircase up to a plateau, then an upper route (stone islands, one-way platforms, moving platform, flyguy, blue gem) or a drop-shaft into a tall lower gallery (coins, ? blocks, pushblock, spiker, red gem, two goombas). A walkable mid-shelf catches missed upper-route jumps. Canyon steps climb back to a finale at the original floor height. Level 2's shallow-trench pits kept non-deadly (stone bottom preserved).
- Character switching: Q cycles characters mid-game (player.switchCharacter — feet-anchored, per-character state reset, tile fit-check so you can't switch into a wall; white particle burst on switch; HUD shows "Q: NAME" next to LIVES). Title-screen selection unchanged.
- Both canyon exits (L1 + L2) got a 1-tile lip so the final climb is single rises — the 2-tile ledge caused a wall-slide bounce loop when jumping while hugging the wall.
- playtest.mjs extended: covers both levels' routes plus a Q-cycling run; all new routes complete. Deployed to mini4 working tree (live at :3131); not committed.

## 2026-08-11 (caterpillar fix)

Original prompt: caterpillar needs fruits to transform; the extension pushed fruits later — fix that.

- Transform rule changed: caterpillar now needs 3 fruits (CONFIG.player.fruitsToTransform), not every fruit in the level — the extensions spread fruits across branching routes, which made the old all-fruits rule effectively uncompletable mid-level.
- Each level got a third fruit in its opening cluster: banana at col 23 (L1, joining apple 15 + cherry 19), cherry at col 24 (L2, joining apple 28 + banana 32) — so kids can become a butterfly right at the start, like before.
- HUD progress counter now reads n/3. Later fruits remain as bonus points/icons.
- test_caterpillar.mjs verifies: fruit placement, needed=3, and collect-3 → press C → butterfly in both levels.

## 2026-08-11 (World 1-3 Castle + level select)

Original prompt: make a cool third world; also let the launch screen jump to a level by number.

- World 1-3 Castle (232 cols x 25 rows, unused castle theme): approach with fruit cluster + silver key pedestal -> moat (falling in = secret dungeon entrance via a tunnel under the gatehouse; I-bridge and a vertical elevator platform cross/escape it) -> silver-key gatehouse door -> great hall (pillars, chandelier coin bonuses, ? blocks, goombas, flyguy) with a wide I-platform ladder up through a roof hole -> battlements (merlons, blue gem, flyguy) -> courtyard where all routes converge (pipe, cherry, gold key pedestal, drop-hole + exit staircase to the dungeon) -> full-height gold gate (door is the only way through; backup gold key in the dungeon prevents soft-lock) -> tower with zigzag I-platform climb -> keep rooftop finale, flag at col 222 (goalRow 5). Dungeon corridor runs beneath the whole castle (banana, ? block, pushblock, spiker, red gem, goombas).
- Title screen: number keys 1-N jump straight to that level; hint text added (also documents Q character switch).
- test_castle.mjs: waypoint-following bot; route A (moat->dungeon->key->gate->tower->flag) completes end-to-end; remaining segments (silver key, hall, ladder, roof, battlements, courtyard drop) verified in isolated runs. Worlds 1-2 regression clean.
- Ladder platforms widened to 4 tiles after the bot exposed a slide-off frustration point.

## 2026-08-11 (World 1-4 Jungle)

Original prompt: make a 4th world, a jungle.

- New jungle theme in themes.js: green sky, earth + bright grass, bamboo (P/p), mossy stone (S), leafy branches (I), crates (D), croc-colored spikers.
- World 1-4 Jungle (232x25): three stacked lanes. Canopy: leafy branch runs between hanging bamboo trees (climb on-ramp at tree 1; silver key on a high branch; blue gem; 4 flyguys), rejoinable at the temple. Floor: bamboo stumps, ? blocks, crates, goombas. Underworld pockets: a croc gorge (spikers at the bottom, safe, exit stairs; two moving lily pads cross above) and a root cave under the temple pit (cherry, coins, goombas, exit stairs).
- Mossy temple pyramid mid-level: staircase up, plateau, floating-block descent, and a hidden chamber (red gem + banana) behind a silver door — key hangs in the canopy, linking the lanes.
- Finale: giant stairsteps down from the canopy to a sunny clearing, coin arc, flag at col 222. No lethal pits anywhere in this world.
- Verified: floor route completes end-to-end (gorge, crocs, pyramid, pit, cave, flag); tree-climb, chamber (door+gem), and every novel canopy hop pass scripted checks; worlds 1-3 regression clean. Design fixes from testing: tree trunks hang with 2-tile walk-under clearance, no goomba camping the canopy on-ramp, canopy descent doesn't pinch the floor lane, floating block widened.
- Title screen level select now shows 1-4.

## 2026-08-11 (The Grinch)

Original prompt: new game based on the 1966 Grinch animated movie — animation (very important), game mechanics, implementation, delivery through a local browser.

- New game `grinch/`, seeded from the side-scroller engine, registered in the hub (`kid/server.mjs` + `kid/index.html`) as `grinch`.
- Animation is the centerpiece: `js/characters.js` draws the Grinch and Max as path-based canvas figures with pose parameters — the slinky tiptoe sneak (walking IS sneaking; Shift runs), squash & stretch anchored at the feet, forward lean rotated at the hips, finger-wiggle, sly/wide/happy eyes, a grin that spreads on every collect, Santa suit + flopping hat, Max's antler + ear that lag vertical motion on a spring. `poses.html` is a dev showcase of every pose at large scale.
- Four story worlds (programmatic level builders in `level.js`): W1 Down Mount Crumpit (descending snowy terraces), W2 Whoville (walk-through houses with working chimney drops into living rooms; Cindy Lou Who speech bubbles), W3 The Climb (ascending terraces, ravine with moving snow ledge), W4 Christmas Morning (dawn palette; return presents to 5 dark GiftHouses — each lights up, the HUD heart grows a size, goal feast unlocks only when all are lit; finale card: "his heart grew three sizes").
- Reskins: coins→wrapped presents (4 wrap colors), goombas→mice, flyguys→who-birds (now with bounded patrol range), spikers→frost-lumps, goal flag→sleigh/feast. Themes: 3 night palettes + dawn gradient, stars/moon/mountains/Whoville-silhouette parallax, ambient snowfall, snow-capped tiles.
- Original WebAudio sneaky-pizzicato loop + pop/chime/fanfare sfx (M mutes); story cards between worlds; ?level=N deep link.
- Engine lesson re-learned: 2-tile rises cause the wall-slide bounce loop — every climb in W1/W3 got 1-tile lips (same fix as the castle world).
- test_grinch.mjs (hold-right bot + scripted segments): all 4 worlds complete, chimney drop lands in the living room and exits the door, W4 goal stays locked until all 5 houses are lit, presents carry across worlds, Q-switching completes W1. ALL CHECKS PASSED.
- Visually verified via headless Chrome screenshots (title, W1, W2, W4, pose sheet).
## 2026-08-11 (visual overhaul)

Original prompt: overall stylistic enhancement to backgrounds and world — more detailed trees etc., no gameplay changes.

- Rendering only; all changes in level.js draw functions. Gameplay/physics untouched (full bot regression clean across all 4 worlds).
- Backgrounds: sky gradients per theme; sun with glow (grassland/jungle); moon, stars, and a distant castle skyline (castle); stalactite silhouettes + glowing crystals (underground); hanging canopy layers + distant trunks (jungle); two-depth hills with tree silhouettes, fluffier clouds, raised hills/bushes so they show above the ground line; cave backdrop is now a gradient.
- Tiles: deterministic per-tile hash details (no flicker) — turf caps + grass blades only on true surfaces (buried dirt is plain + speckled), staggered brick mortar, chiseled stone blocks with cracks + moss on jungle/castle tops, cylindrical pipe/bamboo shading with edge-aware trunk highlights + node rings, one-way platforms drawn as planks/leafy branches, beveled ? blocks with rivets.
- Decorations (non-colliding): flowers/ferns, glowing mushrooms + stalactites (underground), swaying vines from jungle branches, hanging roots under dirt ceilings, arched windows deep in castle masonry, weeds in flagstones. Goal flag now waves with a pole highlight.
- shot.html added: headless-Chrome screenshot harness (?level=&col=&row=) used to visually verify all four worlds; 12 screenshots reviewed.
## 2026-08-12 (draw: any background color)

Original prompt: make an option to set any background color for the canvas, within the draw UI itself.

- Draw-mode background is now a full color object (any palette color), not just black/white.
- In-draw picker: Tab then B arms a background pick — 1-9/0 chooses from the same palette as the pen picker, B again gives black. Pen color is restored after Tab+B so picking a background never shifts the pen. Any other key cancels and acts normally (plain letters still type characters).
- Status bar shows a background swatch + name alongside the pen swatch; hint line documents Tab B 1-0.
- REPL entry generalized: "draw <color>" accepts any color expression ("draw purple", "draw red + blue"); "draw black"/"draw white" unchanged; a non-color argument ("draw cat") still falls through to the evaluator.
- Cursor visibility generalized: when the pen color is near the background color, the cursor uses a contrasting gray (was a white-on-white special case). Typed characters contrast by background luminance.
- Saved PNGs (print) and the drawing log entry carry the chosen background; log background is now {name, rgb} instead of a string.
- Tested with a stub-DOM harness driving the real inline script: 17 checks (entry commands, picker, cancel paths, stamping, logging, status bar) all pass.
- Note: Asher is now on a different MacBook Air — the passive ip/device stamps in logs will show a new IP for him from ~2026-08-12 on.

## 2026-08-11 (World 1-5 Numberland)

Original prompt: a 5th level with math built into the landscape (not math problems as barriers) — Fibonacci, powers of two, squares, powers of ten, at full difficulty.

- New numberland theme: numberblock tiles 0-9 in show colors; renderer draws faces on structure tops and self-labeling numerals (1-wide towers label their height, multi-column structures label w×h, the Hundred labels 100); rainbow parallax arc.
- The math IS the terrain: Fibonacci towers 1,1,2,3,5,8,13 (1-wide so unit blocks count true; the hop rises are ALSO Fibonacci 0,1,1,2,3 — and the final +5 outgrows your jump, so an elevator platform carries you, with a blue gem crowning the 13) -> powers-of-two sky run (gaps double 1,2,4,8; coin clusters double 1,2,4,8; the 8-gap needs the ferry platform; red gem + banana beyond) -> square-number garden (grounded 2×2/3×3/4×4/5×5 numberblock squares with 4- and 9-coin arrays, two lethal pits, spiker, flyguy, gold key on the 5×5) -> ten-frame vault underground (2×5 coin frames ×2, backup gold key, cherry, goombas, exit stairs) -> gold gate -> pi meadow (coin stacks 3,1,4,1,5) -> THE HUNDRED: a monumental 10×10 block with a scaffold climb, goomba on the summit, flag on top.
- Full difficulty: two lethal pits, forced Fibonacci climb (the towers wall the route; elevator is the assist), key gate with no-soft-lock backup, 79 coins, 7 goombas, 3 flyguys, spiker.
- Verified: bot routes complete (squares+key, gate+Hundred to level_complete, Fibonacci climb, vault) and every hop class passes scripted checks (sky gaps, stairs, scaffold, key grabs). Two real bugs found and fixed by testing: the vault stairwell was sealed by an uncarved rock plug, and pit 2 originally dumped players against the 3×3 with no runway. Worlds 1-4 regression clean.

## 2026-08-11 (World 1-6 The Doubling Cave)

Original prompt: build the doubling cave idea.

- New crystalcave theme (deep blue stone, crystal ledges, glowing mushrooms, stalactite silhouettes) with numberblock tiles.
- The doubling IS the architecture: chamber heights double 2-4-8-16 rows while lengths double 8-16-32-64 cols; the way out HALVES back (8-4-2 corridors) to the flag hall. Carved from solid rock.
- Great cavern: monument numberblocks 1, 2, 4, 8 (gold key on the 8) and a SIXTEEN lying down — a 16-tile floor inlay you walk along (new label rule: 1-row strips label their length). Two doubling elevators carry you where the next power outgrows your jump (4->8, 8->ceiling). A halving coin trail (8, 4, 2, 1 coins on crystal ledges) runs under the ceiling to the blue gem — the series' end. Floor coins double per chamber (1, 2, 4, 8). Two 2-deep spiker trenches (backup gold key + red gem in the second). Gold door guards the halving exit.
- Doubled details: pipe pair (1-tall, 2-tall), goombas per chamber 1-2-3, mirrored stalactite/stalagmite pairs.
- Verified: chambers route, monument climb, door + halving exit to level_complete, all 5 trail hops + trench exits + stalagmite + both key grabs + gem scripted; elevator ranges checked; worlds 1-5 regression clean. Testing caught the ceiling being too close to the original trail (bonk-truncated jumps) and a 16-pillar that sealed the cavern — hence the lying-down 16.
## 2026-08-12 (draw: autosave — survive browser close)

Original prompt: closing the browser mid-drawing lost the picture entirely; add autosave (with a beacon as belt-and-suspenders).

- Draw mode now autosaves every 4s while dirty, and last-gasp flushes via navigator.sendBeacon on pagehide and on visibilitychange→hidden — closing the tab, quitting the browser, or switching away mid-draw no longer loses the drawing (worst case: the last <4s).
- Each draw session gets a drawingId. Autosave posts (a) incremental history actions to /log as drawing_actions entries (seq-numbered, only what's new since the last flush), and (b) a PNG snapshot to /save-drawing with autosaveId — the server keeps ONE prints/autosave-<who->-<id>.png per session, overwritten each time.
- Clean exit (Escape) works as before — full drawing+history log entry (now tagged with drawingId) and the timestamped print — and passes finalOf so the server deletes that session's autosave file. An orphaned autosave-*.png in prints/ therefore means exactly one thing: a drawing that was never properly exited.
- History's 20k cap now decrements the flushed-counter when it trims, so increments stay aligned; server logs only a session's first autosave write, not every 4s overwrite.
- Tests: stub-DOM harness grew to 30 checks (beacon payloads, incremental seq, idle no-op, listener cleanup, finalOf linkage); live-server curl test verified autosave create/overwrite → final → cleanup, and id sanitization.

## 2026-08-19 (World 1-7 The Cloud Elevators)

Original prompt: a level of elevators and ladders — hard to fall down, ride elevators between levels on screen and move from one to another to find the way through, leading up into the clouds and the heights of the mountains.

- New mechanic — LADDERS (`=`). Up/down climb at 2.2px/frame, gravity off, and left/right deliberately do nothing while climbing so a small child holding a direction can't sidestep off into the air; Space is the way to let go. Ladder tiles are one-way, so a ladder let into a walkway is a floor you walk over, never a trapdoor — you only go down it by pressing down. A last-rung assist sets you on the deck when you release up on the top rung, instead of leaving you hanging a body-length below it with no way sideways. Touch gets a dedicated ▲/▼ pad above the d-pad, wired to `i`/`k` rather than arrow-up/down (those double as jump and grab, and a climb button that also jumps is worse than none).
- New entity — ELEVATOR. A cab that travels at constant speed between two deck rows and dwells at each end (unlike the sinusoidal MovingPlatform), drawing its own shaft rails, cable and head sheave so you can see where it goes before you ride it. Stops are given as rows in the level def, so a level's decks and its lifts can't drift apart. Each top stop is bridged by a one-way plank: the cab lifts you up through it, and the walkway above stays walkable.
- New skyheights theme + world: a mountain of six-row terraces separated by five-row cliffs — taller than the ~4.1-tile jump apex — so the lifts are the only way up. Rock terraces where the deck sits on the mountain, bolted wooden catwalks where it juts out over the drop. Sky deepens as you climb, three parallax ranges sink below you as you rise, snow line at row 28, alpine turf below row 34. Route alternates direction so every deck gets walked: valley →E1→ deck A →ladder(left)→ B →E2(right)→ C →ladder→ D →plank ferry→ E3 → E →E4→ cloud island → cloud chain + cloud-raft ferry → summit ridge steps → flag. Side trips: a lookout ledge, a hollow chamber inside the massif (ladder down, blue gem), a dead-end catwalk with a red gem.
- Falling is safe by construction, not by luck: the bottom of the world is solid, and every deck's span sits over the deck below, so any fall lands on a floor at most one band (6-7 rows) down with the lift right there. `tools/gen_level7.py` and `test_heights.mjs` both scan every standable edge in the map and assert the worst drop ≤ 8 rows and that nothing drops out of the world.
- Two real engine bugs found by building this and fixed for every world: (1) footing on one-way platforms flickered — the vertical collision scan ignored the row the feet rest ON, so standing on a plank sank a pixel and snapped back forever, flapping `onGround` at 30Hz; (2) a moving platform sliding past someone standing on a deck shoved them sideways, and once nudged a pixel outside its pickup window it could never pick them up again — platforms now carry you only when they are what's holding you up, so you step aboard a ferry instead of being scooped off the deck.
- Verified: `test_heights.mjs` — 51 checks, all passing (ladder up/down/hold/let-go/walk-over, all four characters climbing, all four elevators boarded by standing still, the cliff refusing a sprint-jump, the full 17-leg route to the flag with 10 lives intact, the hollow chamber round trip, the flag unreachable from the valley by holding right + jump for 90s, and the fall-depth scan). Worlds 1-1..1-6 regression clean: same 9 bot completions before and after. Screenshots inspected at valley, shaft, deck C ladders, deck D ferry, cloud bridge, chamber, summit, and the touch overlay.

## 2026-08-21 (Fruit Merge — Asher's drawings)

Original prompt: Asher wants to create a fruit merge game; he drew a set of "fruit drawings" for the game art (13 saves in `kid/prints/`).

- New game `fruit-merge/`, registered in the hub (`kid/server.mjs` + `kid/index.html`). Suika-style: drop fruit into a jar, two of a kind merge into the next one up, fill past the line and the jar's full. Eleven fruits, all his.
- **The art is his, unretouched.** `tools/extract_art.mjs` crops each drawing in `kid/prints/` to its content, makes the paper transparent, skips blanks and a duplicate save, and writes `art/NN-name.png` + `art/fruits.json` (name, colour, palette, source drawing). 13 saves → 11 fruits. The ladder is the order he drew them, so the big green one he finished with at 4am is the watermelon at the top. `art/` is derived and rebuildable; the prints stay canonical. Re-runnable with a session prefix for the next batch of drawings.
- One art decision worth naming: a one-colour block *is* the fruit, so it fills the circle and gets cropped round (a red square becomes a cherry, losing nothing); a drawing with several colours is a composition (the pineapple's crown, the plum's stem), so it's kept whole on a pale disc of its own colour and only wobbles — never tumbles crown-down. The first pass tinted the disc with the fruit's own colour and drew the block on top of it, which made his drawing invisible.
- `js/physics.js`: position-based circle solver (predict, relax overlaps 8×, read velocity back off the movement), area-weighted mass, contact friction for spin, squash on hard landings. Piles of 40 settle without jitter. No DOM, no `Math.random`, no clock — so `config.js`/`physics.js`/`game.js` play whole games in Node.
- `test_fruit_merge.mjs` (63 checks): art manifest, monotonic sizes, falling and settling, same-fruit merges and different-fruit non-merges, a 4-cherry cascade, the two-watermelon finale, drop cooldown and aim clamping, a 40-fruit pile checked for escapes and overlap, the loss condition (and that *falling* past the line is not a loss), seed-identical replays, a bot game that ends on its own, and 30/60/144fps settling to the same place.
- Two real bugs the harness caught, both invisible at 60fps. (1) The loop stepped the leftover sliver of time after the whole fixed steps; at 30fps that remainder was 3.5e-18s, small enough that the position delta underflowed to zero, so reading velocity back off it zeroed the velocity every frame — fruit fell at a crawl. Fixed steps only, remainder carried forward, plus a guard in `World.step`. (2) Ending the game when a fruit was *resting* above the line made it unloseable: a full jar is never quite still, so a bot played 300s and 858 drops without losing. Each fruit now carries its own time-above-the-line.
- Also tuned from playtest evidence: chain multiplier capped at ×5 and reset on each drop (uncapped cascades scored 71k), the drop line moved into the jar's mouth so the HUD band can't cover the held fruit, HUD painted after the fruit so an overflowing jar can't bury the score, and an arrow-key *tap* now steps 20px (holding still glides — a tap alone got one frame, ~7px).
- Title card credits him by name and teaches the rule by showing it: two of his cherries = one of his blueberries. A bottom strip charts the whole ladder, dimmed past what you've reached.
- Verified live at :3131 in Chrome: all 11 sprites eyeballed on screen at once, real clicks and space/arrow keys drive drops and merges, chain banner + score flashes + particles + shake all fire, game-over panel reads clean. `sw-manifest.json` picks up all 18 files, so it works offline like the others.

## 2026-08-21 (Fruit Merge — demo images)

Original prompt: make a "demo image" featuring all the custom images he drew on screen at the same time.

- `fruit-merge/demo.html` — a showcase page in the spirit of `grinch/poses.html`. Two views, both using the real renderer and the real solver so nothing is mocked up: **the sheet** (all eleven at uniform size with names and merge arrows, plus a true-relative-scale strip underneath) and **the jar** (one of each tier, hand-placed then genuinely settled).
- Building the jar view surfaced a real geometric fact worth recording: the two biggest fruits *cannot* sit side by side — 249 + 204 exceeds the 428 jar — so a naive placement leaves them arching against opposite walls with dead space beneath, which is correct physics but a poor picture. The committed plan stacks them instead and tucks the small fruit into the crevices.
- `?raw=sheet` / `?raw=jar` strips the page to a single canvas at true pixel size, so a window-sized headless screenshot *is* the image — no cropping, no browser chrome, no JPEG. Rendered 2700x2280 and 1440x2400 into `docs/`, which sits outside the served game tree on purpose: PNGs inside `fruit-merge/` would join the precache manifest and add ~860KB to every kid device's offline cache for no gameplay benefit.
- Two gotchas found and written into the README: headless Chrome hangs if two renders share a `--user-data-dir` (the second attaches to the first), and the service worker serves game pages cache-first by pathname — so a new page like `demo.html` needs a server restart (to enter the manifest and roll the worker) or a second reload before edits show up.

## 2026-08-21 (Number Merge — Asher's numberblocks)

Original prompt: same game as Fruit Merge, but with numbers and numberblocks — 0 (an exception), 1, then the powers of two to 2048 — using his own drawings, labelled with the number.

- New game `number-merge/`, registered in the hub (`kid/server.mjs` + `kid/index.html`). Thirteen rungs: `0 1 2 4 8 16 32 64 128 256 512 1024 2048`. Engine, canvas fit, touch input and loop are the `fruit-merge` ones — `index.html` differs only in the manifest it loads, the names, and one sound line, so the iPad/iPhone behaviour is identical by construction rather than by re-testing.
- **The merge rule is one sentence of real arithmetic: two blocks merge when their sum is a number on the ladder.** Everything falls out of it. Every pair of equals doubles (that is what a ladder of powers of two *is*). `1 + 2 = 3` does not merge, because Three is not on this ladder. And Zero — the exception in the prompt — needed no special case at all: `n + 0 = n` is on the ladder, so a Zero merges into whatever it touches and leaves it untouched. It is the additive identity and it behaves like one. `physics.js` grew a `canMerge` predicate parameter for this; "same tier" was the solver assuming a rule that is not the rule.
- Zero's block is placed at the *surviving* block's position, not the pair's midpoint, and inherits its velocity and rest state: nothing happened, so nothing should move. It scores 0, doesn't advance biggest-reached, and doesn't start a chain. Rare in the drop pool (~1 in 14) and the smallest ball.
- **No chain multiplier, deliberately** — a departure from `fruit-merge`. Score is the value of the block made, so the number in the corner is the exact total of every block assembled: four Ones score `2+2+4 = 8`, eight Ones score 24. For this player a score that is a fact beats a score that is a videogame number. Chains still exist, still celebrate, and still pay in bigger blocks.
- **His drawings have a notation he invented unprompted: each digit painted in that digit's Numberblocks colour, digits arranged inside each other.** `0` blank, `1` red, `2` orange, `3` yellow, `4` green, `5` blue, `6` purple, `8` pink — consistent across all thirteen, and every digit of every power of two up to 2048 is covered. Sixteen is a purple Six under a red One; Thirty-Two an orange Two inside a yellow Three; 512 a blue Five holding a red One and an orange Two. It is a real system *and* unreadable without the key, which settles the labelling question: the numeral goes on the ball (white, dark-outlined, held upright whatever the ball is doing) because the colours say which block and the numeral says what it is worth. Neither alone is enough.
- Zero keeps its exception in the art too. He drew a blank page for it, which is the correct picture, so it gets **no sprite**: an empty white ball, dashed edge, dark `0`. `art/blocks.json` carries a `blank: true` row with `file: null`; the image loader resolves it to null on purpose.
- **The source drawings are checked into `number-merge/source/`, not read from `kid/prints/`** — a change from `fruit-merge`, which reads prints that are gitignored and single-homed on mini4. This game rebuilds from nothing but the repo, and these thirteen drawings now have an offsite copy. Filenames carry the value (`0512-drawing-asher-….png`) because the value is not the draw order: he made Eight before Four and Thirty-Two after 2048. Duplicate re-saves of 256 and 2048 were dropped, and the second "4" in the source folder turned out to be `fruit-merge`'s watermelon.
- `tools/extract_art.mjs` gained **connected-component speck removal**. Two drawings carry a single stray cell at the far right edge; cropping to the bounding box of all the paint made 128 736px wide instead of 256 and 2048 832px instead of 240, wrecking both aspect ratios. It now finds every blob and drops any under 2% of the biggest, and prints what it dropped. A test asserts no sprite ends up freakishly wide.
- Sizes: 13 rungs at ratio 1.18 from radius 17, so 2048 lands at the same 248px the watermelon was — just over half the 428 jar, and 2048 + 1024 still can't sit side by side.
- `test_number_merge.mjs` — 101 checks. Beyond the fruit harness: the arithmetic itself (every pair of equals doubles; *no* unequal pair above Zero ever merges; a Zero merges with every rung; 2048+2048 goes past the top for 4096), Zero's behaviour end to end (the block it lands on doesn't move, isn't rescored, doesn't advance best, doesn't chain; a column of nine Zeros collapses to one; a Zero on a One leaves a One, not a Two), exact scores for 4-One and 8-One cascades, and that a settled pile leaves no mergeable pair overlapping and ignored.
- One test caught being wrong rather than the game: nine Zeros spaced 40px apart with 34px diameters left three, not one. Correct — Zeros resting in separate columns never touch. Rewritten as a single column, and it is the honest thing to say about Zero: it cleans up what it lands on, not the jar.
- `demo.html` + `docs/number-merge-the-thirteen.png` (2700×2820) and `docs/number-merge-full-jar.png` (1440×2400), same `?raw=` trick as fruit-merge. The showcase jar settles with `world.step()` not `game.step()`, because otherwise the Zero is absorbed on contact — the rule working, but it leaves the picture a rung short. The sheet's number words have to be *fitted* to their column, not just sized: ONE HUNDRED TWENTY-EIGHT is nearly twice as wide as its column at the size ZERO wants.

### 2026-08-21 (Number Merge — a bounce is not a full jar)

Reported: a ball that bounces up across the top line ends the game, and it shouldn't.

- **Diagnosis.** Instrumented the loss condition over 40 bot games: **38 of 40 losses were a block that was not at rest**, several of them hundreds or thousands of pixels *above the canvas* (worst: top -5764px, vy -3487). The solver resolves a deep overlap in one step, which can imply an absurd velocity and squeeze a block clean out of the jar; the round trip takes longer than the 1.2s grace, so `aboveFor` filled up while the block was in free flight. The renderer clips above the rim, so from the player's seat a ball popped up, vanished, and the jar was declared full.
- **Fix, in `checkDanger`: the above-the-line clock now has three states, not two.** Below the line clears it; above it and settled counts; above it and still flying **holds** — neither counts nor clears. Both halves matter. "Settled" deliberately does *not* mean `resting`, which is the trap fruit-merge hit and documented (a full jar is never quite still, so a rest requirement makes the game unloseable); it means "not a projectile". And the hold must not be a reset, or a block that pops up and settles back above the line restarts its clock every time it is jostled and the jar can never fill.
- The threshold is not delicate, which is why this is safe: measured, a settled full pile moves at **2px/s median, 16px/s p95**, while a squeezed-out block leaves at **hundreds to thousands**. `RULES.dangerSettleSpeed = 260` sits in a two-order-of-magnitude gap.
- **Also capped the ejection itself.** `World` takes a `maxSpeed` (2600px/s) applied to the velocity read-back *after* the restitution term — the first attempt clamped before it and real games leaked past the cap at 2664px/s, which the strengthened test caught. Falling the full height of the jar is worth ~1740px/s, so the clamp never touches normal motion. Ejection is not eliminated (still ~0.4% of body-frames, now peaking ~1100px above the canvas instead of 3500) but it no longer costs the game.
- **A test was passing for the wrong reason and had to be rewritten.** The old loss test stacked nine equal blocks in a column and asserted game over. It did end — but from the explosion flying above the rim and timing out, not from a full jar; the pile it settles into is three rows, well below the line. That test *was* the reported bug, asserted as correct behaviour, and it stayed green exactly as long as the bug lived. Fixing the bug turned it red, which is the only reason it surfaced. Replaced with a genuine overfull jar (one of every rung from One up: no two equal so nothing merges it back down, Zero excluded because it merges with everything, total area over what the jar holds), plus new tests for a 2600px/s pop-up not ending the game, all three clock states driven by hand, and the speed cap holding over whole games.
- Verified after: **60 bot games, 60/60 losses from a genuinely settled block, 0 from flight, 0 unloseable.** 115 checks green; fruit-merge untouched at that point and still green.

### 2026-08-21 (Fruit Merge — the same bounce fix, ported)

- Ported number-merge's three-state above-the-line clock and the `maxSpeed` velocity clamp into `fruit-merge` verbatim: `dangerSettleSpeed: 260`, `maxSpeed: 2600`, `World` takes `maxSpeed`, and `checkDanger` clears below the line / counts when settled / **holds while flying**. The bug was latent here too — same solver, same jar, same loss logic — it had simply never been reported.
- **The same test was passing for the same wrong reason**, and porting the fix is what exposed it: fruit's loss test stacked nine equal fruits and asserted game over. Nine equal fruits both explode apart *and* cascade-merge; what ended the game was the explosion timing out above the rim, not a full jar. Three checks went red the moment the fix landed.
- Finding a construction that genuinely overfills fruit's jar took measurement, not arithmetic. One of each of the 11 tiers is 145,776px² against 227,696px² of jar above the line, and it settles to a highest top of 210 — twenty-four pixels short of the line. Doubling or tripling the ladder is *worse*, because equal pairs merge and the pile shrinks. What works: **the six even-numbered tiers `[10,8,6,4,2,0]` dropped down one line** — no two equal so nothing merges, and stacked they are taller than the jar. Settles with 3 fruits above the line, culprit speed 1px/s, `merges === 0`, and the test asserts that last part so it can never again pass by merging its way there.
- Also added, mirroring number-merge: a 2600px/s pop-up must not end the game, the three clock states driven by hand, and the speed cap holding across whole games.
- Verified: **60 bot games, 60/60 losses from a genuinely settled fruit, 0 from flight, 0 unloseable**, cap holds at exactly 2600px/s, worst ejection 1179px above the canvas. 76 checks (was 63).

### 2026-08-21 (Number Merge — demo image, and picking ink by brightness)

Asked for a "demo image" featuring all the custom images he drew on screen at the same time — the same request that produced fruit-merge's showcase.

- The sheet and jar views already existed from the build. Added a **third view, `?raw=drawn` — "as he drew them"**: the thirteen cropped drawings on paper cards at their own aspect ratios, no ball around them and no numeral over them. It is the only view where the notation is actually visible, so **the colour key lives on that sheet** — the eight digit swatches, each labelled, with a note that 7 and 9 never appear because no power of two up to 2048 uses them. Swatch colours are read out of `blocks.json` rather than typed in: the single-digit rungs give theirs directly, 3 comes from Thirty-Two, 5 from 512, 6 from Sixteen.
- Zero gets a dashed empty card marked EMPTY, which is the honest way to show a blank page in a grid of drawings.
- **Numeral ink is now picked by the paint's perceived brightness rather than always white.** Measured over his palette, two colours cross 0.72 — the yellow of Thirty-Two (0.886) and the pink of Eight (0.832) — and a white numeral on those reads weakly even with the dark outline. Those two flip to dark ink on a white outline; red, green, blue and purple stay white; orange at 0.679 stays white and looks right. Zero's blank white ball takes dark ink too. Same rule applied to the legend swatches so the sheet and the game agree.
- Re-rendered all three PNGs into `docs/` after the physics clamp landed, since the settled jar arrangement is solver output and the checked-in image would otherwise no longer match the code: `number-merge-the-thirteen.png` (2700×2820), `number-merge-full-jar.png` (1440×2400), `number-merge-as-he-drew-them.png` (2700×2580).
