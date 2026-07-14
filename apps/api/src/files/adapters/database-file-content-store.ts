import { Injectable } from '@nestjs/common';
import { Readable } from 'node:stream';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { FileContentStore } from '../ports/file-content-store.js';
import { FilePortError } from '../ports/file-port-error.js';

@Injectable()
export class DatabaseFileContentStore implements FileContentStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async save(storageKey: string, content: Buffer): Promise<void> {
    try {
      await this.context.database
        .insertInto('file_contents')
        .values({ storage_key: storageKey, content })
        .execute();
    } catch (cause) {
      throw new FilePortError({
        reason: 'content-conflict',
        params: { storageKey },
        cause,
      });
    }
  }

  async open(storageKey: string): Promise<Readable> {
    const row = await this.context.database
      .selectFrom('file_contents')
      .select('content')
      .where('storage_key', '=', storageKey)
      .executeTakeFirst();

    if (!row) {
      throw new FilePortError({
        reason: 'content-unavailable',
        params: { storageKey },
      });
    }

    return Readable.from(Buffer.from(row.content));
  }

  async delete(storageKey: string): Promise<void> {
    await this.context.database
      .deleteFrom('file_contents')
      .where('storage_key', '=', storageKey)
      .execute();
  }
}
