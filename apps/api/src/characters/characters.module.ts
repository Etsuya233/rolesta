import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
import {
  CHARACTER_CARD_STORE,
  type CharacterCardStore,
} from './application/character-card-store.js';
import type {
  CharacterClock,
  CharacterIdGenerator,
} from './application/character-application-services.js';
import { CreateCharacterUseCase } from './application/create-character.use-case.js';
import { DeleteCharacterUseCase } from './application/delete-character.use-case.js';
import { ExportCharacterCardUseCase } from './application/export-character-card.use-case.js';
import { GetCharacterUseCase } from './application/get-character.use-case.js';
import { ImportCharacterCardUseCase } from './application/import-character-card.use-case.js';
import { ListCharactersUseCase } from './application/list-characters.use-case.js';
import { UpdateCharacterUseCase } from './application/update-character.use-case.js';
import { CharactersController } from './http/characters.controller.js';
import { KyselyCharacterCardStore } from './infrastructure/kysely-character-card-store.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CharactersController],
  providers: [
    KyselyCharacterCardStore,
    CryptoIdGenerator,
    SystemClock,
    { provide: CHARACTER_CARD_STORE, useExisting: KyselyCharacterCardStore },
    {
      provide: ListCharactersUseCase,
      useFactory: (store: CharacterCardStore) => new ListCharactersUseCase(store),
      inject: [CHARACTER_CARD_STORE],
    },
    {
      provide: GetCharacterUseCase,
      useFactory: (store: CharacterCardStore) => new GetCharacterUseCase(store),
      inject: [CHARACTER_CARD_STORE],
    },
    {
      provide: CreateCharacterUseCase,
      useFactory: (
        store: CharacterCardStore,
        idGenerator: CharacterIdGenerator,
        clock: CharacterClock,
      ) => new CreateCharacterUseCase(store, idGenerator, clock),
      inject: [CHARACTER_CARD_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdateCharacterUseCase,
      useFactory: (store: CharacterCardStore, clock: CharacterClock) =>
        new UpdateCharacterUseCase(store, clock),
      inject: [CHARACTER_CARD_STORE, SystemClock],
    },
    {
      provide: DeleteCharacterUseCase,
      useFactory: (store: CharacterCardStore) => new DeleteCharacterUseCase(store),
      inject: [CHARACTER_CARD_STORE],
    },
    {
      provide: ImportCharacterCardUseCase,
      useFactory: (
        store: CharacterCardStore,
        idGenerator: CharacterIdGenerator,
        clock: CharacterClock,
      ) => new ImportCharacterCardUseCase(store, idGenerator, clock),
      inject: [CHARACTER_CARD_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: ExportCharacterCardUseCase,
      useFactory: (store: CharacterCardStore) => new ExportCharacterCardUseCase(store),
      inject: [CHARACTER_CARD_STORE],
    },
  ],
})
export class CharactersModule {}
