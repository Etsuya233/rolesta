import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { ChatsModule } from './chats/chats.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { GenerationDebugModule } from './generation-debug/generation-debug.module.js';
import { HealthModule } from './health/health.module.js';
import { ModelProfilesModule } from './model-profiles/model-profiles.module.js';
import { PresetsModule } from './presets/presets.module.js';
import { UsersModule } from './users/users.module.js';
import { WorldbooksModule } from './worldbooks/worldbooks.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    WorldbooksModule,
    PresetsModule,
    ModelProfilesModule,
    ChatsModule,
    GenerationDebugModule,
  ],
})
export class AppModule {}
