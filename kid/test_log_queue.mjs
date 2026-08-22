// Tests for the offline log queue in kid/index.html.
//
// The queue is inline in the page, so this pulls the real source out of the
// HTML and runs it against stub localStorage/fetch. That way the thing under
// test is what actually ships, with no duplicated copy to drift.
//
// Run: node kid/test_log_queue.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index.html'), 'utf8');

// Grab from the LOG_QUEUE_KEY declaration through the end of serverLog().
const start = html.indexOf("const LOG_QUEUE_KEY");
const endMark = "window.addEventListener('online', flushLogQueue);";
const end = html.indexOf(endMark);
if (start === -1 || end === -1 || end < start) throw new Error('could not locate the queue source in index.html');
const source = html.slice(start, end);

let passed = 0, failed = 0;
function ok(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${extra ? ' — ' + extra : ''}`); }
}
function eq(name, actual, expected) {
  ok(name, JSON.stringify(actual) === JSON.stringify(expected), `got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
}

// Build a fresh sandbox: real queue code, stubbed browser.
function makeQueue({ responder }) {
  const store = new Map();
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const sent = [];
  const fetch = async (url, opts) => {
    const entry = JSON.parse(opts.body);
    sent.push(entry);
    return responder(entry, sent.length);
  };
  // Look names up defensively so an older/regressed page still loads and fails
  // the assertions below, instead of blowing up with a ReferenceError.
  const pick = (n) => `typeof ${n} === 'function' ? ${n} : undefined`;
  const factory = new Function('localStorage', 'fetch', 'SERVER', 'WHO',
    `${source}
     const readQueue2 = ${pick('readQueue')} || (() => { try { return JSON.parse(localStorage.getItem('kid-log-queue') || '[]'); } catch { return []; } });
     return { queueLog, flushLogQueue, serverLog,
              dequeueLog: ${pick('dequeueLog')}, trimQueue: ${pick('trimQueue')},
              readQueue: readQueue2 };`);
  const api = factory(localStorage, fetch, 'http://x', null);
  return { ...api, sent, raw: () => store.get('kid-log-queue') };
}

const okRes = { ok: true, status: 204 };
const down = () => { throw new Error('offline'); };

console.log('queue survives a server that is down');
{
  const q = makeQueue({ responder: down });
  q.serverLog({ type: 'drawing', drawingId: 'a' });
  q.serverLog({ type: 'drawing', drawingId: 'b' });
  await new Promise((r) => setTimeout(r, 0));
  const left = q.readQueue();
  eq('both entries still queued', left.map((e) => e.drawingId), ['a', 'b']);
  ok('nothing was deleted before acknowledgement', left.length === 2);
}

console.log('a flush interrupted partway keeps the rest');
{
  // First POST succeeds, second throws — the classic half-up network.
  const q = makeQueue({ responder: (e, n) => (n === 1 ? okRes : down()) });
  q.queueLog({ type: 'drawing', drawingId: 'a' });
  q.queueLog({ type: 'drawing', drawingId: 'b' });
  q.queueLog({ type: 'drawing', drawingId: 'c' });
  await q.flushLogQueue();
  eq('acknowledged entry dropped, unacknowledged kept', q.readQueue().map((e) => e.drawingId), ['b', 'c']);
}

console.log('everything drains when the server is up');
{
  const q = makeQueue({ responder: () => okRes });
  q.queueLog({ type: 'drawing', drawingId: 'a' });
  q.queueLog({ type: 'input', raw: 'print' });
  await q.flushLogQueue();
  eq('queue empty', q.readQueue(), []);
  eq('both were sent', q.sent.length, 2);
}

console.log('entries logged during a flush are not left behind');
{
  let api;
  const q = makeQueue({
    responder: (e, n) => {
      if (n === 1) api.queueLog({ type: 'input', raw: 'late' }); // arrives mid-pass
      return okRes;
    },
  });
  api = q;
  q.queueLog({ type: 'drawing', drawingId: 'a' });
  await q.flushLogQueue();
  eq('queue fully drained including the late entry', q.readQueue(), []);
  eq('late entry was sent', q.sent.map((e) => e.raw ?? e.drawingId), ['a', 'late']);
}

console.log('re-queueing the same entry does not duplicate it');
{
  const q = makeQueue({ responder: down });
  const e = { type: 'drawing_actions', drawingId: 'a', seq: 0 };
  q.queueLog(e);
  q.queueLog(e);
  eq('one copy', q.readQueue().length, 1);
  ok('entry carries a qid', typeof q.readQueue()[0].qid === 'string');
}

console.log('over-cap trimming drops action batches before snapshots');
{
  const q = makeQueue({ responder: down });
  const big = [];
  for (let i = 0; i < 1005; i++) big.push({ type: 'drawing_actions', drawingId: 'a', seq: i });
  q.queueLog({ type: 'drawing', drawingId: 'snap' });   // oldest entry of all
  for (const e of big) q.queueLog(e);
  const left = q.readQueue();
  ok('queue capped at 1000', left.length === 1000, `got ${left.length}`);
  ok('the snapshot survived the trim', left.some((e) => e.type === 'drawing' && e.drawingId === 'snap'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
