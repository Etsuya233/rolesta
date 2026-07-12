import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FileContentStore } from '../ports/file-content-store.js';
import { FilePortError } from '../ports/file-port-error.js';

@Injectable()
export class LocalFileContentStore implements FileContentStore {
  constructor(private readonly rootDirectory: string) {}

  async save(storageKey: string, content: Buffer): Promise<void> {
    const filePath = this.filePath(storageKey);

    try {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content, { flag: 'wx' });
    } catch (cause) {
      throw new FilePortError({ reason: 'content-conflict', params: { storageKey }, cause });
    }
  }

  async open(storageKey: string) {
    const filePath = this.filePath(storageKey);

    try {
      await access(filePath);
    } catch (cause) {
      throw new FilePortError({ reason: 'content-unavailable', params: { storageKey }, cause });
    }

    return createReadStream(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.filePath(storageKey));
  }

  private filePath(storageKey: string): string {
    return path.join(this.rootDirectory, storageKey.slice(0, 2), storageKey.slice(2));
  }
}
