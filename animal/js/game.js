// =============================================================================
// GAME — the ANIMAL loop, as a small state machine.
//
// ready → asking → thinking → guessing → (won | learnName → learnQuestion →
// learnSide → learned) → ready
//
// Every screen sets one prompt line, one note line, and which control group is
// live: the two big YES/NO buttons, a text field, or a single continue button.
// =============================================================================

import { SEED, replay, stats, isLeaf, article, newId } from './brain.js';

const THINK_MS = 900;
const MAX_NAME = 30;
const MAX_QUESTION = 120;

const up = (s) => String(s).toUpperCase();
const clean = (s, max) => String(s).replace(/\s+/g, ' ').trim().slice(0, max);

export class Animal {
  constructor(store, els) {
    this.store = store;
    this.els = els;
    this.root = replay(store.lessons()).root;
    this.lastTaught = null;
    this.dirty = false;

    els.yes.addEventListener('click', () => this.answer(true));
    els.no.addEventListener('click', () => this.answer(false));
    els.go.addEventListener('click', () => this.go());
    els.oops.addEventListener('click', () => this.forget());
    els.form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });

    document.addEventListener('keydown', (e) => {
      if (e.target === els.input) return;
      const k = e.key.toLowerCase();
      if (k === 'y') this.answer(true);
      else if (k === 'n') this.answer(false);
      else if (k === 'enter' || k === ' ') { e.preventDefault(); this.go(); }
    });

    store.onchange = () => this.paint();
    this.ready();
  }

  // ---- rendering -----------------------------------------------------------

  rebuild() {
    this.root = replay(this.store.lessons()).root;
  }

  // The server's log arriving mid-question would strand the node we are walking,
  // so hold the new tree until the round ends.
  refresh() {
    this.dirty = true;
    if (this.state === 'ready') this.ready(); // redraw the count, not just the header
    else this.paint();
  }

  paint() {
    const { animals } = stats(this.root);
    this.els.size.textContent = `${animals} animals`;
    const waiting = this.store.pending;
    const offline = this.store.online === false;
    this.els.sync.textContent = offline
      ? (waiting ? `offline · ${waiting} to save` : 'offline')
      : waiting ? `saving ${waiting}…`
      : this.store.online === null ? 'checking…'
      : 'brain saved';
    this.els.sync.classList.toggle('warn', offline);
  }

  // mode: 'yesno' | 'type' | 'go'
  screen({ say, note = '', mode, go = 'CONTINUE', oops = false, placeholder = '' }) {
    clearInterval(this.thinker);
    this.els.say.textContent = say;
    this.els.note.textContent = note;
    this.els.yesno.hidden = mode !== 'yesno';
    this.els.form.hidden = mode !== 'type';
    this.els.single.hidden = mode !== 'go';
    this.els.oops.hidden = !oops;
    this.els.go.textContent = go;
    if (mode === 'type') {
      this.els.input.value = '';
      this.els.input.placeholder = placeholder;
      this.els.input.focus();
    } else {
      this.els.input.blur();
    }
    this.paint();
  }

  // ---- states --------------------------------------------------------------

  ready() {
    this.state = 'ready';
    if (this.dirty) { this.rebuild(); this.dirty = false; }
    this.node = this.root;
    this.path = [];
    this.asked = 0;
    const { animals, questions } = stats(this.root);
    this.screen({
      say: 'Think of an animal.',
      note: `I know ${animals} animals and ${questions} questions. I will try to guess yours.`,
      mode: 'go',
      go: 'I AM READY',
    });
  }

  ask() {
    this.state = 'asking';
    if (isLeaf(this.node)) return this.think();
    this.asked++;
    this.screen({
      say: this.node.q,
      note: `Question ${this.asked}`,
      mode: 'yesno',
    });
  }

  think() {
    this.state = 'thinking';
    this.screen({ say: 'THINKING', note: '', mode: 'go', go: '…' });
    this.els.single.hidden = true;
    let dots = 0;
    this.thinker = setInterval(() => {
      dots = (dots + 1) % 4;
      this.els.say.textContent = 'THINKING' + '.'.repeat(dots);
    }, 220);
    setTimeout(() => { if (this.state === 'thinking') this.guess(); }, THINK_MS);
  }

  guess() {
    this.state = 'guessing';
    this.guessed = this.node.a;
    this.screen({
      say: `Is it ${article(this.guessed)} ${up(this.guessed)}?`,
      note: `My guess after ${this.asked} question${this.asked === 1 ? '' : 's'}`,
      mode: 'yesno',
    });
  }

  won() {
    this.state = 'won';
    this.screen({
      say: 'I GOT IT!',
      note: `${up(this.guessed)} in ${this.asked} question${this.asked === 1 ? '' : 's'}. Play again?`,
      mode: 'go',
      go: 'PLAY AGAIN',
    });
  }

  learnName() {
    this.state = 'learnName';
    this.screen({
      say: 'You beat me! What animal were you thinking of?',
      note: 'Type it in and I will remember it forever.',
      mode: 'type',
      placeholder: 'the animal',
    });
  }

  learnQuestion() {
    this.state = 'learnQuestion';
    const a = up(this.newAnimal), b = up(this.guessed);
    this.screen({
      say: `What yes-or-no question tells ${article(a)} ${a} apart from ${article(b)} ${b}?`,
      note: `Something like: Does it have stripes?`,
      mode: 'type',
      placeholder: 'your question',
    });
  }

  learnSide() {
    this.state = 'learnSide';
    this.screen({
      say: this.newQuestion,
      note: `For ${article(this.newAnimal)} ${up(this.newAnimal)}, is that yes or no?`,
      mode: 'yesno',
    });
  }

  learned(lesson) {
    this.state = 'learned';
    this.store.teach(lesson); // saved on this device instantly; travels on its own
    this.rebuild();
    this.lastTaught = lesson;
    const { animals } = stats(this.root);
    this.screen({
      say: `Now I know ${animals} animals.`,
      note: `Next time I will ask "${lesson.question}" and get ${up(lesson.answer)} right.`,
      mode: 'go',
      go: 'PLAY AGAIN',
      oops: true,
    });
  }

  // ---- input ---------------------------------------------------------------

  answer(yes) {
    if (this.state === 'asking') {
      this.path.push(yes ? 'y' : 'n');
      this.node = yes ? this.node.y : this.node.n;
      this.ask();
    } else if (this.state === 'guessing') {
      yes ? this.won() : this.learnName();
    } else if (this.state === 'learnSide') {
      this.learned({
        id: newId(),
        type: 'teach',
        answer: this.newAnimal,
        question: this.newQuestion,
        newIsYes: yes,
        wrongGuess: this.guessed,
        path: this.path,
      });
    }
  }

  go() {
    if (this.state === 'ready') this.ask();
    else if (this.state === 'won' || this.state === 'learned') this.ready();
  }

  submit() {
    const raw = this.els.input.value;
    if (this.state === 'learnName') {
      const name = clean(raw, MAX_NAME).toLowerCase();
      if (!name) return;
      if (name === String(this.guessed).toLowerCase()) {
        this.els.note.textContent = `That is what I guessed! Tell me the animal you meant.`;
        this.els.input.value = '';
        return;
      }
      this.newAnimal = name;
      this.learnQuestion();
    } else if (this.state === 'learnQuestion') {
      let q = clean(raw, MAX_QUESTION);
      if (q.length < 4) return;
      if (!/[?]$/.test(q)) q += '?';
      this.newQuestion = q[0].toUpperCase() + q.slice(1);
      this.learnSide();
    }
  }

  // Retire the last lesson instead of deleting it — the log stays whole, and
  // replay simply skips it from now on.
  forget() {
    if (!this.lastTaught) return;
    const target = this.lastTaught;
    this.lastTaught = null;
    this.store.teach({ id: newId(), type: 'forget', target: target.id });
    this.rebuild();
    this.screen({
      say: `Forgotten. I do not know ${up(target.answer)} any more.`,
      note: 'Nothing else changed.',
      mode: 'go',
      go: 'PLAY AGAIN',
    });
    this.state = 'won';
  }
}
