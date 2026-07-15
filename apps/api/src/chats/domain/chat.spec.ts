import { describe, expect, it } from 'vitest';
import { createChat, updateChat } from './chat.js';

describe('Chat', () => {
  it('creates with a required dialogue character and optional associations', () => {
    expect(
      createChat({
        id: 'chat',
        ownerUserId: 'owner',
        title: 'Title',
        chatCharacterId: 'character',
        personaCharacterId: null,
        presetId: null,
        modelProviderId: null,
        nowMs: 10,
      }),
    ).toEqual({
      id: 'chat',
      ownerUserId: 'owner',
      title: 'Title',
      chatCharacterId: 'character',
      personaCharacterId: null,
      presetId: null,
      modelProviderId: null,
      createdAtMs: 10,
      updatedAtMs: 10,
    });
  });

  it('updates only submitted fields and advances activity time', () => {
    const current = createChat({
      id: 'chat',
      ownerUserId: 'owner',
      title: 'Title',
      chatCharacterId: 'character',
      personaCharacterId: 'persona',
      presetId: 'preset',
      modelProviderId: null,
      nowMs: 10,
    });
    expect(updateChat(current, { title: 'Changed', presetId: null }, 20)).toMatchObject({
      title: 'Changed',
      chatCharacterId: 'character',
      personaCharacterId: 'persona',
      presetId: null,
      updatedAtMs: 20,
    });
  });
});
