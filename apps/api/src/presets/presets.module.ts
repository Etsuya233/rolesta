import { Module } from '@nestjs/common';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../common/application/unit-of-work.js';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
import { SillyTavernPresetCodec } from './adapters/silly-tavern/silly-tavern-preset-codec.js';
import { CreatePresetEntryUseCase } from './application/create-preset-entry.use-case.js';
import { CreatePresetUseCase } from './application/create-preset.use-case.js';
import { DeletePresetEntryUseCase } from './application/delete-preset-entry.use-case.js';
import { DeletePresetUseCase } from './application/delete-preset.use-case.js';
import { ExportPresetUseCase } from './application/export-preset.use-case.js';
import { GetPresetUseCase } from './application/get-preset.use-case.js';
import { ImportPresetUseCase } from './application/import-preset.use-case.js';
import { ListPresetsUseCase } from './application/list-presets.use-case.js';
import type {
  PresetClock,
  PresetIdGenerator,
} from './application/preset-application-services.js';
import { UpdatePresetEntryUseCase } from './application/update-preset-entry.use-case.js';
import { UpdatePresetDocumentUseCase } from './application/update-preset-document.use-case.js';
import { UpdatePresetPromptItemsUseCase } from './application/update-preset-prompt-items.use-case.js';
import { UpdatePresetUseCase } from './application/update-preset.use-case.js';
import { PRESET_CODEC, type PresetCodec } from './ports/preset-codec.js';
import { PRESET_STORE, type PresetStore } from './ports/preset-store.js';
import { KyselyPresetStore } from './persistence/kysely-preset-store.js';
import { KyselyPresetModelProviderAccess } from './persistence/kysely-preset-model-provider-access.js';
import {
  PRESET_MODEL_PROVIDER_ACCESS,
  type PresetModelProviderAccess,
} from './ports/preset-model-provider-access.js';
import { PresetsController } from './http/presets.controller.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PresetsController],
  providers: [
    KyselyPresetStore,
    KyselyPresetModelProviderAccess,
    SillyTavernPresetCodec,
    CryptoIdGenerator,
    SystemClock,
    { provide: PRESET_STORE, useExisting: KyselyPresetStore },
    {
      provide: PRESET_MODEL_PROVIDER_ACCESS,
      useExisting: KyselyPresetModelProviderAccess,
    },
    { provide: PRESET_CODEC, useExisting: SillyTavernPresetCodec },
    {
      provide: ListPresetsUseCase,
      useFactory: (store: PresetStore) => new ListPresetsUseCase(store),
      inject: [PRESET_STORE],
    },
    {
      provide: GetPresetUseCase,
      useFactory: (store: PresetStore) => new GetPresetUseCase(store),
      inject: [PRESET_STORE],
    },
    {
      provide: CreatePresetUseCase,
      useFactory: (
        store: PresetStore,
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
        modelProviderAccess: PresetModelProviderAccess,
        unitOfWork: UnitOfWork,
      ) =>
        new CreatePresetUseCase(
          store,
          idGenerator,
          clock,
          modelProviderAccess,
          unitOfWork,
        ),
      inject: [
        PRESET_STORE,
        CryptoIdGenerator,
        SystemClock,
        PRESET_MODEL_PROVIDER_ACCESS,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: UpdatePresetUseCase,
      useFactory: (
        store: PresetStore,
        clock: PresetClock,
        modelProviderAccess: PresetModelProviderAccess,
        unitOfWork: UnitOfWork,
      ) =>
        new UpdatePresetUseCase(store, clock, modelProviderAccess, unitOfWork),
      inject: [
        PRESET_STORE,
        SystemClock,
        PRESET_MODEL_PROVIDER_ACCESS,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: UpdatePresetDocumentUseCase,
      useFactory: (
        store: PresetStore,
        clock: PresetClock,
        modelProviderAccess: PresetModelProviderAccess,
        unitOfWork: UnitOfWork,
      ) =>
        new UpdatePresetDocumentUseCase(
          store,
          clock,
          modelProviderAccess,
          unitOfWork,
        ),
      inject: [
        PRESET_STORE,
        SystemClock,
        PRESET_MODEL_PROVIDER_ACCESS,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: DeletePresetUseCase,
      useFactory: (store: PresetStore) => new DeletePresetUseCase(store),
      inject: [PRESET_STORE],
    },
    {
      provide: ImportPresetUseCase,
      useFactory: (
        store: PresetStore,
        codec: PresetCodec,
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
        unitOfWork: UnitOfWork,
      ) =>
        new ImportPresetUseCase(store, codec, idGenerator, clock, unitOfWork),
      inject: [
        PRESET_STORE,
        PRESET_CODEC,
        CryptoIdGenerator,
        SystemClock,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: ExportPresetUseCase,
      useFactory: (store: PresetStore, codec: PresetCodec) =>
        new ExportPresetUseCase(store, codec),
      inject: [PRESET_STORE, PRESET_CODEC],
    },
    {
      provide: CreatePresetEntryUseCase,
      useFactory: (
        store: PresetStore,
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
        unitOfWork: UnitOfWork,
      ) => new CreatePresetEntryUseCase(store, idGenerator, clock, unitOfWork),
      inject: [PRESET_STORE, CryptoIdGenerator, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdatePresetEntryUseCase,
      useFactory: (
        store: PresetStore,
        clock: PresetClock,
        unitOfWork: UnitOfWork,
      ) => new UpdatePresetEntryUseCase(store, clock, unitOfWork),
      inject: [PRESET_STORE, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: DeletePresetEntryUseCase,
      useFactory: (
        store: PresetStore,
        clock: PresetClock,
        unitOfWork: UnitOfWork,
      ) => new DeletePresetEntryUseCase(store, clock, unitOfWork),
      inject: [PRESET_STORE, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: UpdatePresetPromptItemsUseCase,
      useFactory: (
        store: PresetStore,
        clock: PresetClock,
        unitOfWork: UnitOfWork,
      ) => new UpdatePresetPromptItemsUseCase(store, clock, unitOfWork),
      inject: [PRESET_STORE, SystemClock, UNIT_OF_WORK],
    },
  ],
})
export class PresetsModule {}
