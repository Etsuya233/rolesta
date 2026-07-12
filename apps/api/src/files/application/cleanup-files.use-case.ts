import type { FileClock } from '../ports/file-application-services.js';
import type { FileContentStore } from '../ports/file-content-store.js';
import type { FileMetadataStore } from '../ports/file-metadata-store.js';

const CLEANUP_BATCH_SIZE = 100;

export class CleanupFilesUseCase {
  constructor(
    private readonly metadata: FileMetadataStore,
    private readonly contents: FileContentStore,
    private readonly clock: FileClock,
    private readonly retentionMs: number,
  ) {}

  async execute(): Promise<number> {
    const resourceIds = await this.metadata.findExpiredResourceIds(
      this.clock.nowMs() - this.retentionMs,
      CLEANUP_BATCH_SIZE,
    );

    for (const resourceId of resourceIds) {
      const objects = await this.metadata.findObjectsByResourceId(resourceId);
      await Promise.all(objects.map((object) => this.contents.delete(object.storageKey)));
      await this.metadata.deleteResource(resourceId);
    }

    return resourceIds.length;
  }
}
