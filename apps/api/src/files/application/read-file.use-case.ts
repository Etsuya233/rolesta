import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { FileContentStore } from '../ports/file-content-store.js';
import type { FileMetadataStore } from '../ports/file-metadata-store.js';
import { FileApplicationError } from './file-application-error.js';
import { toFileApplicationError } from './file-error.mapper.js';

export class ReadFileUseCase {
  constructor(
    private readonly metadata: FileMetadataStore,
    private readonly contents: FileContentStore,
  ) {}

  @UseCase(toFileApplicationError)
  async execute(fileId: string, viewerUserId: string | null) {
    const object = await this.metadata.findReadableObject(fileId);

    if (
      object === null ||
      (object.visibility === 'private' && object.ownerUserId !== viewerUserId)
    ) {
      throw new FileApplicationError({ reason: 'file-not-found', params: { fileId } });
    }

    return {
      stream: await this.contents.open(object.storageKey),
      mediaType: object.mediaType,
      byteSize: object.byteSize,
      etag: `"${object.contentHash}"`,
      visibility: object.visibility,
    };
  }
}
