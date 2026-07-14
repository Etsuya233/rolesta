import { Module } from '@nestjs/common';
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from '../common/application/unit-of-work.js';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { CreateFileResourceUseCase } from '../files/application/create-file-resource.use-case.js';
import { GetPublicFileObjectsUseCase } from '../files/application/get-public-file-objects.use-case.js';
import { FilesModule } from '../files/files.module.js';
import { FILE_CLOCK } from '../files/ports/file-application-services.js';
import {
  IMAGE_PROCESSOR,
  type ImageProcessor,
} from '../files/ports/image-processor.js';
import { FileUserAvatarService } from './adapters/file-user-avatar-service.js';
import { GetUserAvatarUseCase } from './application/get-user-avatar.use-case.js';
import {
  DeleteUserAvatarUseCase,
  UploadUserAvatarUseCase,
  type UserAvatarClock,
} from './application/user-avatar.use-cases.js';
import { UsersController } from './http/users.controller.js';
import { KyselyUserAvatarAssignment } from './persistence/kysely-user-avatar-assignment.js';
import { KyselyUserAvatarReader } from './persistence/kysely-user-avatar-reader.js';
import {
  USER_AVATAR_ASSIGNMENT,
  type UserAvatarAssignment,
} from './ports/user-avatar-assignment.js';
import {
  USER_AVATAR_READER,
  type UserAvatarReader,
} from './ports/user-avatar-reader.js';
import {
  USER_AVATAR_SERVICE,
  type UserAvatarService,
} from './ports/user-avatar-service.js';

@Module({
  imports: [AuthModule, DatabaseModule, FilesModule],
  controllers: [UsersController],
  providers: [
    KyselyUserAvatarAssignment,
    KyselyUserAvatarReader,
    {
      provide: USER_AVATAR_ASSIGNMENT,
      useExisting: KyselyUserAvatarAssignment,
    },
    { provide: USER_AVATAR_READER, useExisting: KyselyUserAvatarReader },
    {
      provide: FileUserAvatarService,
      useFactory: (
        images: ImageProcessor,
        createFiles: CreateFileResourceUseCase,
      ) => new FileUserAvatarService(images, createFiles),
      inject: [IMAGE_PROCESSOR, CreateFileResourceUseCase],
    },
    { provide: USER_AVATAR_SERVICE, useExisting: FileUserAvatarService },
    {
      provide: UploadUserAvatarUseCase,
      useFactory: (
        avatars: UserAvatarService,
        assignment: UserAvatarAssignment,
        clock: UserAvatarClock,
        unitOfWork: UnitOfWork,
      ) => new UploadUserAvatarUseCase(avatars, assignment, clock, unitOfWork),
      inject: [
        USER_AVATAR_SERVICE,
        USER_AVATAR_ASSIGNMENT,
        FILE_CLOCK,
        UNIT_OF_WORK,
      ],
    },
    {
      provide: DeleteUserAvatarUseCase,
      useFactory: (
        assignment: UserAvatarAssignment,
        clock: UserAvatarClock,
        unitOfWork: UnitOfWork,
      ) => new DeleteUserAvatarUseCase(assignment, clock, unitOfWork),
      inject: [USER_AVATAR_ASSIGNMENT, FILE_CLOCK, UNIT_OF_WORK],
    },
    {
      provide: GetUserAvatarUseCase,
      useFactory: (
        reader: UserAvatarReader,
        publicFiles: GetPublicFileObjectsUseCase,
      ) => new GetUserAvatarUseCase(reader, publicFiles),
      inject: [USER_AVATAR_READER, GetPublicFileObjectsUseCase],
    },
  ],
})
export class UsersModule {}
