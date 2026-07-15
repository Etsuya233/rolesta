import { ChatApplicationError } from './chat-application-error.js';
import type { ChatAssetAccess } from '../ports/chat-asset-access.js';

export interface SubmittedChatAssets {
  chatCharacterId?: string | undefined;
  personaCharacterId?: string | null | undefined;
  presetId?: string | null | undefined;
  modelProviderId?: string | null | undefined;
}

export async function acquireSubmittedChatAssets(
  access: ChatAssetAccess,
  ownerUserId: string,
  assets: SubmittedChatAssets,
): Promise<void> {
  if (
    assets.chatCharacterId !== undefined &&
    !(await access.acquireVisibleCharacter(assets.chatCharacterId, ownerUserId))
  ) {
    throw new ChatApplicationError('asset-unavailable', {
      field: 'chatCharacterId',
    });
  }

  if (
    assets.personaCharacterId !== undefined &&
    assets.personaCharacterId !== null &&
    !(await access.acquireVisibleCharacter(assets.personaCharacterId, ownerUserId))
  ) {
    throw new ChatApplicationError('asset-unavailable', {
      field: 'personaCharacterId',
    });
  }

  if (
    assets.presetId !== undefined &&
    assets.presetId !== null &&
    !(await access.acquireVisiblePreset(assets.presetId, ownerUserId))
  ) {
    throw new ChatApplicationError('asset-unavailable', { field: 'presetId' });
  }

  if (
    assets.modelProviderId !== undefined &&
    assets.modelProviderId !== null &&
    !(await access.acquireOwnedModelProvider(assets.modelProviderId, ownerUserId))
  ) {
    throw new ChatApplicationError('asset-unavailable', {
      field: 'modelProviderId',
    });
  }
}
