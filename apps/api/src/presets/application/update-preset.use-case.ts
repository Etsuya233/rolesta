import { ensureEpochMillis } from '../../shared/epoch-millis.js';
import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { PresetApplicationError } from './preset-application-error.js';
import { translatePresetError } from './preset-error.mapper.js';
import type { PresetClock } from './preset-application-services.js';
import {
  applyPresetEditableFields,
  type PresetEditableFields,
} from './preset-editable-fields.js';
import type { PresetStore } from '../ports/preset-store.js';
import type { PresetModelProviderAccess } from '../ports/preset-model-provider-access.js';
import type { Preset } from '../domain/preset.js';

export interface UpdatePresetCommand extends PresetEditableFields {
  id: string;
  viewerUserId: string;
}

export class UpdatePresetUseCase {
  constructor(
    private readonly store: PresetStore,
    private readonly clock: PresetClock,
    private readonly modelProviderAccess: PresetModelProviderAccess,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translatePresetError)
  async execute(command: UpdatePresetCommand): Promise<Preset> {
    return this.unitOfWork.run(async () => {
      const current = await this.store.findOwnedById(
        command.id,
        command.viewerUserId,
      );

      if (current === null) {
        throw new PresetApplicationError({
          reason: 'not-found',
          params: {
            presetId: command.id,
          },
        });
      }

      const updated = applyPresetEditableFields(
        {
          ...current,
          updatedAtMs: ensureEpochMillis(this.clock.now().getTime()),
        },
        command,
      );

      if (
        command.modelProviderId !== undefined &&
        command.modelProviderId !== null &&
        !(await this.modelProviderAccess.acquireOwned(
          command.modelProviderId,
          current.ownerUserId,
        ))
      ) {
        throw new PresetApplicationError({
          reason: 'model-provider-unavailable',
          params: { modelProviderId: command.modelProviderId },
        });
      }

      await this.store.update(updated);
      if (command.modelProviderId !== undefined) {
        await this.store.updateModelProviderAssociation(
          current.id,
          current.ownerUserId,
          command.modelProviderId,
        );
      }

      return updated;
    });
  }
}
