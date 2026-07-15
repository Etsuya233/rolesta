import { AssetDefaultsPortError } from '../ports/asset-defaults-port-error.js';
import { ChatPreferencesApplicationError } from './chat-preferences-application-error.js';

export function translateChatPreferencesError(error: unknown): unknown {
  if (error instanceof ChatPreferencesApplicationError) {
    return error;
  }

  if (error instanceof AssetDefaultsPortError) {
    return new ChatPreferencesApplicationError({
      reason: 'asset-defaults-conflict',
      params: {},
      cause: error,
    });
  }

  return error;
}
