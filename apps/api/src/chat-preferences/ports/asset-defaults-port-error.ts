import { PortError } from '../../common/errors/index.js';

export type AssetDefaultsPortErrorReason = 'asset-defaults-conflict';

export class AssetDefaultsPortError extends PortError<
  AssetDefaultsPortErrorReason,
  Record<string, never>
> {
  constructor(options: { reason: AssetDefaultsPortErrorReason; cause?: unknown }) {
    super({ reason: options.reason, params: {}, cause: options.cause });
  }
}
