// =============================================================================
// THE BRAIN — a binary question tree, exactly like the Apple II ANIMAL.
//
// Forks hold a yes/no question, leaves hold an animal. Walk down answering
// until you hit a leaf; that's the guess. Wrong guess? The player supplies the
// real animal plus a question telling it apart, and the leaf becomes a fork.
//
// Nothing here is canonical except SEED. The live brain is SEED with an
// append-only list of lessons replayed over it, so the tree is always
// rebuildable and a bad lesson can be retired without rewriting history.
// =============================================================================

const L = (a) => ({ a });
const Q = (q, y, n) => ({ q, y, n });

export const SEED = Q('Does it live in the water?',
  Q('Is it bigger than a person?',
    Q('Does it have sharp teeth?',
      L('shark'),
      Q('Does it squirt water out of its head?', L('whale'), L('alligator'))),
    Q('Does it have eight arms?',
      L('octopus'),
      Q('Does it have claws?',
        L('crab'),
        Q('Can it hop around on land too?',
          L('frog'),
          Q('Is it orange?',
            L('goldfish'),
            Q('Does it have a shell?', L('turtle'), L('seahorse'))))))),
  Q('Does it have wings?',
    Q('Does it have feathers?',
      Q('Is it taller than a person?',
        L('ostrich'),
        Q('Does it hoot at night?',
          L('owl'),
          Q('Does it live on a farm?',
            L('chicken'),
            Q('Is it bright red?',
              L('cardinal'),
              Q('Can it copy what you say?', L('parrot'), L('eagle')))))),
      Q('Does it make honey?',
        L('bee'),
        Q('Does it have big colorful wings?', L('butterfly'), L('bat')))),
    Q('Does it have fur?',
      Q('Is it bigger than a person?',
        Q('Does it have a trunk?',
          L('elephant'),
          Q('Does it have stripes?',
            L('tiger'),
            Q('Does it have a big fluffy mane?',
              L('lion'),
              Q('Does it live where it is snowy?',
                L('polar bear'),
                Q('Does it have a very long neck?', L('giraffe'), L('horse')))))),
        Q('Does it hop?',
          Q('Does it carry its baby in a pouch?', L('kangaroo'), L('rabbit')),
          Q('Does it say meow?',
            L('cat'),
            Q('Does it say woof?',
              L('dog'),
              Q('Does it climb trees?',
                Q('Does it have a long tail for swinging?', L('monkey'), L('squirrel')),
                Q('Can it make a terrible stink?',
                  L('skunk'),
                  Q('Does it live on a farm?',
                    Q('Does it say oink?', L('pig'), L('sheep')),
                    Q('Could it fit in your hand?', L('mouse'), L('fox'))))))))),
      Q('Does it have legs?',
        Q('Does it have more than four legs?',
          Q('Does it have eight legs?', L('spider'), L('ant')),
          Q('Does it have a shell on its back?',
            L('tortoise'),
            Q('Can it change color?', L('chameleon'), L('lizard')))),
        Q('Is it long and slithery?', L('snake'), L('worm'))))));

export const isLeaf = (node) => typeof node?.a === 'string';

export function clone(node) {
  return isLeaf(node) ? { a: node.a } : { q: node.q, y: clone(node.y), n: clone(node.n) };
}

export function stats(root) {
  let animals = 0, questions = 0, deepest = 0;
  (function walk(node, depth) {
    if (isLeaf(node)) { animals++; deepest = Math.max(deepest, depth); return; }
    questions++;
    walk(node.y, depth + 1);
    walk(node.n, depth + 1);
  })(root, 0);
  return { animals, questions, deepest };
}

// Turn a leaf into a fork, in place, so any held reference stays valid.
function split(leaf, lesson) {
  const old = { a: leaf.a };
  delete leaf.a;
  leaf.q = lesson.question;
  leaf.y = lesson.newIsYes ? { a: lesson.answer } : old;
  leaf.n = lesson.newIsYes ? old : { a: lesson.answer };
}

// Follow the recorded yes/no path as far as the tree still allows.
function nodeAtPath(root, path = []) {
  let node = root;
  for (const step of path) {
    if (isLeaf(node)) break;
    node = step === 'y' ? node.y : node.n;
  }
  return node;
}

function findLeaf(node, match) {
  if (isLeaf(node)) return match(node) ? node : null;
  return findLeaf(node.y, match) || findLeaf(node.n, match);
}

const same = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Place one lesson. The path normally lands right on the leaf that was guessed.
// It can miss if two devices taught the same branch while offline, so fall back
// to the animal's name, then to any leaf below where the path ran out. A lesson
// always lands somewhere — a slightly odd placement beats losing what a kid taught.
function applyLesson(root, lesson) {
  if (!lesson.answer || !lesson.question || same(lesson.answer, lesson.wrongGuess)) return false;
  const reached = nodeAtPath(root, lesson.path);
  const target = (isLeaf(reached) && same(reached.a, lesson.wrongGuess) ? reached : null)
    || findLeaf(root, (leaf) => same(leaf.a, lesson.wrongGuess))
    || findLeaf(reached, () => true);
  if (!target) return false;
  split(target, lesson);
  return true;
}

// Rebuild the whole brain from the seed plus the lesson log. Pure: same log in,
// same tree out, which is what makes the log safe to treat as the real record.
export function replay(lessons = []) {
  const root = clone(SEED);
  const retired = new Set();
  for (const entry of lessons) {
    if (entry?.type === 'forget' && entry.target) retired.add(entry.target);
  }
  // The same lesson can reach us twice — once from the server's log and once
  // from our own outbox, if a POST succeeded but its reply never arrived.
  // Replaying it twice would invent a duplicate animal, so ids apply once.
  const seen = new Set();
  const applied = [];
  for (const entry of lessons) {
    if (!entry || entry.type === 'forget') continue;
    if (entry.id && retired.has(entry.id)) continue;
    if (entry.id && seen.has(entry.id)) continue;
    if (entry.id) seen.add(entry.id);
    if (applyLesson(root, entry)) applied.push(entry);
  }
  return { root, applied, retired };
}

export function article(word) {
  return /^[aeiou]/i.test(String(word).trim()) ? 'an' : 'a';
}

export function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
