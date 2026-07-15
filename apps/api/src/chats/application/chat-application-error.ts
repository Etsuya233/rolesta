import { ApplicationError } from '../../common/errors/index.js';

export type ChatAssetField =
  'chatCharacterId' | 'personaCharacterId' | 'presetId' | 'modelProviderId';

export type ChatApplicationErrorReason = 'not-found' | 'asset-unavailable';

export type ChatApplicationErrorParamsMap = {
  'not-found': Record<string, never>;
  'asset-unavailable': { field: ChatAssetField };
};

export class ChatApplicationError<
  R extends ChatApplicationErrorReason = ChatApplicationErrorReason,
> extends ApplicationError<R, ChatApplicationErrorParamsMap[R]> {
  constructor(reason: R, params: ChatApplicationErrorParamsMap[R]) {
    super({ reason, params });
  }
}
