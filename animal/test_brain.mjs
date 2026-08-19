// Tests for the brain: seed shape, learning, replay determinism, forgetting,
// and the fallbacks that keep a lesson from being lost when paths go stale.
// Run: node animal/test_brain.mjs
import { SEED, replay, stats, isLeaf, article, clone } from './js/brain.js';

let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name}`); }
};
const eq = (name, got, want) =>
  ok(`${name} (got ${JSON.stringify(got)})`, JSON.stringify(got) === JSON.stringify(want));

// Find the yes/no path that reaches a named animal.
function pathTo(node, name, path = []) {
  if (isLeaf(node)) return node.a === name ? path : null;
  return pathTo(node.y, name, [...path, 'y']) || pathTo(node.n, name, [...path, 'n']);
}
function walk(root, path) {
  let node = root;
  for (const step of path) node = step === 'y' ? node.y : node.n;
  return node;
}
const leaves = (node, out = []) => {
  if (isLeaf(node)) out.push(node.a); else { leaves(node.y, out); leaves(node.n, out); }
  return out;
};

// ---- seed ------------------------------------------------------------------
const seedStats = stats(SEED);
eq('seed has 42 animals', seedStats.animals, 42);
ok('every seed animal is unique', new Set(leaves(SEED)).size === 42);
ok('no seed leaf is empty', leaves(SEED).every((a) => a && a.trim().length > 1));
ok('empty log replays to the seed', JSON.stringify(replay([]).root) === JSON.stringify(SEED));

// ---- teaching --------------------------------------------------------------
const horsePath = pathTo(SEED, 'horse');
ok('horse is reachable', Array.isArray(horsePath));

const zebra = {
  id: 'L1', type: 'teach', answer: 'zebra',
  question: 'Does it have black and white stripes?',
  newIsYes: true, wrongGuess: 'horse', path: horsePath,
};

const one = replay([zebra]);
eq('one lesson applied', one.applied.length, 1);
eq('brain grew by one animal', stats(one.root).animals, 43);
const fork = walk(one.root, horsePath);
ok('the horse leaf became a fork', !isLeaf(fork));
eq('fork asks the new question', fork.q, zebra.question);
eq('yes side is the new animal', fork.y.a, 'zebra');
eq('no side keeps the old animal', fork.n.a, 'horse');

// newIsYes false puts the new animal on the no side
const noSide = replay([{ ...zebra, id: 'L1b', newIsYes: false }]);
const fork2 = walk(noSide.root, horsePath);
eq('newIsYes false swaps the sides', [fork2.y.a, fork2.n.a], ['horse', 'zebra']);

// ---- determinism -----------------------------------------------------------
const log = [zebra, {
  id: 'L2', type: 'teach', answer: 'donkey', question: 'Does it have long ears?',
  newIsYes: true, wrongGuess: 'horse', path: horsePath,
}];
const a = replay(log), b = replay(log);
ok('same log replays to the same tree', JSON.stringify(a.root) === JSON.stringify(b.root));
eq('both lessons landed', stats(a.root).animals, 44);
ok('replay does not mutate the seed', stats(SEED).animals === 42);

// ---- forgetting ------------------------------------------------------------
const forgotten = replay([...log, { id: 'F1', type: 'forget', target: 'L2' }]);
eq('forgetting drops just that lesson', stats(forgotten.root).animals, 43);
ok('donkey is gone', !leaves(forgotten.root).includes('donkey'));
ok('zebra survived', leaves(forgotten.root).includes('zebra'));
ok('the forget line is still in the log', forgotten.retired.has('L2'));

// A forget for the FIRST lesson: the second lesson still has to land somewhere,
// because a kid taught it and we do not throw that away.
const keepSecond = replay([...log, { id: 'F2', type: 'forget', target: 'L1' }]);
ok('donkey survives its parent being forgotten', leaves(keepSecond.root).includes('donkey'));
ok('zebra is gone', !leaves(keepSecond.root).includes('zebra'));

// ---- duplicates ------------------------------------------------------------
// A lesson can arrive from the server's log and from our own outbox at once.
const twice = replay([zebra, { ...zebra }]);
eq('the same id applies only once', stats(twice.root).animals, 43);
eq('and is counted once', twice.applied.length, 1);
const dupThenForget = replay([zebra, { ...zebra }, { id: 'F9', type: 'forget', target: 'L1' }]);
eq('forgetting a duplicated lesson removes it completely', stats(dupThenForget.root).animals, 42);

// ---- bad lessons -----------------------------------------------------------
const junk = replay([
  { id: 'B1', type: 'teach', answer: 'horse', question: 'Is it a horse?', wrongGuess: 'horse', path: horsePath },
  { id: 'B2', type: 'teach', answer: '', question: 'Anything?', wrongGuess: 'horse', path: horsePath },
  { id: 'B3', type: 'teach', answer: 'newt', question: '', wrongGuess: 'horse', path: horsePath },
  null,
]);
eq('junk lessons are skipped', stats(junk.root).animals, 42);

// ---- stale paths (two devices taught offline) ------------------------------
// The path is nonsense, but the animal we guessed wrong still exists by name.
const stale = replay([{ ...zebra, id: 'S1', path: ['y', 'y', 'y', 'y', 'y', 'y'] }]);
ok('a wrong path falls back to the animal name', leaves(stale.root).includes('zebra'));
ok('and it lands beside the animal it was told apart from',
  !isLeaf(walk(stale.root, horsePath)) && leaves(walk(stale.root, horsePath)).includes('horse'));

// The guessed animal is gone entirely — still must not lose the new one.
const orphan = replay([
  zebra,
  { id: 'O1', type: 'teach', answer: 'pony', question: 'Is it small?', newIsYes: true, wrongGuess: 'horse', path: horsePath },
  { id: 'O2', type: 'teach', answer: 'mule', question: 'Is it stubborn?', newIsYes: true, wrongGuess: 'nonexistent-beast', path: horsePath },
]);
ok('a lesson about a missing animal still lands', leaves(orphan.root).includes('mule'));
ok('nothing else was lost', ['zebra', 'pony', 'horse'].every((n) => leaves(orphan.root).includes(n)));

// ---- odds and ends ---------------------------------------------------------
eq('article picks an for vowels', [article('elephant'), article('owl'), article('horse')], ['an', 'an', 'a']);
const copy = clone(SEED);
copy.q = 'changed';
ok('clone is deep', SEED.q !== 'changed');

// A long chain of lessons on the same spot keeps working.
let chain = [];
for (let i = 0; i < 40; i++) {
  const tree = replay(chain).root;
  const p = pathTo(tree, 'horse');
  chain.push({ id: `C${i}`, type: 'teach', answer: `beast${i}`, question: `Is it number ${i}?`, newIsYes: true, wrongGuess: 'horse', path: p });
}
const deep = replay(chain);
eq('40 chained lessons all land', stats(deep.root).animals, 82);
ok('every taught beast is present',
  Array.from({ length: 40 }, (_, i) => `beast${i}`).every((n) => leaves(deep.root).includes(n)));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
