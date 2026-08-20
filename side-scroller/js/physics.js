// =============================================================================
// PHYSICS — Collision detection and resolution
// =============================================================================

import { CONFIG } from './config.js';

// Axis-Aligned Bounding Box overlap test
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Markers that the level loader turns into entities — they leave no tile behind
const ENTITY_CHARS = new Set(['C', 'E', 'K', 'F', 'X', 'D', 'A', 'H', 'N', 'Y', 'y', 'J', 'j', 'L', 'l']);

// Get the tile at a world position
export function getTileAt(level, worldX, worldY) {
  const ts = CONFIG.tile.size;
  const col = Math.floor(worldX / ts);
  const row = Math.floor(worldY / ts);
  if (row < 0 || row >= level.tiles.length) return null;
  if (col < 0 || col >= level.tiles[row].length) return null;
  const ch = level.tiles[row][col];
  return ch && ch !== ' ' && !ENTITY_CHARS.has(ch) ? ch : null;
}

// Check if a tile character is solid
export function isSolid(ch) {
  if (!ch || ch === ' ' || ENTITY_CHARS.has(ch)) return false;
  if (isOneWay(ch)) return false; // one-way platforms handled separately
  return true;
}

// Check if a tile is a one-way platform: you land on top of it, but you pass
// up through it from below and never fall through it from above.
//   I = plank / ledge   = = ladder   c = cloud
export function isOneWay(ch) {
  return ch === 'I' || ch === '=' || ch === 'c';
}

// Ladders are one-way tiles you can also climb. Making them one-way is what
// keeps a ladder hole in a walkway from being a trapdoor: you walk over it,
// and only go down by deliberately pressing down (which sets entity.climbing,
// and climbing entities ignore one-way tiles entirely).
export function isLadder(ch) {
  return ch === '=';
}

// Resolve collisions between an entity and the tile map
// Returns collision info: { top, bottom, left, right }
export function resolveEntityTileCollisions(entity, level, dt) {
  const ts = CONFIG.tile.size;
  const collisions = { top: false, bottom: false, left: false, right: false };

  // Move X first, then Y (separating axis)

  // --- Horizontal ---
  entity.x += entity.vx;

  const left = Math.floor(entity.x / ts);
  const right = Math.floor((entity.x + entity.width - 1) / ts);
  const top = Math.floor(entity.y / ts);
  const bottom = Math.floor((entity.y + entity.height - 1) / ts);

  for (let row = top; row <= bottom; row++) {
    for (let col = left; col <= right; col++) {
      const ch = getTileChar(level, col, row);
      if (!isSolid(ch)) continue;

      const tileRect = { x: col * ts, y: row * ts, width: ts, height: ts };
      if (aabbOverlap(entity, tileRect)) {
        if (entity.vx > 0) {
          entity.x = tileRect.x - entity.width;
          collisions.right = true;
        } else if (entity.vx < 0) {
          entity.x = tileRect.x + ts;
          collisions.left = true;
        }
        entity.vx = 0;
      }
    }
  }

  // --- Vertical ---
  entity.y += entity.vy;

  const left2 = Math.floor(entity.x / ts);
  const right2 = Math.floor((entity.x + entity.width - 1) / ts);
  const top2 = Math.floor(entity.y / ts);
  // Include the row the feet rest ON, not just the one they are inside. Solid
  // tiles there can't overlap (the AABB test rules them out), but a one-way
  // platform needs to be seen the frame the feet touch its top edge —
  // otherwise footing on planks, clouds and ladders sinks a pixel and snaps
  // back forever, flickering onGround at 30Hz.
  const bottom2 = Math.floor((entity.y + entity.height) / ts);

  for (let row = top2; row <= bottom2; row++) {
    for (let col = left2; col <= right2; col++) {
      const ch = getTileChar(level, col, row);

      // One-way platform: only collide when falling and feet were above platform
      if (isOneWay(ch)) {
        if (entity.vy > 0 && !entity.climbing) {
          const tileTop = row * ts;
          const entityBottom = entity.y + entity.height;
          const prevBottom = entityBottom - entity.vy;
          if (prevBottom <= tileTop + 2) {
            entity.y = tileTop - entity.height;
            entity.vy = 0;
            collisions.bottom = true;
          }
        }
        continue;
      }

      if (!isSolid(ch)) continue;

      const tileRect = { x: col * ts, y: row * ts, width: ts, height: ts };
      if (aabbOverlap(entity, tileRect)) {
        if (entity.vy > 0) {
          entity.y = tileRect.y - entity.height;
          collisions.bottom = true;
          entity.vy = 0;
        } else if (entity.vy < 0) {
          entity.y = tileRect.y + ts;
          collisions.top = true;
          entity.vy = 0;

          // Hit a question block from below
          if (ch === '?' && entity.isPlayer) {
            entity.onHitBlock?.(col, row, ch);
          }
        }
      }
    }
  }

  return collisions;
}

