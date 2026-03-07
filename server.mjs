#!/usr/bin/env node

import { createServer } from 'node:http';
import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3131;

// Session setup
const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logsDir   = join(__dirname, 'logs');
const printsDir = join(__dirname, 'prints');
mkdirSync(logsDir,   { recursive: true });
mkdirSync(printsDir, { recursive: true });

const logFile = join(logsDir, `session-${sessionTimestamp}.jsonl`);

function log(entry) {
  entry.ts = new Date().toISOString();
  try { appendFileSync(logFile, JSON.stringify(entry) + '\n'); } catch { /* never crash */ }
}

log({ type: 'start', version: '1.0.0' });
console.log(`\n  Kid (HTML) is running at http://localhost:${PORT}`);
console.log(`  Logging to: logs/session-${sessionTimestamp}.jsonl\n`);

const html = readFileSync(join(__dirname, 'index.html'));

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

  // Serve the HTML app
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // Append a log entry
  if (req.method === 'POST' && req.url === '/log') {
    const body = await readBody(req);
    try { log(JSON.parse(body)); } catch { /* ignore malformed */ }
    res.writeHead(204); res.end();
    return;
  }

  // Save a drawing PNG
  if (req.method === 'POST' && req.url === '/save-drawing') {
    const body = await readBody(req);
    try {
      const { dataUrl } = JSON.parse(body);
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filepath = join(printsDir, `drawing-${ts}.png`);
      writeFileSync(filepath, buf);
      log({ type: 'print', filepath });
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
