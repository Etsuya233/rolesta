import { Injectable } from '@nestjs/common';
import type { FileObjectsTable, FileResourcesTable } from '@rolesta/db';
import type { Insertable, Selectable } from 'kysely';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import type { FileObject, FileResource } from '../domain/file-resource.js';
import type {
  FileMetadataStore,
  ReadableFileObject,
} from '../ports/file-metadata-store.js';

@Injectable()
export class KyselyFileMetadataStore implements FileMetadataStore {
  constructor(private readonly context: KyselyDatabaseContext) {}

  async createPending(resource: FileResource): Promise<void> {
    const database = this.context.database;
    await database
      .insertInto('file_resources')
      .values(toResourceRow(resource))
      .execute();
    await database
      .insertInto('file_objects')
      .values(resource.objects.map(toObjectRow))
      .execute();
  }

  async activatePendingCharacterAvatar(
    resourceId: string,
    ownerUserId: string,
  ): Promise<boolean> {
    const result = await this.context.database
      .updateTable('file_resources')
      .set({ status: 'active', orphaned_at_ms: null })
      .where('id', '=', resourceId)
      .where('owner_user_id', '=', ownerUserId)
      .where('purpose', '=', 'character-avatar')
      .where('status', '=', 'pending')
      .executeTakeFirst();

    return Number(result.numUpdatedRows) === 1;
  }

  async orphanActiveCharacterAvatar(
    resourceId: string,
    ownerUserId: string,
    orphanedAtMs: number,
  ): Promise<boolean> {
    const result = await this.context.database
      .updateTable('file_resources')
      .set({ status: 'orphaned', orphaned_at_ms: orphanedAtMs })
      .where('id', '=', resourceId)
      .where('owner_user_id', '=', ownerUserId)
      .where('purpose', '=', 'character-avatar')
      .where('status', '=', 'active')
      .executeTakeFirst();

    return Number(result.numUpdatedRows) === 1;
  }

  async findReadableObject(fileId: string): Promise<ReadableFileObject | null> {
    const row = await this.context.database
      .selectFrom('file_objects')
      .innerJoin(
        'file_resources',
        'file_resources.id',
        'file_objects.resource_id',
      )
      .selectAll('file_objects')
      .select('file_resources.owner_user_id')
      .where('file_objects.id', '=', fileId)
      .where('file_resources.status', '=', 'active')
      .executeTakeFirst();

    return row
      ? { ...toFileObject(row), ownerUserId: row.owner_user_id }
      : null;
  }

  async findObjectsByResourceIds(resourceIds: string[]): Promise<FileObject[]> {
    if (resourceIds.length === 0) {
      return [];
    }

    const rows = await this.context.database
      .selectFrom('file_objects')
      .selectAll()
      .where('resource_id', 'in', resourceIds)
      .execute();
    return rows.map(toFileObject);
  }

  async findExpiredResourceIds(
    cutoffMs: number,
    limit: number,
  ): Promise<string[]> {
    const rows = await this.context.database
      .selectFrom('file_resources')
      .select('id')
      .where((builder) =>
        builder.or([
          builder.and([
            builder('status', '=', 'pending'),
            builder('created_at_ms', '<=', cutoffMs),
          ]),
          builder.and([
            builder('status', '=', 'orphaned'),
            builder('orphaned_at_ms', '<=', cutoffMs),
          ]),
        ]),
      )
      .orderBy('created_at_ms', 'asc')
      .limit(limit)
      .execute();
    return rows.map((row) => row.id);
  }

  async findObjectsByResourceId(resourceId: string): Promise<FileObject[]> {
    const rows = await this.context.database
      .selectFrom('file_objects')
      .selectAll()
      .where('resource_id', '=', resourceId)
      .execute();
    return rows.map(toFileObject);
  }

  async deleteResource(resourceId: string): Promise<void> {
    await this.context.database
      .deleteFrom('file_resources')
      .where('id', '=', resourceId)
      .execute();
  }
}

function toResourceRow(resource: FileResource): Insertable<FileResourcesTable> {
  return {
    id: resource.id,
    owner_user_id: resource.ownerUserId,
    purpose: resource.purpose,
    status: resource.status,
    orphaned_at_ms: resource.orphanedAtMs,
    created_at_ms: resource.createdAtMs,
  };
}

function toObjectRow(object: FileObject): Insertable<FileObjectsTable> {
  return {
    id: object.id,
    resource_id: object.resourceId,
    role: object.role,
    visibility: object.visibility,
    media_type: object.mediaType,
    byte_size: object.byteSize,
    width: object.width,
    height: object.height,
    content_hash: object.contentHash,
    storage_key: object.storageKey,
    original_file_name: object.originalFileName,
    created_at_ms: object.createdAtMs,
  };
}

function toFileObject(row: Selectable<FileObjectsTable>): FileObject {
  return {
    id: row.id,
    resourceId: row.resource_id,
    role: row.role,
    visibility: row.visibility,
    mediaType: row.media_type,
    byteSize: row.byte_size,
    width: row.width,
    height: row.height,
    contentHash: row.content_hash,
    storageKey: row.storage_key,
    originalFileName: row.original_file_name,
    createdAtMs: row.created_at_ms,
  };
}
