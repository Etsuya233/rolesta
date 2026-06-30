import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createSqliteDatabase, type Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import type { AppConfig } from '../config/app-config.js';
import { APP_CONFIG } from '../config/config.module.js';

export const KYSELY_DB = Symbol('KYSELY_DB');

@Injectable()
export class DatabaseLifecycle implements OnModuleDestroy {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}

export const databaseProvider = {
  provide: KYSELY_DB,
  useFactory: (config: AppConfig): Kysely<Database> => {
    return createSqliteDatabase({ databasePath: config.sqliteDatabasePath });
  },
  inject: [APP_CONFIG],
};
