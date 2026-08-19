#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync, appendFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3131;

// Session setup
const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logsDir   = join(__dirname, 'logs');
const printsDir = join(__dirname, 'prints');
const brainDir  = join(__dirname, 'brain');
mkdirSync(logsDir,   { recursive: true });
mkdirSync(printsDir, { recursive: true });
mkdirSync(brainDir,  { recursive: true });

const logFile = join(logsDir, `session-${sessionTimestamp}.jsonl`);

function log(entry) {
  entry.ts = new Date().toISOString();
  try { appendFileSync(logFile, JSON.stringify(entry) + '\n'); } catch { /* never crash */ }
}

// Passive "who" signal (Option A): which device/IP made the request.
function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (xff ? String(xff).split(',')[0].trim() : '') || req.socket?.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}
function shortDevice(ua = '') {
  ua = String(ua);
  const os = /iPad/.test(ua) ? 'iPad'
    : /iPhone/.test(ua) ? 'iPhone'
    : /Android/.test(ua) ? 'Android'
    : /Macintosh|Mac OS X/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows'
    : /Linux/.test(ua) ? 'Linux' : '?';
  const br = /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari' : '';
  return (os + (br ? ' ' + br : '')).trim() || 'device';
}
// Sanitize a client-supplied "who" (Option B) for use in logs and filenames.
function cleanWho(who) {
  return who ? String(who).replace(/[^a-z0-9_-]/gi, '').slice(0, 20) : '';
}
// Sanitize a client-supplied drawing id for use in autosave filenames.
function cleanId(id) {
  return id ? String(id).replace(/[^a-z0-9]/gi, '').slice(0, 32) : '';
}
function autosavePath(tag, id) {
  return join(printsDir, `autosave-${tag ? tag + '-' : ''}${id}.png`);
}

log({ type: 'start', version: '1.0.0' });
console.log(`\n  Kid (HTML) is running at http://localhost:${PORT}`);
console.log(`  Logging to: logs/session-${sessionTimestamp}.jsonl\n`);

const htmlPath = join(__dirname, 'index.html');

// Static game directories (relative to kid/)
const GAMES = {
  'numberblocks': join(__dirname, '..', 'numberblocks'),
  'planets':      join(__dirname, '..', 'planets'),
  'run-around':   join(__dirname, '..', 'run-around'),
  'letter-invaders': join(__dirname, '..', 'letter-invaders', 'dist'),
  'family-tree':  join(__dirname, '..', 'family-tree'),
  'powers-of-2-numberblocks': join(__dirname, '..', 'powers-of-2-numberblocks'),
  'side-scroller': join(__dirname, '..', 'side-scroller'),
  'grinch':       join(__dirname, '..', 'grinch'),
  'decimals':     join(__dirname, '..', 'decimals'),
  'animal':       join(__dirname, '..', 'animal'),
  'castle':       join(__dirname, '..', 'castle'),
};

// ---- ANIMAL's brain --------------------------------------------------------
// The permanent record is this append-only list of lessons, one JSON object per
// line. The question tree itself is derived by replaying the log over the seed
// in animal/js/brain.js, so it is always rebuildable and never authoritative.
// A retired lesson gets a {type:'forget'} line rather than having its line cut.
const brainFile = join(brainDir, 'animal-lessons.jsonl');
const MAX_LESSONS = 20000;

function readLessons() {
  try {
    return readFileSync(brainFile, 'utf8').split('\n').filter(Boolean).map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}

function cleanText(value, max) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
    : '';
}

