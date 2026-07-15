import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import { createChat } from "../domain/chat.js";
import type { ChatAssetAccess } from "../ports/chat-asset-access.js";
import type { ChatDetail, ChatStore } from "../ports/chat-store.js";
import { acquireSubmittedChatAssets } from "./acquire-chat-assets.js";
import type {
  ChatClock,
  ChatIdGenerator,
} from "./chat-application-services.js";

export interface CreateChatCommand {
  ownerUserId: string;
  title: string;
  chatCharacterId: string;
  personaCharacterId?: string | null | undefined;
  presetId?: string | null | undefined;
  modelProviderId?: string | null | undefined;
}

export class CreateChatUseCase {
  constructor(
    private readonly store: ChatStore,
    private readonly assets: ChatAssetAccess,
    private readonly ids: ChatIdGenerator,
    private readonly clock: ChatClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(command: CreateChatCommand): Promise<ChatDetail> {
    return this.unitOfWork.run(async () => {
      await acquireSubmittedChatAssets(
        this.assets,
        command.ownerUserId,
        command,
      );
      return this.store.save(
        createChat({
          id: this.ids.createId(),
          ownerUserId: command.ownerUserId,
          title: command.title,
          chatCharacterId: command.chatCharacterId,
          personaCharacterId: command.personaCharacterId ?? null,
          presetId: command.presetId ?? null,
          modelProviderId: command.modelProviderId ?? null,
          nowMs: ensureEpochMillis(this.clock.now().getTime()),
        }),
      );
    });
  }
}
