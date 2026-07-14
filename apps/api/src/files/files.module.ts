import { Module } from '@nestjs/common';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../common/application/unit-of-work.js';
import type { AppConfig } from '../config/app-config.js';
import { APP_CONFIG } from '../config/config.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseFileContentStore } from './adapters/database-file-content-store.js';
import { LocalFileContentStore } from './adapters/local-file-content-store.js';
import { SharpImageProcessor } from './adapters/sharp-image-processor.js';
import { CleanupFilesUseCase } from './application/cleanup-files.use-case.js';
import { CreateFileResourceUseCase } from './application/create-file-resource.use-case.js';
import { GetPublicFileObjectsUseCase } from './application/get-public-file-objects.use-case.js';
import { ReadFileUseCase } from './application/read-file.use-case.js';
import { FilesController } from './http/files.controller.js';
import { FileCleanupScheduler } from './infrastructure/file-cleanup.scheduler.js';
import {
  CryptoFileIdGenerator,
  Sha256FileContentHasher,
  SystemFileClock,
} from './infrastructure/file-runtime-services.js';
import { KyselyFileMetadataStore } from './persistence/kysely-file-metadata-store.js';
import {
  FILE_CLOCK,
  FILE_CONTENT_HASHER,
  FILE_ID_GENERATOR,
  type FileClock,
  type FileContentHasher,
  type FileIdGenerator,
} from './ports/file-application-services.js';
import {
  FILE_CONTENT_STORE,
  type FileContentStore,
} from './ports/file-content-store.js';
import {
  FILE_METADATA_STORE,
  type FileMetadataStore,
} from './ports/file-metadata-store.js';
import { IMAGE_PROCESSOR } from './ports/image-processor.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [FilesController],
  providers: [
    KyselyFileMetadataStore,
    DatabaseFileContentStore,
    SharpImageProcessor,
    CryptoFileIdGenerator,
    SystemFileClock,
    Sha256FileContentHasher,
    {
      provide: LocalFileContentStore,
      useFactory: (config: AppConfig) =>
        new LocalFileContentStore(config.files.localDirectory),
      inject: [APP_CONFIG],
    },
    { provide: FILE_METADATA_STORE, useExisting: KyselyFileMetadataStore },
    { provide: IMAGE_PROCESSOR, useExisting: SharpImageProcessor },
    { provide: FILE_ID_GENERATOR, useExisting: CryptoFileIdGenerator },
    { provide: FILE_CLOCK, useExisting: SystemFileClock },
    { provide: FILE_CONTENT_HASHER, useExisting: Sha256FileContentHasher },
    {
      provide: FILE_CONTENT_STORE,
      useFactory: (
        config: AppConfig,
        local: LocalFileContentStore,
        database: DatabaseFileContentStore,
      ): FileContentStore =>
        config.files.driver === 'local' ? local : database,
      inject: [APP_CONFIG, LocalFileContentStore, DatabaseFileContentStore],
    },
    {
      provide: CreateFileResourceUseCase,
      useFactory: (
        metadata: FileMetadataStore,
        contents: FileContentStore,
        ids: FileIdGenerator,
        clock: FileClock,
        hasher: FileContentHasher,
        unitOfWork: UnitOfWork,
      ) =>
        new CreateFileResourceUseCase(
          metadata,
          contents,
          ids,
          clock,
          hasher,
          unitOfWork,
        ),
      inject: [
        FILE_METADATA_STORE,
        FILE_CONTENT_STORE,
        FILE_ID_GENERATOR,
        FILE_CLOCK,
        FILE_CONTENT_HASHER,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: ReadFileUseCase,
      useFactory: (metadata: FileMetadataStore, contents: FileContentStore) =>
        new ReadFileUseCase(metadata, contents),
      inject: [FILE_METADATA_STORE, FILE_CONTENT_STORE],
    },
    {
      provide: GetPublicFileObjectsUseCase,
      useFactory: (metadata: FileMetadataStore) =>
        new GetPublicFileObjectsUseCase(metadata),
      inject: [FILE_METADATA_STORE],
    },
    {
      provide: CleanupFilesUseCase,
      useFactory: (
        metadata: FileMetadataStore,
        contents: FileContentStore,
        clock: FileClock,
        config: AppConfig,
      ) =>
        new CleanupFilesUseCase(
          metadata,
          contents,
          clock,
          config.files.orphanRetentionHours * 60 * 60 * 1000,
        ),
      inject: [FILE_METADATA_STORE, FILE_CONTENT_STORE, FILE_CLOCK, APP_CONFIG],
    },
    FileCleanupScheduler,
  ],
  exports: [
    CreateFileResourceUseCase,
    GetPublicFileObjectsUseCase,
    FILE_METADATA_STORE,
    IMAGE_PROCESSOR,
    FILE_CLOCK,
  ],
})
export class FilesModule {}
