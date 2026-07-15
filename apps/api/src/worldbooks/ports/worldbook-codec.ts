import type { Worldbook, WorldbookEntry } from '../domain/worldbook.js';

export const WORLDBOOK_CODEC = Symbol('WorldbookCodec');

export type ImportedWorldbook = Omit<
  Worldbook,
  | 'id'
  | 'ownerUserId'
  | 'visibility'
  | 'entries'
  | 'sourceFormat'
  | 'createdAtMs'
  | 'updatedAtMs'
  | 'lastUsedAtMs'
  | 'usageCount'
> & {
  entries: ImportedWorldbookEntry[];
};

export type ImportedWorldbookEntry = Omit<
  WorldbookEntry,
  'id' | 'worldbookId' | 'createdAtMs' | 'updatedAtMs'
>;

export interface ImportWorldbookFile {
  fileName: string;
  content: Buffer;
}

export interface WorldbookCodec {
  importFile(file: ImportWorldbookFile): ImportedWorldbook;
  exportWorldbook(worldbook: Worldbook): object;
}
