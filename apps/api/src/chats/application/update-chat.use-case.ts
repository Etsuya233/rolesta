import type { UnitOfWork } from "../../common/application/unit-of-work.js";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import { updateChat, type ChatEditableFields } from "../domain/chat.js";
import type { ChatAssetAccess } from "../ports/chat-asset-access.js";
import type { ChatDetail, ChatStore } from "../ports/chat-store.js";
import { acquireSubmittedChatAssets } from "./acquire-chat-assets.js";
import type { ChatClock } from "./chat-application-services.js";
import { ChatApplicationError } from "./chat-application-error.js";

export interface UpdateChatCommand {
  id: string;
  ownerUserId: string;
  title?: string | undefined;
  chatCharacterId?: string | undefined;
  personaCharacterId?: string | null | undefined;
  presetId?: string | null | undefined;
  modelProviderId?: string | null | undefined;
}

export class UpdateChatUseCase {
  constructor(
    private readonly store: ChatStore,
    private readonly assets: ChatAssetAccess,
    private readonly clock: ChatClock,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  execute(command: UpdateChatCommand): Promise<ChatDetail> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findOwnedDetail(
        command.id,
        command.ownerUserId,
      );
      if (current === null) throw new ChatApplicationError("not-found", {});

      await acquireSubmittedChatAssets(
        this.assets,
        command.ownerUserId,
        command,
      );
      const fields: ChatEditableFields = {};
      if (command.title !== undefined) fields.title = command.title;
      if (command.chatCharacterId !== undefined)
        fields.chatCharacterId = command.chatCharacterId;
      if (command.personaCharacterId !== undefined)
        fields.personaCharacterId = command.personaCharacterId;
      if (command.presetId !== undefined) fields.presetId = command.presetId;
      if (command.modelProviderId !== undefined)
        fields.modelProviderId = command.modelProviderId;

      return this.store.update(
        updateChat(
          current,
          fields,
          ensureEpochMillis(this.clock.now().getTime()),
        ),
      );
    });
  }
}
