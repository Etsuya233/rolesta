import type { FileObject, FileResource } from '../domain/file-resource.js';
import type { FilePurpose } from '../domain/file-purpose.js';

export const FILE_METADATA_STORE = Symbol('FileMetadataStore');

export interface ReadableFileObject extends FileObject {
  ownerUserId: string;
}

export interface FileMetadataStore {
  createPending(resource: FileResource): Promise<void>;
  activatePending(
    resourceId: string,
    ownerUserId: string,
    purpose: FilePurpose,
  ): Promise<boolean>;
  markOrphaned(
    resourceId: string,
    ownerUserId: string,
    purpose: FilePurpose,
    orphanedAtMs: number,
  ): Promise<boolean>;
  findReadableObject(fileId: string): Promise<ReadableFileObject | null>;
  findObjectsByResourceIds(resourceIds: string[]): Promise<FileObject[]>;
  findExpiredResourceIds(cutoffMs: number, limit: number): Promise<string[]>;
  findObjectsByResourceId(resourceId: string): Promise<FileObject[]>;
  deleteResource(resourceId: string): Promise<void>;
}
