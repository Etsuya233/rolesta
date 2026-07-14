import { Module } from '@nestjs/common';
import { UNIT_OF_WORK } from '../common/application/unit-of-work.js';
import { databaseProvider, DatabaseLifecycle } from './database.provider.js';
import { KyselyDatabaseContext } from './kysely-database-context.js';
import { KyselyUnitOfWork } from './kysely-unit-of-work.js';

@Module({
  providers: [
    databaseProvider,
    DatabaseLifecycle,
    KyselyDatabaseContext,
    KyselyUnitOfWork,
    { provide: UNIT_OF_WORK, useExisting: KyselyUnitOfWork },
  ],
  exports: [KyselyDatabaseContext, UNIT_OF_WORK],
})
export class DatabaseModule {}
