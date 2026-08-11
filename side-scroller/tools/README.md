# Level generators

Each gen_level*.py builds one world's tile map and prints an ASCII preview.
They write `tiles*_out.txt` (JS string literals) which get spliced into
`js/level.js`. To edit a level: change the generator, run it, replace that
level's `tiles: [...]` block with the output. The tile maps in level.js are
canonical; these scripts are how they were authored.

Verification: playtest.mjs / test_castle.mjs / test_jungle.mjs (headless
physics bots), shot.html (headless-Chrome screenshots: ?level=&col=&row=).
