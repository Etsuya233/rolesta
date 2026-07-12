import type { FileObject } from '../domain/file-resource.js';
import type { FileMetadataStore } from '../ports/file-metadata-store.js';

export class GetPublicFileObjectsUseCase {
  constructor(private readonly metadata: FileMetadataStore) {}

  async execute(resourceIds: string[]): Promise<Map<string, FileObject[]>> {
    const objects = await this.metadata.findObjectsByResourceIds(resourceIds);
    const byResourceId = new Map<string, FileObject[]>();

    for (const object of objects) {
      if (object.visibility !== 'public') {
        continue;
      }

      const resourceObjects = byResourceId.get(object.resourceId) ?? [];
      resourceObjects.push(object);
      byResourceId.set(object.resourceId, resourceObjects);
    }

    return byResourceId;
  }
}
