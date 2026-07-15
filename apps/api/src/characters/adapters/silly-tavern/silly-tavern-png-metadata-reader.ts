import { CharacterPortError } from '../../ports/character-port-error.js';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function readSillyTavernPngMetadata(file: Buffer, fileName?: string): unknown {
  if (
    file.length < pngSignature.length ||
    !file.subarray(0, pngSignature.length).equals(pngSignature)
  ) {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        field: 'png-signature',
        detail: 'Invalid PNG signature.',
      },
    });
  }

  const textChunks = pngTextChunks(file, fileName);
  const encodedMetadata = textChunks.get('chara') ?? textChunks.get('ccv3');

  if (encodedMetadata === undefined) {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        field: 'metadata-chunk',
        detail: 'Missing SillyTavern metadata chunk.',
      },
    });
  }

  return jsonFromBase64(encodedMetadata, fileName);
}

function pngTextChunks(file: Buffer, fileName?: string): Map<string, string> {
  const chunks = new Map<string, string>();
  let offset = pngSignature.length;

  while (offset + 12 <= file.length) {
    const length = file.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;

    if (nextOffset > file.length) {
      throw new CharacterPortError({
        reason: 'invalid-import-file',
        params: {
          ...(fileName !== undefined ? { fileName } : {}),
          field: 'png-chunk',
          detail: 'Invalid PNG chunk boundary.',
        },
      });
    }

    const type = file.subarray(typeStart, dataStart).toString('latin1');

    if (type === 'tEXt') {
      addTextChunk(chunks, file.subarray(dataStart, dataEnd), fileName);
    }

    if (type === 'IEND') {
      return chunks;
    }

    offset = nextOffset;
  }

  throw new CharacterPortError({
    reason: 'invalid-import-file',
    params: {
      ...(fileName !== undefined ? { fileName } : {}),
      field: 'png-stream',
      detail: 'PNG stream ended unexpectedly.',
    },
  });
}

function addTextChunk(chunks: Map<string, string>, data: Buffer, fileName?: string): void {
  const separatorIndex = data.indexOf(0);

  if (separatorIndex < 1) {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        field: 'text-chunk',
        detail: 'Invalid PNG text chunk.',
      },
    });
  }

  const key = data.subarray(0, separatorIndex).toString('latin1');
  const value = data.subarray(separatorIndex + 1).toString('latin1');
  chunks.set(key, value);
}

function jsonFromBase64(value: string, fileName?: string): unknown {
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8')) as unknown;
  } catch {
    throw new CharacterPortError({
      reason: 'invalid-import-file',
      params: {
        ...(fileName !== undefined ? { fileName } : {}),
        field: 'metadata-json',
        detail: 'Invalid base64 encoded JSON.',
      },
    });
  }
}
