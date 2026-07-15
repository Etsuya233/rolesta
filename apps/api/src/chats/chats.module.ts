import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { CryptoIdGenerator } from "../auth/infrastructure/crypto-id-generator.js";
import { SystemClock } from "../auth/infrastructure/system-clock.js";
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from "../common/application/unit-of-work.js";
import { DomainEventsModule } from "../common/events/index.js";
import { DatabaseModule } from "../database/database.module.js";
import { FilesModule } from "../files/files.module.js";
import {
  CHARACTER_REFERENCE_ACCESS,
  type CharacterReferenceAccess,
} from "../characters/contracts/character-reference-access.js";
import { CharactersModule } from "../characters/characters.module.js";
import {
  MODEL_PROVIDER_REFERENCE_ACCESS,
  type ModelProviderReferenceAccess,
} from "../model-profiles/contracts/model-provider-reference-access.js";
import { ModelProfilesModule } from "../model-profiles/model-profiles.module.js";
import {
  PRESET_REFERENCE_ACCESS,
  type PresetReferenceAccess,
} from "../presets/contracts/preset-reference-access.js";
import { PresetsModule } from "../presets/presets.module.js";
import { ModuleChatAssetAccess } from "./adapters/module-chat-asset-access.js";
import { CreateChatUseCase } from "./application/create-chat.use-case.js";
import { DeleteChatUseCase } from "./application/delete-chat.use-case.js";
import { GetChatUseCase } from "./application/get-chat.use-case.js";
import { ListChatsUseCase } from "./application/list-chats.use-case.js";
import type {
  ChatClock,
  ChatIdGenerator,
} from "./application/chat-application-services.js";
import { UpdateChatUseCase } from "./application/update-chat.use-case.js";
import { AssetVisibilityEventsListener } from "./application/asset-visibility-events.listener.js";
import { ChatsController } from "./http/chats.controller.js";
import { KyselyChatStore } from "./persistence/kysely-chat-store.js";
import {
  CHAT_ASSET_ACCESS,
  type ChatAssetAccess,
} from "./ports/chat-asset-access.js";
import { CHAT_STORE, type ChatStore } from "./ports/chat-store.js";

@Module({
  imports: [
    DatabaseModule,
    DomainEventsModule,
    AuthModule,
    FilesModule,
    CharactersModule,
    PresetsModule,
    ModelProfilesModule,
  ],
  controllers: [ChatsController],
  providers: [
    KyselyChatStore,
    CryptoIdGenerator,
    SystemClock,
    AssetVisibilityEventsListener,
    { provide: CHAT_STORE, useExisting: KyselyChatStore },
    {
      provide: CHAT_ASSET_ACCESS,
      useFactory: (
        characters: CharacterReferenceAccess,
        presets: PresetReferenceAccess,
        modelProviders: ModelProviderReferenceAccess,
      ) => new ModuleChatAssetAccess(characters, presets, modelProviders),
      inject: [
        CHARACTER_REFERENCE_ACCESS,
        PRESET_REFERENCE_ACCESS,
        MODEL_PROVIDER_REFERENCE_ACCESS,
      ],
    },
    {
      provide: CreateChatUseCase,
      useFactory: (
        store: ChatStore,
        assets: ChatAssetAccess,
        ids: ChatIdGenerator,
        clock: ChatClock,
        unitOfWork: UnitOfWork,
      ) => new CreateChatUseCase(store, assets, ids, clock, unitOfWork),
      inject: [
        CHAT_STORE,
        CHAT_ASSET_ACCESS,
        CryptoIdGenerator,
        SystemClock,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: ListChatsUseCase,
      useFactory: (store: ChatStore) => new ListChatsUseCase(store),
      inject: [CHAT_STORE],
    },
    {
      provide: GetChatUseCase,
      useFactory: (store: ChatStore) => new GetChatUseCase(store),
      inject: [CHAT_STORE],
    },
    {
      provide: UpdateChatUseCase,
      useFactory: (
        store: ChatStore,
        assets: ChatAssetAccess,
        clock: ChatClock,
        unitOfWork: UnitOfWork,
      ) => new UpdateChatUseCase(store, assets, clock, unitOfWork),
      inject: [CHAT_STORE, CHAT_ASSET_ACCESS, SystemClock, UNIT_OF_WORK],
    },
    {
      provide: DeleteChatUseCase,
      useFactory: (store: ChatStore) => new DeleteChatUseCase(store),
      inject: [CHAT_STORE],
    },
  ],
})
export class ChatsModule {}
