import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keywordsPath = join(__dirname, '..', 'data', 'keywords.json');

let keywords = {};
try {
  keywords = JSON.parse(readFileSync(keywordsPath, 'utf-8'));
} catch {
  // If keywords file is missing, proceed with empty map
}

export function getEmoji(token) {
  return keywords[token.toLowerCase()] || null;
}

export function isEmoji(token) {
  return token.toLowerCase() in keywords;
}
