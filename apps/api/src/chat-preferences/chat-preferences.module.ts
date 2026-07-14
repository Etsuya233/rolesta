import { Module } from "@nestjs/common";
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from "../common/application/unit-of-work.js";
import { AuthModule } from "../auth/auth.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { GetAssetDefaultsUseCase } from "./application/get-asset-defaults.use-case.js";
import { AssetDeletedEventsListener } from "./application/asset-deleted-events.listener.js";
import { UpdateAssetDefaultsUseCase } from "./application/update-asset-defaults.use-case.js";
import { ChatPreferencesController } from "./http/chat-preferences.controller.js";
import { KyselyAssetDefaultsStore } from "./persistence/kysely-asset-defaults-store.js";
import { KyselyChatAssetOwnership } from "./persistence/kysely-chat-asset-ownership.js";
import {
  ASSET_DEFAULTS_STORE,
  type AssetDefaultsStore,
} from "./ports/asset-defaults-store.js";
import {
  CHAT_ASSET_OWNERSHIP,
  type ChatAssetOwnership,
} from "./ports/chat-asset-ownership.js";

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ChatPreferencesController],
  providers: [
    KyselyAssetDefaultsStore,
    KyselyChatAssetOwnership,
    { provide: ASSET_DEFAULTS_STORE, useExisting: KyselyAssetDefaultsStore },
    { provide: CHAT_ASSET_OWNERSHIP, useExisting: KyselyChatAssetOwnership },
    AssetDeletedEventsListener,
    {
      provide: GetAssetDefaultsUseCase,
      useFactory: (store: AssetDefaultsStore) =>
        new GetAssetDefaultsUseCase(store),
      inject: [ASSET_DEFAULTS_STORE],
    },
    {
      provide: UpdateAssetDefaultsUseCase,
      useFactory: (
        ownership: ChatAssetOwnership,
        store: AssetDefaultsStore,
        unitOfWork: UnitOfWork,
      ) => new UpdateAssetDefaultsUseCase(ownership, store, unitOfWork),
      inject: [CHAT_ASSET_OWNERSHIP, ASSET_DEFAULTS_STORE, UNIT_OF_WORK],
    },
  ],
})
export class ChatPreferencesModule {}
