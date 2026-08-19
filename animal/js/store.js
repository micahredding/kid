// =============================================================================
// STORE — keeps the lesson log alive across the network being gone.
//
// Two lists in localStorage:
//   animal-brain  lessons we believe mini4 already has
//   animal-queue  lessons taught here that mini4 has not accepted yet
//
// The brain is always replayed from both, so a lesson taught offline takes
// effect immediately and still lands on the server later. Nothing is ever
// dropped on a failed request — it just stays queued.
// =============================================================================

const CACHE_KEY = 'animal-brain';
const QUEUE_KEY = 'animal-queue';
const MAX_QUEUE = 500;
const TIMEOUT_MS = 4000;

// A half-present network (captive wifi, a server that accepts the connection and
// then says nothing) leaves fetch hanging forever. Always give it a deadline —
// a slow answer and no answer should look the same to the game.
function timedFetch(url, opts = {}) {
  if (typeof AbortSignal?.timeout === 'function') {
    return fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT_MS) });
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    const val = raw ? JSON.parse(raw) : [];
    return Array.isArray(val) ? val : [];
  } catch { return []; }
}

function write(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* full — keep going */ }
}

export class Store {
  constructor(who = '') {
    this.who = who;
    this.cache = read(CACHE_KEY);
    this.queue = read(QUEUE_KEY);
    this.online = null; // unknown until the first fetch
    this.onchange = () => {};
  }

  // Everything the brain should replay, oldest first.
  lessons() {
    return [...this.cache, ...this.queue];
  }

  get pending() { return this.queue.length; }

  // Pull the server's log. On failure we keep whatever we had, which is the
  // whole point — a cold iPad on no wifi still opens with its own history.
  async load() {
    try {
      const res = await timedFetch('/animal-brain', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (Array.isArray(data.lessons)) {
        this.cache = data.lessons;
        write(CACHE_KEY, this.cache);
        this.dropAccepted();
      }
      this.online = true;
      await this.flush();
    } catch {
      this.online = false;
    }
    this.onchange();
    return this.lessons();
  }

  // A queued lesson that came back in the server's log is done travelling.
  dropAccepted() {
    const known = new Set(this.cache.map((l) => l.id).filter(Boolean));
    const before = this.queue.length;
    this.queue = this.queue.filter((l) => !known.has(l.id));
    if (this.queue.length !== before) write(QUEUE_KEY, this.queue);
  }

  // Writing to the queue IS the save, as far as the game is concerned. Sending it
  // on is a background errand — a kid never waits on the network to keep playing.
  teach(lesson) {
    if (this.who) lesson.who = this.who;
    lesson.ts = new Date().toISOString();
    this.queue.push(lesson);
    if (this.queue.length > MAX_QUEUE) this.queue.shift();
    write(QUEUE_KEY, this.queue);
    this.onchange();
    this.flush();
    return lesson;
  }

  async flush() {
    if (this.flushing) return false;
    this.flushing = true;
    try { return await this.drain(); } finally { this.flushing = false; }
  }

  async drain() {
    while (this.queue.length) {
      const lesson = this.queue[0];
      try {
        const res = await timedFetch('/animal-teach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lesson),
        });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        this.online = false;
        this.onchange();
        return false;
      }
      // Accepted: move it from "waiting" to "the server has this".
      this.queue.shift();
      if (!this.cache.some((l) => l.id === lesson.id)) this.cache.push(lesson);
      write(QUEUE_KEY, this.queue);
      write(CACHE_KEY, this.cache);
      this.online = true;
    }
    this.onchange();
    return true;
  }
}
