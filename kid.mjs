#!/usr/bin/env node

import { createInterface } from 'node:readline';
import { evaluate } from './lib/parser.mjs';
import { render } from './lib/display.mjs';
import { createLogger } from './lib/logger.mjs';
import { enterDrawingMode } from './lib/drawing.mjs';

const logger = createLogger();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

// Welcome message
console.log('');
console.log('  Welcome! Type anything and press Enter.');
console.log('  Try: 4 + 4, 3 trex, 5 red, red + blue');
console.log('  Type "draw" to draw!');
console.log('');

rl.prompt();

rl.on('line', async (line) => {
  try {
    const trimmed = line.trim();

    // Empty line: just print blank
    if (trimmed === '') {
      console.log('');
      logger.log({ type: 'input', raw: '', display: '' });
      rl.prompt();
      return;
    }

    // Draw command
    if (trimmed.toLowerCase() === 'draw') {
      logger.log({ type: 'input', raw: trimmed, display: '[entering drawing mode]' });
      rl.pause();
      await enterDrawingMode(logger);
      rl.resume();
      rl.prompt();
      return;
    }

    // Evaluate expression
    const result = evaluate(trimmed);
    const display = render(result);
    console.log(display);

    logger.log({
      type: 'input',
      raw: trimmed,
      output: result,
      display: display.replace(/\x1b\[[^m]*m/g, ''), // strip ANSI for log readability
    });
  } catch {
    // Never crash: echo the input back
    console.log(line);
    logger.log({ type: 'input', raw: line, display: line });
  }

  rl.prompt();
});

rl.on('close', () => {
  logger.log({ type: 'end' });
  console.log('\nBye! 👋');
  process.exit(0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  logger.log({ type: 'end' });
  console.log('\nBye! 👋');
  process.exit(0);
});
