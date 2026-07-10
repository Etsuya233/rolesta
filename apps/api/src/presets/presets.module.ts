import { Module } from '@nestjs/common';
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
import { PresetsController } from './http/presets.controller.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [PresetsController],
  providers: [
    KyselyPresetStore,
    SillyTavernPresetCodec,
    CryptoIdGenerator,
    SystemClock,
    { provide: PRESET_STORE, useExisting: KyselyPresetStore },
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
      provide: UpdatePresetDocumentUseCase,
      useFactory: (store: PresetStore, clock: PresetClock) =>
        new UpdatePresetDocumentUseCase(store, clock),
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
        codec: PresetCodec,
        idGenerator: PresetIdGenerator,
        clock: PresetClock,
      ) => new ImportPresetUseCase(store, codec, idGenerator, clock),
      inject: [PRESET_STORE, PRESET_CODEC, CryptoIdGenerator, SystemClock],
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
