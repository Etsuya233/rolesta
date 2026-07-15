import { describe, expect, it } from 'vitest';
import { readSillyTavernPngMetadata } from './silly-tavern-png-metadata-reader.js';

describe('readSillyTavernPngMetadata', () => {
  it('reads base64 character metadata from a PNG tEXt chunk', () => {
    const json = Buffer.from(
      JSON.stringify({ name: 'PNG Card', first_mes: 'Hello' }),
      'utf8',
    ).toString('base64');
    const png = createPngWithTextChunk('chara', json);

    expect(readSillyTavernPngMetadata(png)).toEqual({ name: 'PNG Card', first_mes: 'Hello' });
  });
});

function createPngWithTextChunk(key: string, value: string): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]);
  const text = Buffer.from(`${key}\0${value}`, 'latin1');

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('tEXt', text),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'latin1');
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(input: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of input) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
