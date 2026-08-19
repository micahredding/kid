// Tests for the parts that break a play session silently: a brazier asking for
// something that is not in the room, two things sharing a label, a sprite that
// does not exist, a prop hotspot off screen. Run: node castle/test_castle.mjs
import { SPRITES } from './js/pixels.js';
import { buildRooms, pickSum, SUMS, WORLDS } from './js/rooms.js';
import { solves, freshState, loadState, saveState, lampKey } from './js/engine.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? (pass++, console.log(`PASS ${name}`)) : (fail++, console.log(`FAIL ${name}`)); };
const eq = (name, got, want) => ok(`${name} (got ${JSON.stringify(got)})`, JSON.stringify(got) === JSON.stringify(want));

const rooms = buildRooms(pickSum(() => 0), 'asher');

// ---- every brazier must be solvable from its own room -----------------------
for (const id of WORLDS) {
  const room = rooms[id];
  eq(`${id}: has two braziers`, room.lamps.length, 2);
  ok(`${id}: has things to carry`, room.things.length >= 3);
  ok(`${id}: has a way back`, room.back?.to === 'hall');

  const solvers = new Set();
  room.lamps.forEach((lamp, i) => {
    ok(`${id}: brazier ${i} has a lock`, !!lamp.lock);
    const winners = room.things.filter((t) => solves(lamp.lock, t));
    eq(`${id}: brazier ${i} has exactly one answer`, winners.length, 1);
    solvers.add(winners[0].id);
    // Braziers stand at the back; things sit in front. Both must be reachable.
    ok(`${id}: brazier ${i} is inside the room`,
      lamp.x > room.floor.x && lamp.x < room.floor.x + room.floor.w);
  });
  // Two braziers wanting the same object would be unsolvable — the first one
  // consumes it and the second can never be satisfied.
  eq(`${id}: the two braziers want different things`, solvers.size, room.lamps.length);
  // At least one thing must be a pure distractor, or there is nothing to choose.
  ok(`${id}: has a distractor`, room.things.length > room.lamps.length);

  const labels = room.things.map((t) => String(t.word).toUpperCase());
  eq(`${id}: every label is distinct`, new Set(labels).size, labels.length);
  for (const t of room.things) {
    ok(`${id}: ${t.word} is inside the room`,
      t.x > room.floor.x && t.x < room.floor.x + room.floor.w);
    ok(`${id}: ${t.word} label clears the carrying strip`, t.y + 16 <= 174);
    if (!t.render) ok(`${id}: sprite ${t.sprite} exists`, Array.isArray(SPRITES[t.sprite]));
  }
}

// ---- signs must not collide, or one hides the other -------------------------
// Rough width of a sign, matching drawBrazier: text at scale 2 plus padding.
const signWidth = (lock) => {
  const text = lock.kind === 'math' ? lock.prompt : lock.word;
  const tw = text.length * 12 - 2;
  return Math.max(tw, lock.showPicture ? 34 : 0) + 16;
};
for (const id of WORLDS) {
  const room = rooms[id];
  const spans = room.lamps.map((l) => {
    const w = signWidth(l.lock);
    const cx = Math.max(3 + w / 2, Math.min(l.x, 320 - 3 - w / 2));
    return [cx - w / 2, cx + w / 2];
  });
  ok(`${id}: signs stay on screen`, spans.every(([a, b]) => a >= 0 && b <= 320));
  for (let i = 1; i < spans.length; i++) {
    ok(`${id}: sign ${i} does not overlap sign ${i - 1}`, spans[i][0] >= spans[i - 1][1]);
  }
}

// ---- props -----------------------------------------------------------------
for (const id of [...WORLDS, 'hall']) {
  const room = rooms[id];
  ok(`${id}: has props to poke at`, (room.props || []).length >= 3);
  for (const prop of room.props || []) {
    ok(`${id}: prop ${prop.word} is on screen`,
      prop.x >= 0 && prop.x <= 320 && prop.y >= 0 && prop.y <= 174);
    ok(`${id}: prop ${prop.word} is a real word`, /^[A-Z]{2,10}$/.test(prop.word));
  }
}

