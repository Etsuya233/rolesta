import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import type { UnitOfWork } from '../common/application/unit-of-work.js';
import { KyselyDatabaseContext } from './kysely-database-context.js';
import { KYSELY_DB } from './database.provider.js';

@Injectable()
export class KyselyUnitOfWork implements UnitOfWork {
  constructor(
    @Inject(KYSELY_DB) private readonly database: Kysely<Database>,
    private readonly context: KyselyDatabaseContext,
  ) {}

  run<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    if (this.context.hasTransaction) {
      return operation();
    }

    return this.database
      .transaction()
      .execute((transaction) =>
        this.context.withinTransaction(transaction, operation),
      );
  }
}
