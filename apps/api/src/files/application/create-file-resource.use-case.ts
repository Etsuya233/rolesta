import { UseCase } from '../../common/errors/use-case.decorator.js';
import type { FileObject, FileResource, FileVisibility } from '../domain/file-resource.js';
import type { FileContentStore } from '../ports/file-content-store.js';
import type {
  FileClock,
  FileContentHasher,
  FileIdGenerator,
} from '../ports/file-application-services.js';
import type { FileMetadataStore } from '../ports/file-metadata-store.js';
import { toFileApplicationError } from './file-error.mapper.js';

export interface NewFileObject {
  role: string;
  visibility: FileVisibility;
  mediaType: string;
  content: Buffer;
  width?: number;
  height?: number;
  originalFileName?: string;
}

export interface CreateFileResourceCommand {
  ownerUserId: string;
  purpose: string;
  objects: NewFileObject[];
}

export interface CreatedFileResource {
  resource: FileResource;
}

export class CreateFileResourceUseCase {
  constructor(
    private readonly metadata: FileMetadataStore,
    private readonly contents: FileContentStore,
    private readonly ids: FileIdGenerator,
    private readonly clock: FileClock,
    private readonly hasher: FileContentHasher,
  ) {}

  @UseCase(toFileApplicationError)
  async execute(command: CreateFileResourceCommand): Promise<CreatedFileResource> {
    const resourceId = this.ids.createId();
    const nowMs = this.clock.nowMs();
    const objects = command.objects.map((object) => this.fileObject(resourceId, nowMs, object));
    const resource: FileResource = {
      id: resourceId,
      ownerUserId: command.ownerUserId,
      purpose: command.purpose,
      status: 'pending',
      orphanedAtMs: null,
      createdAtMs: nowMs,
      objects,
    };

    await this.metadata.createPending(resource);
    await Promise.all(
      objects.map((object, index) =>
        this.contents.save(object.storageKey, command.objects[index]!.content),
      ),
    );

    return { resource };
  }

  private fileObject(resourceId: string, nowMs: number, input: NewFileObject): FileObject {
    const id = this.ids.createId();

    return {
      id,
      resourceId,
      role: input.role,
      visibility: input.visibility,
      mediaType: input.mediaType,
      byteSize: input.content.byteLength,
      width: input.width ?? null,
      height: input.height ?? null,
      contentHash: this.hasher.sha256(input.content),
      storageKey: id,
      originalFileName: input.originalFileName ?? null,
      createdAtMs: nowMs,
    };
  }
}
