import { Injectable } from '@nestjs/common';
import type { SessionsTable } from '@rolesta/db';
import type { Selectable } from 'kysely';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { SessionStore } from '../ports/auth-ports.js';
import { Session } from '../domain/session.js';
import { AuthPortError } from '../ports/auth-port-error.js';

@Injectable()
export class KyselySessionStore implements SessionStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async save(session: Session): Promise<void> {
    try {
      const snapshot = session.toSnapshot();

      await this.context.database
        .insertInto('sessions')
        .values({
          id: snapshot.tokenHash,
          user_id: snapshot.userId,
          expires_at: snapshot.expiresAt,
          created_at: snapshot.createdAt,
        })
        .execute();
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-store-failed',
        params: { operation: 'save' },
        cause: error,
      });
    }
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    try {
      const row = await this.context.database
        .selectFrom('sessions')
        .selectAll()
        .where('id', '=', tokenHash)
        .executeTakeFirst();

      return row ? toSession(row) : null;
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-store-failed',
        params: { operation: 'findByTokenHash' },
        cause: error,
      });
    }
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    try {
      await this.context.database
        .deleteFrom('sessions')
        .where('id', '=', tokenHash)
        .execute();
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-store-failed',
        params: { operation: 'deleteByTokenHash' },
        cause: error,
      });
    }
  }

  async deleteExpired(now: Date): Promise<void> {
    try {
      await this.context.database
        .deleteFrom('sessions')
        .where('expires_at', '<=', now.toISOString())
        .execute();
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-store-failed',
        params: { operation: 'deleteExpired' },
        cause: error,
      });
    }
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
