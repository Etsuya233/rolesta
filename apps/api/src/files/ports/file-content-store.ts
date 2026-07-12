import type { Readable } from 'node:stream';

export const FILE_CONTENT_STORE = Symbol('FileContentStore');

export interface FileContentStore {
  save(storageKey: string, content: Buffer): Promise<void>;
  open(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
}
