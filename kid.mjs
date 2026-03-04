#!/usr/bin/env node

import { createInterface } from 'node:readline';
import { evaluate } from './lib/parser.mjs';
import { render } from './lib/display.mjs';
import { createLogger } from './lib/logger.mjs';
import { enterDrawingMode } from './lib/drawing.mjs';
import { exportDrawing } from './lib/export.mjs';

const logger = createLogger();

let rl;
let lastDrawing = null;

function startRepl() {
  rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
  });

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
        rl.close();
        const canvasData = await enterDrawingMode(logger);
        lastDrawing = canvasData;
        startRepl();
        return;
      }

      // Print command: export last drawing to PNG
      if (trimmed.toLowerCase() === 'print') {
        if (!lastDrawing) {
          console.log('No drawing yet! Type "draw" first.');
        } else {
          try {
            const filepath = exportDrawing(lastDrawing);
            console.log(`Saved! ${filepath}`);
            logger.log({ type: 'print', filepath });
          } catch {
            console.log('Could not save drawing.');
          }
        }
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
    // Only exit if not restarting (drawing mode calls rl.close then startRepl)
  });
}

// Welcome message
console.log('');
console.log('  Welcome! Type anything and press Enter.');
console.log('  Try: 4 + 4, 3 trex, 5 red, red + blue');
console.log('  Type "draw" to draw, "print" to save!');
console.log('');

startRepl();

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  logger.log({ type: 'end' });
  console.log('\nBye! 👋');
  process.exit(0);
});
