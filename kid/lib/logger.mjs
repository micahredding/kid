import { appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = join(__dirname, '..');

export function createLogger() {
  const logsDir = join(baseDir, 'logs');
  mkdirSync(logsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = join(logsDir, `session-${timestamp}.jsonl`);

  function log(entry) {
    entry.ts = new Date().toISOString();
    try {
      appendFileSync(filepath, JSON.stringify(entry) + '\n');
    } catch {
      // Never crash
    }
  }

  log({ type: 'start', version: '1.0.0' });

  return { log, filepath };
}