// Reject anything that would not replay into a sane tree; keep the rest exact.
function sanitizeLesson(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = cleanText(raw.id, 40) || `${Date.now().toString(36)}-srv`;
  if (raw.type === 'forget') {
    const target = cleanText(raw.target, 40);
    return target ? { id, type: 'forget', target } : null;
  }
  const answer = cleanText(raw.answer, 30).toLowerCase();
  const question = cleanText(raw.question, 120);
  if (!answer || question.length < 4) return null;
  const path = Array.isArray(raw.path)
    ? raw.path.filter((p) => p === 'y' || p === 'n').slice(0, 200)
    : [];
  return {
    id, type: 'teach', answer, question,
    newIsYes: !!raw.newIsYes,
    wrongGuess: cleanText(raw.wrongGuess, 30).toLowerCase(),
    path,
  };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.ogg':  'audio/ogg',
  '.wasm': 'application/wasm',
};

// ---- Offline support: manifest of every cacheable file, for the service worker ----
// The worker precaches this list, so the games keep working with no network.
const SKIP_DIRS = new Set(['node_modules', 'tools', 'logs', 'prints']);
const SKIP_FILES = /^(test_|debug_|playtest|\.)/i;

function walkManifest(dir, urlBase, files) {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) {
        walkManifest(join(dir, e.name), `${urlBase}/${e.name}`, files);
      }
      continue;
    }
    if (SKIP_FILES.test(e.name)) continue;
    const ext = extname(e.name).toLowerCase();
    if (!(ext in MIME_TYPES)) continue;
    const st = statSync(join(dir, e.name));
    const stamp = `${Math.floor(st.mtimeMs)}-${st.size}`;
    // Pages are requested as directory URLs, so key index.html that way
    if (e.name === 'index.html') files[`${urlBase}/`] = stamp;
    else files[`${urlBase}/${e.name}`] = stamp;
  }
}

function buildManifest() {
  const files = {};
  const st = statSync(htmlPath);
  files['/'] = `${Math.floor(st.mtimeMs)}-${st.size}`;
  for (const [name, dir] of Object.entries(GAMES)) walkManifest(dir, `/${name}`, files);
  const json = JSON.stringify(files);
  let hash = 5381;
  for (let i = 0; i < json.length; i++) hash = ((hash * 33) ^ json.charCodeAt(i)) >>> 0;
  return { version: hash.toString(36), files };
}

