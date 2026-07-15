import type { Insertable, Selectable, Updateable } from "kysely";
import type { ChatsTable } from "@rolesta/db";
import { ensureEpochMillis } from "../../shared/epoch-millis.js";
import type { Chat } from "../domain/chat.js";

export type ChatRow = Selectable<ChatsTable>;

export function toChat(row: ChatRow): Chat {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    chatCharacterId: row.chat_character_id,
    personaCharacterId: row.persona_character_id,
    presetId: row.preset_id,
    modelProviderId: row.model_provider_id,
    createdAtMs: ensureEpochMillis(Number(row.created_at_ms)),
    updatedAtMs: ensureEpochMillis(Number(row.updated_at_ms)),
  };
}

export function toChatRow(chat: Chat): Insertable<ChatsTable> {
  return {
    id: chat.id,
    owner_user_id: chat.ownerUserId,
    title: chat.title,
    chat_character_id: chat.chatCharacterId,
    persona_character_id: chat.personaCharacterId,
    preset_id: chat.presetId,
    model_provider_id: chat.modelProviderId,
    created_at_ms: ensureEpochMillis(chat.createdAtMs),
    updated_at_ms: ensureEpochMillis(chat.updatedAtMs),
  };
}

export function toChatUpdateRow(chat: Chat): Updateable<ChatsTable> {
  return {
    title: chat.title,
    chat_character_id: chat.chatCharacterId,
    persona_character_id: chat.personaCharacterId,
    preset_id: chat.presetId,
    model_provider_id: chat.modelProviderId,
    updated_at_ms: ensureEpochMillis(chat.updatedAtMs),
  };
}
