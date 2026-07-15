import { ChatApplicationError } from './chat-application-error.js';
import type { ChatStore } from '../ports/chat-store.js';

export class DeleteChatUseCase {
  constructor(private readonly store: ChatStore) {}

  async execute(id: string, ownerUserId: string): Promise<void> {
    if (!(await this.store.deleteOwned(id, ownerUserId))) {
      throw new ChatApplicationError('not-found', {});
    }
  }
}
