import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import { Readable } from 'node:stream';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { FileContentStore } from '../ports/file-content-store.js';
import { FilePortError } from '../ports/file-port-error.js';

@Injectable()
export class DatabaseFileContentStore implements FileContentStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async save(storageKey: string, content: Buffer): Promise<void> {
    try {
      await this.db.insertInto('file_contents').values({ storage_key: storageKey, content }).execute();
    } catch (cause) {
      throw new FilePortError({ reason: 'content-conflict', params: { storageKey }, cause });
    }
  }

  async open(storageKey: string): Promise<Readable> {
    const row = await this.db
      .selectFrom('file_contents')
      .select('content')
      .where('storage_key', '=', storageKey)
      .executeTakeFirst();

    if (!row) {
      throw new FilePortError({ reason: 'content-unavailable', params: { storageKey } });
    }

    return Readable.from(Buffer.from(row.content));
  }

  async delete(storageKey: string): Promise<void> {
    await this.db.deleteFrom('file_contents').where('storage_key', '=', storageKey).execute();
  }
}
