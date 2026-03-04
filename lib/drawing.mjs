import { COLOR_CYCLE, colorBlock, rgbTo256 } from './colors.mjs';

export function enterDrawingMode(logger) {
  return new Promise((resolve) => {
    const cols = process.stdout.columns || 80;
    const rows = (process.stdout.rows || 24) - 1; // reserve bottom row for status

    // Canvas: 2D grid of { char, color (rgb array or null) }
    const grid = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ char: ' ', color: null }))
    );

    let cursorX = Math.floor(cols / 2);
    let cursorY = Math.floor(rows / 2);
    let colorIndex = 0;

    function clamp() {
      cursorX = Math.max(0, Math.min(cursorX, cols - 1));
      cursorY = Math.max(0, Math.min(cursorY, rows - 1));
    }

    function renderCanvas() {
      // Move to top-left
      let out = '\x1b[H';

      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) {
          const cell = grid[y][x];
          if (cell.color) {
            line += `\x1b[48;5;${rgbTo256(cell.color[0], cell.color[1], cell.color[2])}m \x1b[0m`;
          } else {
            line += cell.char;
          }
        }
        out += line;
        if (y < rows - 1) out += '\r\n';
      }

      // Status bar at bottom
      const currentColor = COLOR_CYCLE[colorIndex % COLOR_CYCLE.length];
      const colorPreview = colorBlock(currentColor.rgb);
      const status = ` Drawing mode | Space: ${colorPreview} ${currentColor.name || 'color'} | Arrows: move | ESC: exit `;
      out += '\r\n';
      out += `\x1b[7m${status.padEnd(cols)}\x1b[0m`;

      // Position cursor
      out += `\x1b[${cursorY + 1};${cursorX + 1}H`;

      process.stdout.write(out);
    }

    function handleKey(data) {
      const key = data.toString();

      // Escape: exit drawing mode
      if (key === '\x1b' && data.length === 1) {
        cleanup();
        return;
      }

      // Ctrl+C: exit drawing mode (safety valve)
      if (key === '\x03') {
        cleanup();
        return;
      }

      // Arrow keys (escape sequences)
      if (key === '\x1b[A') { cursorY--; clamp(); renderCanvas(); return; } // up
      if (key === '\x1b[B') { cursorY++; clamp(); renderCanvas(); return; } // down
      if (key === '\x1b[C') { cursorX++; clamp(); renderCanvas(); return; } // right
      if (key === '\x1b[D') { cursorX--; clamp(); renderCanvas(); return; } // left

      // Space: place colored block and cycle color
      if (key === ' ') {
        const color = COLOR_CYCLE[colorIndex % COLOR_CYCLE.length];
        grid[cursorY][cursorX] = { char: ' ', color: color.rgb };
        colorIndex++;
        cursorX++;
        clamp();
        renderCanvas();
        return;
      }

      // Enter: move down
      if (key === '\r' || key === '\n') {
        cursorY++;
        cursorX = 0;
        clamp();
        renderCanvas();
        return;
      }

      // Backspace: clear cell and move back
      if (key === '\x7f' || key === '\x08') {
        grid[cursorY][cursorX] = { char: ' ', color: null };
        cursorX--;
        clamp();
        renderCanvas();
        return;
      }

      // Tab: skip forward
      if (key === '\t') {
        cursorX += 4;
        clamp();
        renderCanvas();
        return;
      }

      // Printable character: place it at cursor
      if (key.length === 1 && key.charCodeAt(0) >= 32) {
        grid[cursorY][cursorX] = { char: key, color: null };
        cursorX++;
        clamp();
        renderCanvas();
        return;
      }

      // Ignore everything else
    }

    function cleanup() {
      process.stdin.removeListener('data', handleKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();

      // Serialize canvas for logging
      const canvasData = grid.map(row =>
        row.map(cell => ({
          char: cell.char,
          color: cell.color,
        }))
      );

      logger.log({ type: 'drawing', canvas: canvasData });

      // Clear screen and show the drawing one more time as static output
      process.stdout.write('\x1b[2J\x1b[H');

      // Render the drawing as final output
      for (let y = 0; y < rows; y++) {
        let hasContent = false;
        for (let x = 0; x < cols; x++) {
          if (grid[y][x].color || grid[y][x].char !== ' ') { hasContent = true; break; }
        }
        if (!hasContent) continue;

        let line = '';
        // Find last non-empty cell to trim trailing blanks
        let lastX = 0;
        for (let x = cols - 1; x >= 0; x--) {
          if (grid[y][x].color || grid[y][x].char !== ' ') { lastX = x; break; }
        }
        for (let x = 0; x <= lastX; x++) {
          const cell = grid[y][x];
          if (cell.color) {
            line += `\x1b[48;5;${rgbTo256(cell.color[0], cell.color[1], cell.color[2])}m \x1b[0m`;
          } else {
            line += cell.char;
          }
        }
        process.stdout.write(line + '\n');
      }

      process.stdout.write('\n');
      resolve(canvasData);
    }

    // Enter raw mode
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', handleKey);

    // Clear screen and render initial canvas
    process.stdout.write('\x1b[2J');
    renderCanvas();
  });
}
