import { CharacterApplicationError } from '../application/character-application-error.js';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function readSillyTavernPngMetadata(file: Buffer): unknown {
  if (file.length < pngSignature.length || !file.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new CharacterApplicationError('invalid-import-file');
  }

  const textChunks = pngTextChunks(file);
  const encodedMetadata = textChunks.get('chara') ?? textChunks.get('ccv3');

  if (encodedMetadata === undefined) {
    throw new CharacterApplicationError('invalid-import-file');
  }

  return jsonFromBase64(encodedMetadata);
}

function pngTextChunks(file: Buffer): Map<string, string> {
  const chunks = new Map<string, string>();
  let offset = pngSignature.length;

  while (offset + 12 <= file.length) {
    const length = file.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;

    if (nextOffset > file.length) {
      throw new CharacterApplicationError('invalid-import-file');
    }

    const type = file.subarray(typeStart, dataStart).toString('latin1');

    if (type === 'tEXt') {
      addTextChunk(chunks, file.subarray(dataStart, dataEnd));
    }

    if (type === 'IEND') {
      return chunks;
    }

    offset = nextOffset;
  }

  throw new CharacterApplicationError('invalid-import-file');
}

function addTextChunk(chunks: Map<string, string>, data: Buffer): void {
  const separatorIndex = data.indexOf(0);

  if (separatorIndex < 1) {
    throw new CharacterApplicationError('invalid-import-file');
  }

  const key = data.subarray(0, separatorIndex).toString('latin1');
  const value = data.subarray(separatorIndex + 1).toString('latin1');
  chunks.set(key, value);
}

function jsonFromBase64(value: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8')) as unknown;
  } catch {
    throw new CharacterApplicationError('invalid-import-file');
  }
}
