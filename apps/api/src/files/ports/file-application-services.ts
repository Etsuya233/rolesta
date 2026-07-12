export const FILE_ID_GENERATOR = Symbol('FileIdGenerator');
export const FILE_CLOCK = Symbol('FileClock');
export const FILE_CONTENT_HASHER = Symbol('FileContentHasher');

export interface FileIdGenerator {
  createId(): string;
}

export interface FileClock {
  nowMs(): number;
}

export interface FileContentHasher {
  sha256(content: Buffer): string;
}
