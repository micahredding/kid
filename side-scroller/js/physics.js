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

// Get the tile at a world position
export function getTileAt(level, worldX, worldY) {
  const ts = CONFIG.tile.size;
  const col = Math.floor(worldX / ts);
  const row = Math.floor(worldY / ts);
  if (row < 0 || row >= level.tiles.length) return null;
  if (col < 0 || col >= level.tiles[row].length) return null;
  const ch = level.tiles[row][col];
  return ch && ch !== ' ' && ch !== 'C' && ch !== 'E' && ch !== 'K' && ch !== 'F' && ch !== 'X' && ch !== 'D' && ch !== 'A' && ch !== 'H' && ch !== 'N' && ch !== 'Y' && ch !== 'y' && ch !== 'J' && ch !== 'j' && ch !== 'L' && ch !== 'l' ? ch : null;
}

// Check if a tile character is solid
export function isSolid(ch) {
  if (!ch || ch === ' ' || ch === 'C' || ch === 'E' || ch === 'K' || ch === 'F' || ch === 'X' || ch === 'D' || ch === 'A' || ch === 'H' || ch === 'N' || ch === 'Y' || ch === 'y' || ch === 'J' || ch === 'j' || ch === 'L' || ch === 'l') return false;
  if (ch === 'I') return false; // one-way platforms handled separately
  return true;
}

// Check if a tile is a one-way platform
export function isOneWay(ch) {
  return ch === 'I';
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
  const bottom2 = Math.floor((entity.y + entity.height - 1) / ts);

  for (let row = top2; row <= bottom2; row++) {
    for (let col = left2; col <= right2; col++) {
      const ch = getTileChar(level, col, row);

      // One-way platform: only collide when falling and feet were above platform
      if (isOneWay(ch)) {
        if (entity.vy > 0) {
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
