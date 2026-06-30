import { Module } from '@nestjs/common';
import { databaseProvider, DatabaseLifecycle, KYSELY_DB } from './database.provider.js';

@Module({
  providers: [databaseProvider, DatabaseLifecycle],
  exports: [KYSELY_DB],
})
export class DatabaseModule {}
