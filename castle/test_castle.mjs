// Tests for the parts that break a play session silently: a lamp asking for
// something that is not in the room, a distractor that ties with the answer,
// a sprite that does not exist. Run: node castle/test_castle.mjs
import { SPRITES } from './js/pixels.js';
import { buildRooms, pickSum, SUMS } from './js/rooms.js';
import { solves, freshState, loadState, saveState } from './js/engine.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? (pass++, console.log(`PASS ${name}`)) : (fail++, console.log(`FAIL ${name}`)); };
const eq = (name, got, want) => ok(`${name} (got ${JSON.stringify(got)})`, JSON.stringify(got) === JSON.stringify(want));

const WORLDS = ['snow', 'garden', 'ark', 'rail'];
const rooms = buildRooms(pickSum(() => 0));

// ---- every lamp must be solvable from its own room --------------------------
for (const id of WORLDS) {
  const room = rooms[id];
  ok(`${id}: has a lock`, !!room.lock);
  ok(`${id}: has a lamp`, !!room.lamp);
  ok(`${id}: has things to carry`, room.things.length >= 2);
  const winners = room.things.filter((t) => solves(room.lock, t));
  eq(`${id}: exactly one thing solves it`, winners.length, 1);
  const losers = room.things.filter((t) => !solves(room.lock, t));
  ok(`${id}: has at least one distractor`, losers.length >= 1);
  // No two things may share a label, or the puzzle has two right answers.
  const labels = room.things.map((t) => String(t.word).toUpperCase());
  eq(`${id}: every label is distinct`, new Set(labels).size, labels.length);
  // Everything must sit within the walkable strip, or it looks unreachable.
  for (const t of room.things) {
    ok(`${id}: ${t.word} is inside the room`,
      t.x > room.floor.x && t.x < room.floor.x + room.floor.w);
  }
  ok(`${id}: lamp is inside the room`,
    room.lamp.x > room.floor.x && room.lamp.x < room.floor.x + room.floor.w);
  ok(`${id}: has a way back`, room.back?.to === 'hall');
}

// ---- sprites referenced must exist -----------------------------------------
for (const id of WORLDS) {
  for (const t of rooms[id].things) {
    if (t.render) continue;
    ok(`${id}: sprite ${t.sprite} exists`, Array.isArray(SPRITES[t.sprite]));
  }
}
// The picture-scaffolded lock needs a sprite named after its word.
ok('snow lock can show its picture', !!SPRITES[rooms.snow.lock.word.toLowerCase()]);
eq('snow shows the picture (easiest rung)', rooms.snow.lock.showPicture, true);
eq('garden hides the picture (middle rung)', rooms.garden.lock.showPicture, false);
ok('ark things carry no pictures (hardest rung)', rooms.ark.things.every((t) => t.render === 'crate'));

// ---- the hall --------------------------------------------------------------
eq('hall has four doors', rooms.hall.doors.length, 4);
eq('every door leads to a real room', rooms.hall.doors.every((d) => !!rooms[d.to]), true);
eq('the four doors cover the four worlds',
  rooms.hall.doors.map((d) => d.world).sort(), [...WORLDS].sort());
ok('hall has no lamp of its own', !rooms.hall.lamp);

// ---- solves() --------------------------------------------------------------
ok('word lock matches its word', solves({ kind: 'word', word: 'BEAR' }, { word: 'BEAR' }));
ok('word lock is case-insensitive', solves({ kind: 'word', word: 'BEAR' }, { word: 'bear' }));
ok('word lock rejects another word', !solves({ kind: 'word', word: 'BEAR' }, { word: 'DOVE' }));
ok('word lock rejects nothing carried', !solves({ kind: 'word', word: 'BEAR' }, null));
ok('math lock matches its answer', solves({ kind: 'math', answer: 42 }, { value: 42 }));
ok('math lock rejects a near miss', !solves({ kind: 'math', answer: 42 }, { value: 24 }));
ok('math lock handles decimals', solves({ kind: 'math', answer: 1 }, { value: 0.5 + 0.5 }));
ok('a word cannot open a number lock', !solves({ kind: 'math', answer: 42 }, { word: '42' }));
ok('unknown lock kinds stay shut', !solves({ kind: 'shrug', answer: 1 }, { value: 1 }));

// ---- the arithmetic --------------------------------------------------------
for (const sum of SUMS) {
  ok(`sum "${sum.prompt}" has two distractors`, sum.near.length === 2);
  ok(`sum "${sum.prompt}" distractors differ from the answer`,
    sum.near.every((n) => Number(n) !== Number(sum.answer)));
  ok(`sum "${sum.prompt}" distractors differ from each other`, sum.near[0] !== sum.near[1]);
}
// Walk the whole table through pickSum so no entry can be quietly unsolvable.
for (let i = 0; i < SUMS.length; i++) {
  const p = pickSum(() => i / SUMS.length + 1e-9);
  ok(`pick ${i}: answer is among the choices`, p.choices.includes(p.answer));
  eq(`pick ${i}: three choices`, p.choices.length, 3);
  eq(`pick ${i}: choices are distinct`, new Set(p.choices).size, 3);
  const built = buildRooms(p);
  eq(`pick ${i}: exactly one number solves the signal`,
    built.rail.things.filter((t) => solves(built.rail.lock, t)).length, 1);
}

// ---- saved progress --------------------------------------------------------
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
eq('a fresh castle is all dark', Object.values(freshState().lit), [false, false, false, false]);
const s = freshState();
s.lit.snow = true; s.room = 'garden';
saveState(s);
const back = loadState();
eq('progress survives a reload', [back.lit.snow, back.room], [true, 'garden']);
eq('unlit worlds stay unlit', back.lit.ark, false);
store.set('castle-state', '{ not json');
eq('a corrupt save falls back to fresh', loadState().lit.snow, false);
store.set('castle-state', '{"lit":{"snow":true}}');
eq('a partial save fills in the rest', loadState().lit.ark, false);
eq('and keeps what it had', loadState().lit.snow, true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
