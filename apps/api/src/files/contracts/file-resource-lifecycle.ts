import type { FilePurpose } from '../domain/file-purpose.js';

export type { FilePurpose } from '../domain/file-purpose.js';

export const FILE_RESOURCE_LIFECYCLE = Symbol('FileResourceLifecycle');

export interface ActivatePendingFileResourceCommand {
  resourceId: string;
  ownerUserId: string;
  purpose: FilePurpose;
}

export interface MarkFileResourceOrphanedCommand {
  resourceId: string;
  ownerUserId: string;
  purpose: FilePurpose;
  orphanedAtMs: number;
}

export interface FileResourceLifecycle {
  activatePending(input: ActivatePendingFileResourceCommand): Promise<void>;

  markOrphaned(input: MarkFileResourceOrphanedCommand): Promise<void>;
}
