import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CryptoIdGenerator } from '../auth/infrastructure/crypto-id-generator.js';
import { SystemClock } from '../auth/infrastructure/system-clock.js';
import { DatabaseModule } from '../database/database.module.js';
import { FilesModule } from '../files/files.module.js';
import { CreateFileResourceUseCase } from '../files/application/create-file-resource.use-case.js';
import { IMAGE_PROCESSOR, type ImageProcessor } from '../files/ports/image-processor.js';
import { CHARACTER_CARD_CODEC, type CharacterCardCodec } from './ports/character-card-codec.js';
import { CHARACTER_CARD_STORE, type CharacterCardStore } from './ports/character-card-store.js';
import type { CharacterClock, CharacterIdGenerator } from './application/character-application-services.js';
import { SillyTavernCharacterCardCodec } from './adapters/silly-tavern/silly-tavern-character-card-codec.js';
import { CreateCharacterUseCase } from './application/create-character.use-case.js';
import { DeleteCharacterUseCase } from './application/delete-character.use-case.js';
import { ExportCharacterCardUseCase } from './application/export-character-card.use-case.js';
import { GetCharacterUseCase } from './application/get-character.use-case.js';
import { ImportCharacterCardUseCase } from './application/import-character-card.use-case.js';
import { ListCharactersUseCase } from './application/list-characters.use-case.js';
import { UpdateCharacterUseCase } from './application/update-character.use-case.js';
import { UploadCharacterAvatarUseCase } from './application/upload-character-avatar.use-case.js';
import { DeleteCharacterAvatarUseCase } from './application/delete-character-avatar.use-case.js';
import { FileCharacterAvatarService } from './adapters/file-character-avatar-service.js';
import { CHARACTER_AVATAR_SERVICE, type CharacterAvatarService } from './ports/character-avatar-service.js';
import { CHARACTER_AVATAR_ASSIGNMENT, type CharacterAvatarAssignment } from './ports/character-avatar-assignment.js';
import { CharactersController } from './http/characters.controller.js';
import { KyselyCharacterAvatarAssignment } from './persistence/kysely-character-avatar-assignment.js';
import { KyselyCharacterCardStore } from './persistence/kysely-character-card-store.js';

@Module({
  imports: [DatabaseModule, AuthModule, FilesModule],
  controllers: [CharactersController],
  providers: [
    KyselyCharacterCardStore,
    KyselyCharacterAvatarAssignment,
    SillyTavernCharacterCardCodec,
    CryptoIdGenerator,
    SystemClock,
    { provide: CHARACTER_CARD_STORE, useExisting: KyselyCharacterCardStore },
    {
      provide: CHARACTER_AVATAR_ASSIGNMENT,
      useExisting: KyselyCharacterAvatarAssignment,
    },
    {
      provide: CHARACTER_CARD_CODEC,
      useExisting: SillyTavernCharacterCardCodec,
    },
    {
      provide: CHARACTER_AVATAR_SERVICE,
      useFactory: (images: ImageProcessor, createFiles: CreateFileResourceUseCase) =>
        new FileCharacterAvatarService(images, createFiles),
      inject: [IMAGE_PROCESSOR, CreateFileResourceUseCase],
    },
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
      useFactory: (store: CharacterCardStore, idGenerator: CharacterIdGenerator, clock: CharacterClock) =>
        new CreateCharacterUseCase(store, idGenerator, clock),
      inject: [CHARACTER_CARD_STORE, CryptoIdGenerator, SystemClock],
    },
    {
      provide: UpdateCharacterUseCase,
      useFactory: (store: CharacterCardStore, clock: CharacterClock) => new UpdateCharacterUseCase(store, clock),
      inject: [CHARACTER_CARD_STORE, SystemClock],
    },
    {
      provide: UploadCharacterAvatarUseCase,
      useFactory: (
        store: CharacterCardStore,
        avatars: CharacterAvatarService,
        assignment: CharacterAvatarAssignment,
        clock: CharacterClock,
      ) => new UploadCharacterAvatarUseCase(store, avatars, assignment, clock),
      inject: [CHARACTER_CARD_STORE, CHARACTER_AVATAR_SERVICE, CHARACTER_AVATAR_ASSIGNMENT, SystemClock],
    },
    {
      provide: DeleteCharacterAvatarUseCase,
      useFactory: (assignment: CharacterAvatarAssignment, clock: CharacterClock) =>
        new DeleteCharacterAvatarUseCase(assignment, clock),
      inject: [CHARACTER_AVATAR_ASSIGNMENT, SystemClock],
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
        codec: CharacterCardCodec,
        idGenerator: CharacterIdGenerator,
        clock: CharacterClock,
      ) => new ImportCharacterCardUseCase(store, codec, idGenerator, clock),
      inject: [CHARACTER_CARD_STORE, CHARACTER_CARD_CODEC, CryptoIdGenerator, SystemClock],
    },
    {
      provide: ExportCharacterCardUseCase,
      useFactory: (store: CharacterCardStore, codec: CharacterCardCodec) =>
        new ExportCharacterCardUseCase(store, codec),
      inject: [CHARACTER_CARD_STORE, CHARACTER_CARD_CODEC],
    },
  ],
})
export class CharactersModule {}
