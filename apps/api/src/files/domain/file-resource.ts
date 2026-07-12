export const FILE_RESOURCE_STATUSES = ['pending', 'active', 'orphaned'] as const;
export type FileResourceStatus = (typeof FILE_RESOURCE_STATUSES)[number];

export const FILE_VISIBILITIES = ['private', 'public'] as const;
export type FileVisibility = (typeof FILE_VISIBILITIES)[number];

export interface FileResource {
  id: string;
  ownerUserId: string;
  purpose: string;
  status: FileResourceStatus;
  orphanedAtMs: number | null;
  createdAtMs: number;
  objects: FileObject[];
}

export interface FileObject {
  id: string;
  resourceId: string;
  role: string;
  visibility: FileVisibility;
  mediaType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  contentHash: string;
  storageKey: string;
  originalFileName: string | null;
  createdAtMs: number;
}
