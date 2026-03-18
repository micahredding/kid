// =============================================================================
// CAMERA — Smooth-following viewport with deadzone
// =============================================================================

import { CONFIG } from './config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
  }

  update(player, levelWidth, levelHeight) {
    const cam = CONFIG.camera;
    const cw = CONFIG.canvas.width;
    const ch = CONFIG.canvas.height;

    // Target position — center player with look-ahead
    const lookAhead = player.facing * cam.lookAheadX;
    const idealX = player.x + player.width / 2 - cw / 2 + lookAhead;
    const idealY = player.y + player.height / 2 - ch / 2;

    // Deadzone — only move if player exceeds deadzone boundaries
    const deadzoneL = this.x + cw * cam.deadzoneLeft;
    const deadzoneR = this.x + cw * cam.deadzoneRight;
    const deadzoneT = this.y + ch * cam.deadzoneTop;
    const deadzoneB = this.y + ch * cam.deadzoneBottom;

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    if (playerCenterX < deadzoneL) {
      this.targetX = playerCenterX - cw * cam.deadzoneLeft + lookAhead;
    } else if (playerCenterX > deadzoneR) {
      this.targetX = playerCenterX - cw * cam.deadzoneRight + lookAhead;
    }

    if (playerCenterY < deadzoneT) {
      this.targetY = playerCenterY - ch * cam.deadzoneTop;
    } else if (playerCenterY > deadzoneB) {
      this.targetY = playerCenterY - ch * cam.deadzoneBottom;
    }

    // Smooth lerp
    this.x += (this.targetX - this.x) * cam.smoothing;
    this.y += (this.targetY - this.y) * cam.smoothing;

    // Clamp to level bounds
    this.x = Math.max(0, Math.min(this.x, levelWidth - cw));
    this.y = Math.max(0, Math.min(this.y, levelHeight - ch));
  }

  // Apply camera transform to canvas context
  apply(ctx) {
    ctx.translate(-Math.round(this.x), -Math.round(this.y));
  }
}
