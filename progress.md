Original prompt: is there a way to make the draw tool have a black background

## 2026-08-02

- Requested behavior clarified as modes: `draw black` and `draw white`.
- Plain `draw`, `color`, and `colour` remain white for backward compatibility.
- Browser implementation now carries the selected background through the live canvas, drawing log, and saved PNG.
- Added deterministic browser-test hooks: `render_game_to_text` reports draw mode/background/cursor/pen/color/cell count; `advanceTime` is a no-op because this tool has no timed simulation.
- Browser tests passed for `draw black`, `draw white`, and plain `draw`: commands enter the expected mode, drawing stamps cells, screenshots match the requested backgrounds, saved PNG corner pixels match the live canvas, and no console errors appeared.
- Screenshots were visually inspected at `output/draw-modes/black.png` and `output/draw-modes/white.png`.
- TODO: merge through a PR, deploy on mini4, and verify the live service.
