import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
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
import { PRESET_STORE, type PresetStore } from './application/preset-store.js';
import { UpdatePresetEntryUseCase } from './application/update-preset-entry.use-case.js';
import { UpdatePresetPromptItemsUseCase } from './application/update-preset-prompt-items.use-case.js';
import { UpdatePresetUseCase } from './application/update-preset.use-case.js';
import { PresetsController } from './http/presets.controller.js';
import { KyselyPresetStore } from './infrastructure/kysely-preset-store.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PresetsController],
  providers: [
    KyselyPresetStore,
    CryptoIdGenerator,
    SystemClock,
    { provide: PRESET_STORE, useExisting: KyselyPresetStore },
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
      ) => new CreatePresetUseCase(store, idGenerator, clock),
      inject: [PRESET_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdatePresetUseCase,
      useFactory: (store: PresetStore, clock: PresetClock) =>
        new UpdatePresetUseCase(store, clock),
      inject: [PRESET_STORE, SystemClock],
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
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
      ) => new ImportPresetUseCase(store, idGenerator, clock),
      inject: [PRESET_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: ExportPresetUseCase,
      useFactory: (store: PresetStore) => new ExportPresetUseCase(store),
      inject: [PRESET_STORE],
    },
    {
      provide: CreatePresetEntryUseCase,
      useFactory: (
        store: PresetStore,
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
      ) => new CreatePresetEntryUseCase(store, idGenerator, clock),
      inject: [PRESET_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdatePresetEntryUseCase,
      useFactory: (store: PresetStore, clock: PresetClock) =>
        new UpdatePresetEntryUseCase(store, clock),
      inject: [PRESET_STORE, SystemClock],
    },
    {
      provide: DeletePresetEntryUseCase,
      useFactory: (store: PresetStore, clock: PresetClock) =>
        new DeletePresetEntryUseCase(store, clock),
      inject: [PRESET_STORE, SystemClock],
    },
    {
      provide: UpdatePresetPromptItemsUseCase,
      useFactory: (store: PresetStore, clock: PresetClock) =>
        new UpdatePresetPromptItemsUseCase(store, clock),
      inject: [PRESET_STORE, SystemClock],
    },
  ],
})
export class PresetsModule {}