function getTileChar(level, col, row) {
  if (row < 0 || row >= level.tiles.length) return null;
  if (col < 0 || col >= level.tiles[row].length) return null;
  return level.tiles[row][col];
}

// Check if entity is touching a wall (for wall slide/jump)
// Returns: -1 (wall on left), 1 (wall on right), 0 (no wall)
export function getTouchingWall(entity, level) {
  const ts = CONFIG.tile.size;
  const top = Math.floor((entity.y + 4) / ts);
  const bottom = Math.floor((entity.y + entity.height - 4) / ts);

  // Check left
  const leftCol = Math.floor((entity.x - 1) / ts);
  for (let row = top; row <= bottom; row++) {
    const ch = getTileChar(level, leftCol, row);
    if (isSolid(ch)) return -1;
  }

  // Check right
  const rightCol = Math.floor((entity.x + entity.width) / ts);
  for (let row = top; row <= bottom; row++) {
    const ch = getTileChar(level, rightCol, row);
    if (isSolid(ch)) return 1;
  }

  return 0;
}

// Check if entity is standing on ground (for coyote time checks)
export function isOnGround(entity, level) {
  const ts = CONFIG.tile.size;
  const feetY = entity.y + entity.height + 1;
  const left = Math.floor(entity.x / ts);
  const right = Math.floor((entity.x + entity.width - 1) / ts);
  const row = Math.floor(feetY / ts);

  for (let col = left; col <= right; col++) {
    const ch = getTileChar(level, col, row);
    if (isSolid(ch) || isOneWay(ch)) return true;
  }
  return false;
}

// --- Ladders ---------------------------------------------------------------
// Which ladder column an entity is on, if any. Uses the entity's centre so a
// wide character can't straddle two ladders, and returns the column so the
// climber can be eased onto its centre line.
export function ladderColumnAt(entity, level) {
  const ts = CONFIG.tile.size;
  const col = Math.floor((entity.x + entity.width / 2) / ts);
  // Grip is measured at the feet, not over the whole body, so a tall
  // character lets go of the top rung at the same height a short one does:
  // the moment its feet clear the topmost ladder tile — which is laid in the
  // floor of the deck the ladder serves, so clearing it means standing on it.
  const feetRow = Math.floor((entity.y + entity.height - 1) / ts);
  for (let row = feetRow - 1; row <= feetRow; row++) {
    if (isLadder(getTileChar(level, col, row))) return col;
  }
  return null;
}

// A ladder directly under the entity's feet — how you start climbing down
// from a walkway that has a ladder let into it.
export function ladderColumnBelow(entity, level) {
  const ts = CONFIG.tile.size;
  const col = Math.floor((entity.x + entity.width / 2) / ts);
  const row = Math.floor((entity.y + entity.height + 2) / ts);
  return isLadder(getTileChar(level, col, row)) ? col : null;
}
