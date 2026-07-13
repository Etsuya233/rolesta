import { ApplicationError } from "../../common/errors/index.js";
import type { AssetDefaultField } from "../domain/asset-defaults.js";

export type ChatPreferencesApplicationErrorReason =
  "invalid-patch" | "asset-unavailable" | "asset-defaults-conflict";

export interface ChatPreferencesApplicationErrorParamsMap {
  "invalid-patch": Record<string, never>;
  "asset-unavailable": { fields: AssetDefaultField[] };
  "asset-defaults-conflict": Record<string, never>;
}

export type ChatPreferencesApplicationErrorParams<
  R extends ChatPreferencesApplicationErrorReason,
> = ChatPreferencesApplicationErrorParamsMap[R];

export class ChatPreferencesApplicationError<
  R extends ChatPreferencesApplicationErrorReason =
    ChatPreferencesApplicationErrorReason,
> extends ApplicationError<R, ChatPreferencesApplicationErrorParams<R>> {
  constructor(options: {
    reason: R;
    params: ChatPreferencesApplicationErrorParams<R>;
    cause?: unknown;
  }) {
    super(options);
  }
}
