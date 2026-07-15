import { PortError } from '../../common/errors/index.js';

export type CharacterPortErrorReason =
  | 'invalid-import-file'
  | 'invalid-character-card'
  | 'unsupported-character-card'
  | 'invalid-avatar'
  | 'avatar-assignment-conflict'
  | 'avatar-storage-unavailable';

export interface CharacterPortErrorParamsMap {
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

export type CharacterPortErrorParams<
  R extends CharacterPortErrorReason = CharacterPortErrorReason,
> = CharacterPortErrorParamsMap[R];

export interface CharacterPortErrorOptions<R extends CharacterPortErrorReason> {
  reason: R;
  params: CharacterPortErrorParams<R>;
  cause?: unknown;
}

export class CharacterPortError<
  R extends CharacterPortErrorReason = CharacterPortErrorReason,
> extends PortError<R, CharacterPortErrorParams<R>> {
  constructor(options: CharacterPortErrorOptions<R>) {
    super(options);
  }
}
