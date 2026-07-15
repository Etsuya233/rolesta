import { AsyncLocalStorage } from 'node:async_hooks';
import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '@rolesta/db';
import type { Kysely, Transaction } from 'kysely';
import { KYSELY_DB } from './database.provider.js';

export type KyselyQueryExecutor = Omit<
  Kysely<Database>,
  'transaction' | 'startTransaction' | 'connection' | 'destroy'
>;

@Injectable()
export class KyselyDatabaseContext {
  private readonly transactions = new AsyncLocalStorage<Transaction<Database>>();

  constructor(@Inject(KYSELY_DB) private readonly rootDatabase: Kysely<Database>) {}

  get database(): KyselyQueryExecutor {
    return this.transactions.getStore() ?? this.rootDatabase;
  }

  get hasTransaction(): boolean {
    return this.transactions.getStore() !== undefined;
  }

  withinTransaction<TResult>(
    transaction: Transaction<Database>,
    operation: () => Promise<TResult>,
  ): Promise<TResult> {
    return this.transactions.run(transaction, operation);
  }
}
