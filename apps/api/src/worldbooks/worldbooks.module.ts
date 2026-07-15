import { Module } from '@nestjs/common';
import { UNIT_OF_WORK, type UnitOfWork } from '../common/application/unit-of-work.js';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
import { CreateWorldbookEntryUseCase } from './application/create-worldbook-entry.use-case.js';
import { CreateWorldbookUseCase } from './application/create-worldbook.use-case.js';
import { DeleteWorldbookEntryUseCase } from './application/delete-worldbook-entry.use-case.js';
import { DeleteWorldbookUseCase } from './application/delete-worldbook.use-case.js';
import { ExportWorldbookUseCase } from './application/export-worldbook.use-case.js';
import { GetWorldbookUseCase } from './application/get-worldbook.use-case.js';
import { ImportWorldbookUseCase } from './application/import-worldbook.use-case.js';
import { ListWorldbooksUseCase } from './application/list-worldbooks.use-case.js';
import { UpdateWorldbookEntryOrderUseCase } from './application/update-worldbook-entry-order.use-case.js';
import { UpdateWorldbookEntryUseCase } from './application/update-worldbook-entry.use-case.js';
import { UpdateWorldbookDocumentUseCase } from './application/update-worldbook-document.use-case.js';
import { UpdateWorldbookUseCase } from './application/update-worldbook.use-case.js';
import type {
  WorldbookClock,
  WorldbookIdGenerator,
} from './application/worldbook-application-services.js';
import { SillyTavernWorldbookCodec } from './adapters/silly-tavern/silly-tavern-worldbook-codec.js';
import { WORLDBOOK_CODEC, type WorldbookCodec } from './ports/worldbook-codec.js';
import { WORLDBOOK_STORE, type WorldbookStore } from './ports/worldbook-store.js';
import { WorldbooksController } from './http/worldbooks.controller.js';
import { KyselyWorldbookStore } from './persistence/kysely-worldbook-store.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [WorldbooksController],
  providers: [
    KyselyWorldbookStore,
    SillyTavernWorldbookCodec,
    CryptoIdGenerator,
    SystemClock,
    { provide: WORLDBOOK_STORE, useExisting: KyselyWorldbookStore },
    { provide: WORLDBOOK_CODEC, useExisting: SillyTavernWorldbookCodec },
    {
      provide: ListWorldbooksUseCase,
      useFactory: (store: WorldbookStore) => new ListWorldbooksUseCase(store),
      inject: [WORLDBOOK_STORE],
    },
    {
      provide: GetWorldbookUseCase,
      useFactory: (store: WorldbookStore) => new GetWorldbookUseCase(store),
      inject: [WORLDBOOK_STORE],
    },
    {
      provide: CreateWorldbookUseCase,
      useFactory: (
        store: WorldbookStore,
        idGenerator: WorldbookIdGenerator,
        clock: WorldbookClock,
        unitOfWork: UnitOfWork,
      ) => new CreateWorldbookUseCase(store, idGenerator, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, CryptoIdGenerator, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdateWorldbookDocumentUseCase,
      useFactory: (
        store: WorldbookStore,
        idGenerator: WorldbookIdGenerator,
        clock: WorldbookClock,
        unitOfWork: UnitOfWork,
      ) => new UpdateWorldbookDocumentUseCase(store, idGenerator, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, CryptoIdGenerator, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdateWorldbookUseCase,
      useFactory: (store: WorldbookStore, clock: WorldbookClock, unitOfWork: UnitOfWork) =>
        new UpdateWorldbookUseCase(store, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: DeleteWorldbookUseCase,
      useFactory: (store: WorldbookStore) => new DeleteWorldbookUseCase(store),
      inject: [WORLDBOOK_STORE],
    },
    {
      provide: ImportWorldbookUseCase,
      useFactory: (
        store: WorldbookStore,
        codec: WorldbookCodec,
        idGenerator: WorldbookIdGenerator,
        clock: WorldbookClock,
        unitOfWork: UnitOfWork,
      ) => new ImportWorldbookUseCase(store, codec, idGenerator, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, WORLDBOOK_CODEC, CryptoIdGenerator, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: ExportWorldbookUseCase,
      useFactory: (store: WorldbookStore, codec: WorldbookCodec) =>
        new ExportWorldbookUseCase(store, codec),
      inject: [WORLDBOOK_STORE, WORLDBOOK_CODEC],
    },
    {
      provide: CreateWorldbookEntryUseCase,
      useFactory: (
        store: WorldbookStore,
        idGenerator: WorldbookIdGenerator,
        clock: WorldbookClock,
        unitOfWork: UnitOfWork,
      ) => new CreateWorldbookEntryUseCase(store, idGenerator, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, CryptoIdGenerator, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdateWorldbookEntryUseCase,
      useFactory: (store: WorldbookStore, clock: WorldbookClock, unitOfWork: UnitOfWork) =>
        new UpdateWorldbookEntryUseCase(store, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: DeleteWorldbookEntryUseCase,
      useFactory: (store: WorldbookStore, clock: WorldbookClock, unitOfWork: UnitOfWork) =>
        new DeleteWorldbookEntryUseCase(store, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdateWorldbookEntryOrderUseCase,
      useFactory: (store: WorldbookStore, clock: WorldbookClock, unitOfWork: UnitOfWork) =>
        new UpdateWorldbookEntryOrderUseCase(store, clock, unitOfWork),
      inject: [WORLDBOOK_STORE, SystemClock, UNIT_OF_WORK],
    },
  ],
})
export class WorldbooksModule {}
