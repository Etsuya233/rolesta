export type FileResourceStatus = 'pending' | 'active' | 'orphaned';
export type FileVisibility = 'private' | 'public';

export interface FileResourcesTable {
  id: string;
  owner_user_id: string;
  purpose: string;
  status: FileResourceStatus;
  orphaned_at_ms: number | null;
  created_at_ms: number;
}

export interface FileObjectsTable {
  id: string;
  resource_id: string;
  role: string;
  visibility: FileVisibility;
  media_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  content_hash: string;
  storage_key: string;
  original_file_name: string | null;
  created_at_ms: number;
}

export interface FileContentsTable {
  storage_key: string;
  content: Uint8Array;
}
