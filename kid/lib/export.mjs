import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = join(__dirname, '..');

const CELL_SIZE = 10; // pixels per canvas cell

// Generate a minimal valid PNG from canvas data
export function exportDrawing(canvasData) {
  // Find bounding box of actual content
  let minY = canvasData.length, maxY = 0, minX = canvasData[0].length, maxX = 0;
  for (let y = 0; y < canvasData.length; y++) {
    for (let x = 0; x < canvasData[y].length; x++) {
      if (canvasData[y][x].color || canvasData[y][x].char !== ' ') {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  // If nothing drawn, use a small default area
  if (minY > maxY) {
    minY = 0; maxY = 0; minX = 0; maxX = 0;
  }

  // Add 1 cell padding
  minY = Math.max(0, minY - 1);
  minX = Math.max(0, minX - 1);
  maxY = Math.min(canvasData.length - 1, maxY + 1);
  maxX = Math.min(canvasData[0].length - 1, maxX + 1);

  const cellCols = maxX - minX + 1;
  const cellRows = maxY - minY + 1;
  const width = cellCols * CELL_SIZE;
  const height = cellRows * CELL_SIZE;

  // Build raw pixel data (RGB, with filter byte per row)
  const rawData = Buffer.alloc(height * (1 + width * 3));

  for (let py = 0; py < height; py++) {
    const rowOffset = py * (1 + width * 3);
    rawData[rowOffset] = 0; // filter: none

    const cellY = minY + Math.floor(py / CELL_SIZE);

    for (let px = 0; px < width; px++) {
      const cellX = minX + Math.floor(px / CELL_SIZE);
      const cell = canvasData[cellY]?.[cellX];
      const offset = rowOffset + 1 + px * 3;

      if (cell?.color) {
        rawData[offset] = cell.color[0];
        rawData[offset + 1] = cell.color[1];
        rawData[offset + 2] = cell.color[2];
      } else if (cell?.char && cell.char !== ' ') {
        // Text cells: dark gray on light gray
        // Simple: just make them dark
        rawData[offset] = 60;
        rawData[offset + 1] = 60;
        rawData[offset + 2] = 60;
      } else {
        // Empty: white
        rawData[offset] = 255;
        rawData[offset + 1] = 255;
        rawData[offset + 2] = 255;
      }
    }
  }

  const compressed = deflateSync(rawData);

  // Build PNG file
  const png = buildPng(width, height, compressed);

  // Write to prints directory
  const printsDir = join(baseDir, 'prints');
  mkdirSync(printsDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = join(printsDir, `drawing-${timestamp}.png`);
  writeFileSync(filepath, png);

  return filepath;
}

function buildPng(width, height, compressedData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

// CRC32 for PNG chunks
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
