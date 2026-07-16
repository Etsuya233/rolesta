export type ChatHomeTab = 'list' | 'current';

export type ChatPage =
  | { name: 'home'; key: 'chats:home' }
  | { name: 'create'; key: 'chats:create' }
  | { name: 'edit'; key: string; chatId: string; origin: ChatHomeTab };

export const chatHomePage: ChatPage = { name: 'home', key: 'chats:home' };

export function createChatPage(): ChatPage {
  return { name: 'create', key: 'chats:create' };
}

export function editChatPage(chatId: string, origin: ChatHomeTab): ChatPage {
  return { name: 'edit', key: `chat:${chatId}:edit`, chatId, origin };
}