function serveStatic(res, dir, urlPath) {
  // Strip leading slash and the game prefix segment
  let filePath = urlPath === '' || urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  const fullPath = join(dir, filePath);
  // Prevent directory traversal
  if (!fullPath.startsWith(dir)) { res.writeHead(403); res.end('Forbidden'); return; }
  if (!existsSync(fullPath)) { res.writeHead(404); res.end('Not found'); return; }
  const ext = extname(fullPath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  // Revalidate every time. Without this the browser heuristically caches game
  // JS and a device can keep running old code after a deploy; the service
  // worker is what provides offline, so nothing is lost by not caching here.
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
  res.end(readFileSync(fullPath));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
  });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve game static files: /numberblocks/*, /planets/*, etc.
  if (req.method === 'GET') {
    const urlPath = req.url.split('?')[0];
    for (const [name, dir] of Object.entries(GAMES)) {
      if (urlPath === `/${name}` || urlPath.startsWith(`/${name}/`)) {
        const subPath = urlPath.slice(name.length + 1) || '/';
        serveStatic(res, dir, subPath);
        return;
      }
    }
  }

  // Service worker + its precache manifest. The worker source gets the current
  // manifest version injected, so any file change rolls the worker and
  // triggers a precache diff on the next online visit.
  if (req.method === 'GET' && req.url.split('?')[0] === '/sw-manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify(buildManifest()));
    return;
  }
  if (req.method === 'GET' && req.url.split('?')[0] === '/sw.js') {
    try {
      const src = readFileSync(join(__dirname, 'sw.js'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' });
      res.end(`const VERSION = '${buildManifest().version}';\n${src}`);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
    return;
  }

  // ANIMAL: hand over the whole lesson log. The client replays it over its own
  // seed, so this stays a dumb store — no tree logic on the server.
  if (req.method === 'GET' && req.url.split('?')[0] === '/animal-brain') {
    const lessons = readLessons();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ lessons, count: lessons.length }));
    return;
  }

  // ANIMAL: append one lesson. Idempotent by id, because a client that never
  // saw our response will retry the same lesson when it comes back online.
  if (req.method === 'POST' && req.url.split('?')[0] === '/animal-teach') {
    const body = await readBody(req);
    let parsed = null, lesson = null;
    try { parsed = JSON.parse(body); lesson = sanitizeLesson(parsed); } catch { /* malformed */ }
    if (!lesson) { res.writeHead(400); res.end('Bad lesson'); return; }

    const existing = readLessons();
    if (existing.length >= MAX_LESSONS) { res.writeHead(507); res.end('Brain full'); return; }
    if (existing.some((l) => l.id === lesson.id)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, id: lesson.id, duplicate: true }));
      return;
    }

    lesson.who = cleanWho(parsed.who) || undefined;
    // A lesson taught with no wifi keeps the moment it actually happened.
    const taughtAt = cleanText(parsed.ts, 40);
    if (taughtAt) lesson.taughtAt = taughtAt;
    lesson.ts = new Date().toISOString();
    lesson.device = shortDevice(req.headers['user-agent']);
    lesson.ip = clientIp(req);
    try {
      appendFileSync(brainFile, JSON.stringify(lesson) + '\n');
    } catch {
      res.writeHead(500); res.end('Could not save'); return;
    }
    log({ type: 'animal-lesson', lesson: lesson.type, answer: lesson.answer, who: lesson.who, ip: lesson.ip, device: lesson.device });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, id: lesson.id, count: existing.length + 1 }));
    return;
  }

  // Serve the HTML app (read per request so edits show up on refresh).
  // Ignore any query string (e.g. /?who=micah) when matching the root path.
  if (req.method === 'GET' && req.url.split('?')[0] === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' });
    res.end(readFileSync(htmlPath));
    return;
  }

  // Append a log entry, stamped with the device/IP it came from
  if (req.method === 'POST' && req.url === '/log') {
    const body = await readBody(req);
    try {
      const entry = JSON.parse(body);
      entry.ip = clientIp(req);
      entry.device = shortDevice(req.headers['user-agent']);
      log(entry);
    } catch { /* ignore malformed */ }
    res.writeHead(204); res.end();
    return;
  }

  // Save a drawing PNG. Two flavors:
  // - autosaveId: in-progress snapshot — one file per drawing session, overwritten
  //   each time, so a browser closed mid-draw still leaves the latest picture.
  // - finalOf: the real print on clean exit — removes that session's autosave file.
  if (req.method === 'POST' && req.url === '/save-drawing') {
    const body = await readBody(req);
    try {
      const { dataUrl, who, autosaveId, finalOf } = JSON.parse(body);
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      const tag = cleanWho(who);

      if (autosaveId) {
        const id = cleanId(autosaveId);
        if (!id) { res.writeHead(400); res.end('Bad autosave id'); return; }
        const filepath = autosavePath(tag, id);
        const isNew = !existsSync(filepath);
        writeFileSync(filepath, buf);
        // Log only the first snapshot of a session, not every overwrite.
        if (isNew) log({ type: 'autosave', filepath, who: tag || undefined, ip: clientIp(req), device: shortDevice(req.headers['user-agent']) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ filepath }));
        return;
      }

      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filepath = join(printsDir, `drawing-${tag ? tag + '-' : ''}${ts}.png`);
      writeFileSync(filepath, buf);
      log({ type: 'print', filepath, who: tag || undefined, ip: clientIp(req), device: shortDevice(req.headers['user-agent']) });

      const finalId = cleanId(finalOf);
      if (finalId) {
        for (const p of [autosavePath(tag, finalId), autosavePath('', finalId)]) {
          try { if (existsSync(p)) unlinkSync(p); } catch { /* leave it */ }
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ filepath }));
    } catch {
      res.writeHead(500); res.end('Error saving drawing');
    }
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT);

process.on('SIGINT', () => {
  log({ type: 'end' });
  console.log('\nBye! 👋');
  process.exit(0);
});
