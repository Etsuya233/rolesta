import { ApplicationError } from '../../common/errors/index.js';

export type CharacterApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'invalid-character-card'
  | 'unsupported-character-card'
  | 'invalid-avatar'
  | 'avatar-assignment-conflict'
  | 'avatar-storage-unavailable';

export interface CharacterApplicationErrorParamsMap {
  'not-found': {
    characterId: string;
  };
  forbidden: {
    characterId: string;
    viewerUserId: string;
  };
  'invalid-import-file': {
    fileName?: string;
    field?: string;
    detail?: string;
  };
  'invalid-character-card': {
    fileName?: string;
    field?: string;
    value?: string;
    detail?: string;
  };
  'unsupported-character-card': {
    fileName?: string;
    sourceFormat?: string;
    detail?: string;
  };
  'invalid-avatar': {
    field?: string;
    detail?: string;
  };
  'avatar-assignment-conflict': {
    detail?: string;
  };
  'avatar-storage-unavailable': {
    detail?: string;
  };
}

export type CharacterApplicationErrorParams<
  R extends CharacterApplicationErrorReason = CharacterApplicationErrorReason,
> = CharacterApplicationErrorParamsMap[R];

export interface CharacterApplicationErrorOptions<R extends CharacterApplicationErrorReason> {
  reason: R;
  params: CharacterApplicationErrorParams<R>;
  cause?: unknown;
}

export class CharacterApplicationError<
  R extends CharacterApplicationErrorReason = CharacterApplicationErrorReason,
> extends ApplicationError<R, CharacterApplicationErrorParams<R>> {
  constructor(options: CharacterApplicationErrorOptions<R>) {
    super(options);
  }
}
