import { ChatApplicationError } from './chat-application-error.js';
import type { ChatDetail, ChatStore } from '../ports/chat-store.js';

export class GetChatUseCase {
  constructor(private readonly store: ChatStore) {}

  async execute(id: string, ownerUserId: string): Promise<ChatDetail> {
    const chat = await this.store.findOwnedDetail(id, ownerUserId);
    if (chat === null) throw new ChatApplicationError('not-found', {});
    return chat;
  }
}
