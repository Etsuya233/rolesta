export interface Chat {
  id: string;
  ownerUserId: string;
  title: string;
  chatCharacterId: string | null;
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface CreateChatFields {
  id: string;
  ownerUserId: string;
  title: string;
  chatCharacterId: string;
  personaCharacterId: string | null;
  presetId: string | null;
  modelProviderId: string | null;
  nowMs: number;
}

export type ChatEditableFields = Partial<
  Pick<Chat, 'title' | 'chatCharacterId' | 'personaCharacterId' | 'presetId' | 'modelProviderId'>
>;

export function createChat(fields: CreateChatFields): Chat {
  return {
    id: fields.id,
    ownerUserId: fields.ownerUserId,
    title: fields.title,
    chatCharacterId: fields.chatCharacterId,
    personaCharacterId: fields.personaCharacterId,
    presetId: fields.presetId,
    modelProviderId: fields.modelProviderId,
    createdAtMs: fields.nowMs,
    updatedAtMs: fields.nowMs,
  };
}

export function updateChat(chat: Chat, fields: ChatEditableFields, nowMs: number): Chat {
  return {
    ...chat,
    ...fields,
    updatedAtMs: nowMs,
  };
}
