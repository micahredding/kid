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
    let penDown = false;
    let awaitingColor = false;   // true after Tab, waiting for a 1-9/0 quick-pick digit
    const undoStack = [];   // rewindable — consumed by undo
    const history = [];     // append-only — every action, kept for the record

    function clamp() {
      cursorX = Math.max(0, Math.min(cursorX, cols - 1));
      cursorY = Math.max(0, Math.min(cursorY, rows - 1));
    }

    function sameCell(a, b) {
      if (a.char !== b.char) return false;
      if (!a.color && !b.color) return true;
      return !!a.color && !!b.color && a.color.every((v, i) => v === b.color[i]);
    }

    function setCell(x, y, cell) {
      const prev = grid[y][x];
      if (sameCell(prev, cell)) return;
      undoStack.push({ x, y, prev });
      if (undoStack.length > 2000) undoStack.shift();
      history.push({ action: 'set', x, y, prev: { ...prev }, next: { ...cell } });
      if (history.length > 20000) history.shift();
      grid[y][x] = cell;
    }

    function undoLast() {
      const last = undoStack.pop();
      if (!last) return;
      const undone = grid[last.y][last.x];
      grid[last.y][last.x] = last.prev;
      cursorX = last.x;
      cursorY = last.y;
      history.push({ action: 'undo', x: last.x, y: last.y, prev: { ...undone }, next: { ...last.prev } });
      if (history.length > 20000) history.shift();
    }

    function stamp() {
      if (penDown) {
        const color = COLOR_CYCLE[colorIndex % COLOR_CYCLE.length];
        setCell(cursorX, cursorY, { char: ' ', color: color.rgb });
      }
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
      const penStatus = penDown ? 'PEN DOWN' : 'pen up';
      const pick = awaitingColor ? ' press 1-9/0 |' : '';
      const status = ` ${penStatus} | ${colorPreview} ${currentColor.name || 'color'} |${pick} Space: pen | Tab+1-0: color | Del: undo | ESC: exit `;
      out += '\r\n';
      out += `\x1b[7m${status.padEnd(cols)}\x1b[0m`;

      // Position cursor
      out += `\x1b[${cursorY + 1};${cursorX + 1}H`;

      process.stdout.write(out);
    }

    function handleKey(data) {
      const key = data.toString();

      // Armed by a preceding Tab: the next digit jumps straight to that palette
      // color (1=first … 9=ninth, 0=tenth). Anything else cancels the arm and
      // falls through to normal handling below.
      if (awaitingColor) {
        awaitingColor = false;
        if (/^[0-9]$/.test(key)) {
          const n = key === '0' ? 10 : Number(key);
          if (n >= 1 && n <= COLOR_CYCLE.length) colorIndex = n - 1;
          renderCanvas();
          return;
        }
      }

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

      // Arrow keys: move cursor, stamp if pen is down
      if (key === '\x1b[A') { stamp(); cursorY--; clamp(); stamp(); renderCanvas(); return; }
      if (key === '\x1b[B') { stamp(); cursorY++; clamp(); stamp(); renderCanvas(); return; }
      if (key === '\x1b[C') { stamp(); cursorX++; clamp(); stamp(); renderCanvas(); return; }
      if (key === '\x1b[D') { stamp(); cursorX--; clamp(); stamp(); renderCanvas(); return; }

      // Space: toggle pen down/up
      if (key === ' ') {
        penDown = !penDown;
        if (penDown) stamp(); // stamp current cell when pen goes down
        renderCanvas();
        return;
      }

      // Tab: cycle color one step, and arm quick-pick (press a digit next to jump)
      if (key === '\t') {
        colorIndex++;
        awaitingColor = true;
        renderCanvas();
        return;
      }

      // Enter: move straight down, staying in the same column (not a carriage return)
      if (key === '\r' || key === '\n') {
        stamp();
        cursorY++;
        clamp();
        stamp();
        renderCanvas();
        return;
      }

      // Delete / Backspace: undo the last change, cursor follows (hold to rewind)
      if (key === '\x1b[3~' || key === '\x7f' || key === '\x08') {
        undoLast();
        renderCanvas();
        return;
      }

      // Printable character: place it at cursor, advance
      if (key.length === 1 && key.charCodeAt(0) >= 32) {
        setCell(cursorX, cursorY, { char: key, color: null });
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

      // Serialize canvas for logging
      const canvasData = grid.map(row =>
        row.map(cell => ({
          char: cell.char,
          color: cell.color,
        }))
      );

      logger.log({ type: 'drawing', canvas: canvasData, history });

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
