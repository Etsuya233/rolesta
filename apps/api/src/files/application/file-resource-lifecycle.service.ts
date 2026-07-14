import { UseCase } from '../../common/errors/use-case.decorator.js';
import type {
  ActivatePendingFileResourceCommand,
  FileResourceLifecycle,
  MarkFileResourceOrphanedCommand,
} from '../contracts/file-resource-lifecycle.js';
import { FilePortError } from '../ports/file-port-error.js';
import type { FileMetadataStore } from '../ports/file-metadata-store.js';
import { toFileApplicationError } from './file-error.mapper.js';

export class FileResourceLifecycleService implements FileResourceLifecycle {
  constructor(private readonly metadata: FileMetadataStore) {}

  @UseCase(toFileApplicationError)
  async activatePending(input: ActivatePendingFileResourceCommand): Promise<void> {
    const activated = await this.metadata.activatePending(
      input.resourceId,
      input.ownerUserId,
      input.purpose,
    );
    if (!activated) {
      throw new FilePortError({
        reason: 'resource-state-conflict',
        params: {
          resourceId: input.resourceId,
          expectedPurpose: input.purpose,
          expectedStatus: 'pending',
        },
      });
    }
  }

  @UseCase(toFileApplicationError)
  async markOrphaned(input: MarkFileResourceOrphanedCommand): Promise<void> {
    const orphaned = await this.metadata.markOrphaned(
      input.resourceId,
      input.ownerUserId,
      input.purpose,
      input.orphanedAtMs,
    );
    if (!orphaned) {
      throw new FilePortError({
        reason: 'resource-state-conflict',
        params: {
          resourceId: input.resourceId,
          expectedPurpose: input.purpose,
          expectedStatus: 'active',
        },
      });
    }
  }
}
