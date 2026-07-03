import { Inject, Injectable } from '@nestjs/common';
import type { Database, SessionsTable } from '@rolesta/db';
import type { Kysely, Selectable } from 'kysely';
import { KYSELY_DB } from '../../database/database.provider.js';
import type { SessionStore } from '../application/auth-ports.js';
import { Session } from '../domain/session.js';

@Injectable()
export class KyselySessionStore implements SessionStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async save(session: Session): Promise<void> {
    const snapshot = session.toSnapshot();

    await this.db
      .insertInto('sessions')
      .values({
        id: snapshot.tokenHash,
        user_id: snapshot.userId,
        expires_at: snapshot.expiresAt,
        created_at: snapshot.createdAt,
      })
      .execute();
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await this.db
      .selectFrom('sessions')
      .selectAll()
      .where('id', '=', tokenHash)
      .executeTakeFirst();

    return row ? toSession(row) : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.db.deleteFrom('sessions').where('id', '=', tokenHash).execute();
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.db.deleteFrom('sessions').where('expires_at', '<=', now.toISOString()).execute();
  }
}

function toSession(row: Selectable<SessionsTable>): Session {
  return Session.restore({
    tokenHash: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  });
}