// ---- the reading ramp ------------------------------------------------------
ok('snow shows pictures on its signs', rooms.snow.lamps.every((l) => l.lock.showPicture === true));
ok('snow can show those pictures', rooms.snow.lamps.every((l) => !!SPRITES[l.lock.word.toLowerCase()]));
ok('garden hides the picture', rooms.garden.lamps.every((l) => l.lock.showPicture === false));
ok('garden things still have pictures', rooms.garden.things.every((t) => !!SPRITES[t.sprite]));
ok('ark gives words alone', rooms.ark.things.every((t) => t.render === 'crate'));
ok('rail asks one sum and one word',
  rooms.rail.lamps.map((l) => l.lock.kind).sort().join() === 'math,word');

// ---- the hall --------------------------------------------------------------
eq('hall has four doors', rooms.hall.doors.length, 4);
eq('every door leads to a real room', rooms.hall.doors.every((d) => !!rooms[d.to]), true);
eq('the doors cover the four worlds', rooms.hall.doors.map((d) => d.world).sort(), [...WORLDS].sort());
ok('hall has no brazier of its own', rooms.hall.lamps.length === 0);
eq('the banner knows the name', rooms.hall.who, 'asher');
ok('hall walkable strip sits in front of the table', rooms.hall.floor.y >= 164);
// Each doorway is named, so the words on the way in are readable too.
eq('every doorway is labelled', rooms.hall.props.map((p) => p.word).sort(),
  ['ARK', 'GARDEN', 'RAILWAY', 'SNOW']);

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
  ok(`sum "${sum.prompt}" distractors differ from the answer`,
    sum.near.every((n) => Number(n) !== Number(sum.answer)));
  ok(`sum "${sum.prompt}" distractors differ from each other`, sum.near[0] !== sum.near[1]);
  // A sum wide enough to collide with the neighbouring sign would hide it.
  ok(`sum "${sum.prompt}" fits beside the other sign`,
    signWidth({ kind: 'math', prompt: sum.prompt }) <= 140);
}
for (let i = 0; i < SUMS.length; i++) {
  const p = pickSum(() => i / SUMS.length + 1e-9);
  ok(`pick ${i}: answer is among the choices`, p.choices.includes(p.answer));
  eq(`pick ${i}: choices are distinct`, new Set(p.choices).size, 3);
  const built = buildRooms(p, '');
  eq(`pick ${i}: exactly one number solves the sum`,
    built.rail.things.filter((t) => solves(built.rail.lamps[0].lock, t)).length, 1);
  // The TRAIN block must not accidentally answer the sum as well.
  ok(`pick ${i}: the train is not also a number`,
    !solves(built.rail.lamps[0].lock, built.rail.things.find((t) => t.id === 'train')));
}

// ---- saved progress --------------------------------------------------------
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
eq('a fresh castle has no lamps lit', Object.keys(freshState().lamps).length, 0);
const s = freshState();
s.lamps[lampKey('snow', 0)] = true;
s.room = 'garden';
saveState(s);
const back = loadState();
eq('progress survives a reload', [back.lamps['snow:0'], back.room], [true, 'garden']);
eq('the other brazier stays dark', back.lamps['snow:1'], undefined);
store.set('castle-state', '{ not json');
eq('a corrupt save falls back to fresh', Object.keys(loadState().lamps).length, 0);
// A save from the one-brazier version must not force a replay of finished worlds.
store.set('castle-state', '{"lit":{"snow":true,"ark":true},"room":"hall"}');
const migrated = loadState();
eq('old whole-world saves migrate', [migrated.lamps['snow:0'], migrated.lamps['snow:1']], [true, true]);
eq('and only for the worlds that were done', migrated.lamps['garden:0'], undefined);
eq('ark migrated too', migrated.lamps['ark:1'], true);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
