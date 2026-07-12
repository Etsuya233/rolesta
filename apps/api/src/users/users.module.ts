import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { CreateFileResourceUseCase } from '../files/application/create-file-resource.use-case.js';
import { FilesModule } from '../files/files.module.js';
import { IMAGE_PROCESSOR, type ImageProcessor } from '../files/ports/image-processor.js';
import { FileUserAvatarService } from './adapters/file-user-avatar-service.js';
import { DeleteUserAvatarUseCase, UploadUserAvatarUseCase } from './application/user-avatar.use-cases.js';
import { UsersController } from './http/users.controller.js';
import { KyselyUserAvatarStore } from './persistence/kysely-user-avatar-store.js';
import { USER_AVATAR_STORE, type UserAvatarStore } from './ports/user-avatar-store.js';

@Module({
  imports: [AuthModule, DatabaseModule, FilesModule],
  controllers: [UsersController],
  providers: [
    KyselyUserAvatarStore,
    { provide: USER_AVATAR_STORE, useExisting: KyselyUserAvatarStore },
    {
      provide: FileUserAvatarService,
      useFactory: (images: ImageProcessor, createFiles: CreateFileResourceUseCase) => new FileUserAvatarService(images, createFiles),
      inject: [IMAGE_PROCESSOR, CreateFileResourceUseCase],
    },
    {
      provide: UploadUserAvatarUseCase,
      useFactory: (avatars: FileUserAvatarService, store: UserAvatarStore) => new UploadUserAvatarUseCase(avatars, store),
      inject: [FileUserAvatarService, USER_AVATAR_STORE],
    },
    {
      provide: DeleteUserAvatarUseCase,
      useFactory: (store: UserAvatarStore) => new DeleteUserAvatarUseCase(store),
      inject: [USER_AVATAR_STORE],
    },
  ],
})
export class UsersModule {}
