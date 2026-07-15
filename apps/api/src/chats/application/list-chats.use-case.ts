import type { PageResponse } from "@rolesta/shared";
import type {
  ChatListItem,
  ChatStore,
  ListChatsRequest,
} from "../ports/chat-store.js";

export class ListChatsUseCase {
  constructor(private readonly store: ChatStore) {}

  execute(request: ListChatsRequest): Promise<PageResponse<ChatListItem>> {
    return this.store.list(request);
  }
}
