import type { PageResponse } from "@rolesta/shared";
import type { Chat } from "../domain/chat.js";

export const CHAT_STORE = Symbol("ChatStore");

export interface ChatCharacterSummary {
  id: string;
  name: string;
  avatarResourceId: string | null;
}

export interface ChatPresetSummary {
  id: string;
  name: string;
}

export interface ChatModelProviderSummary {
  id: string;
  name: string;
  providerKind: "openai-compatible" | "openai" | "claude" | "z-ai" | "deepseek";
  defaultModelName: string;
}

export interface ChatListItem {
  id: string;
  title: string;
  updatedAtMs: number;
  chatCharacter: ChatCharacterSummary | null;
}

export interface ChatDetail extends Chat {
  chatCharacter: ChatCharacterSummary | null;
  persona: ChatCharacterSummary | null;
  preset: ChatPresetSummary | null;
  modelProvider: ChatModelProviderSummary | null;
}

export interface ListChatsRequest {
  ownerUserId: string;
  q: string;
  role: "all" | "missing" | string;
  sort: "createdAt" | "updatedAt" | "title";
  direction: "asc" | "desc";
  pageIndex: number;
  pageSize: number;
}

export interface ChatStore {
  list(request: ListChatsRequest): Promise<PageResponse<ChatListItem>>;
  findOwnedDetail(id: string, ownerUserId: string): Promise<ChatDetail | null>;
  save(chat: Chat): Promise<ChatDetail>;
  update(chat: Chat): Promise<ChatDetail>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
  clearCharacterAssociations(
    characterId: string,
    exceptOwnerUserId?: string,
  ): Promise<void>;
  clearPresetAssociations(
    presetId: string,
    exceptOwnerUserId?: string,
  ): Promise<void>;
  clearModelProviderAssociations(
    modelProviderId: string,
    ownerUserId: string,
  ): Promise<void>;
}
