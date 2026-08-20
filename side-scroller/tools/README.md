# Level generators

Each gen_level*.py builds one world's tile map and prints an ASCII preview.
They write `tiles*_out.txt` (JS string literals) which get spliced into
`js/level.js`. To edit a level: change the generator, run it, replace that
level's `tiles: [...]` block with the output. The tile maps in level.js are
canonical; these scripts are how they were authored.

gen_level7.py also prints a fall-safety report: every place you can step off
an edge and how far it drops you. World 1-7 is built so nothing exceeds one
band (8 rows) — test_heights.mjs asserts the same thing against the shipped
tile map, so editing the level can't quietly introduce a long fall.

Verification: playtest.mjs / test_castle.mjs / test_jungle.mjs /
test_numberland.mjs / test_cave.mjs / test_heights.mjs (headless physics bots),
shot.html (headless-Chrome screenshots: ?level=&col=&row=).
