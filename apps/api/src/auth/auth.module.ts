import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import {
  CLOCK,
  ID_GENERATOR,
  PASSWORD_HASHING,
  SESSION_STORE,
  SESSION_TOKEN_ISSUER,
  USER_ACCOUNT_STORE,
  type Clock,
  type IdGenerator,
  type PasswordHashing,
  type SessionStore,
  type SessionTokenIssuer,
  type UserAccountStore,
} from './application/auth-ports.js';
import { AuthenticateTokenUseCase } from './application/authenticate-token.use-case.js';
import { GetCurrentUserUseCase } from './application/get-current-user.use-case.js';
import { GetSetupStatusUseCase } from './application/get-setup-status.use-case.js';
import { LoginUseCase } from './application/login.use-case.js';
import { LogoutUseCase } from './application/logout.use-case.js';
import { SetupAdminUseCase } from './application/setup-admin.use-case.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './http/auth.guard.js';
import { CryptoIdGenerator } from './infrastructure/crypto-id-generator.js';
import { KyselySessionStore } from './infrastructure/kysely-session-store.js';
import { KyselyUserAccountStore } from './infrastructure/kysely-user-account-store.js';
import { RandomSessionTokenIssuer } from './infrastructure/random-session-token-issuer.js';
import { ScryptPasswordHashing } from './infrastructure/scrypt-password-hashing.js';
import { SystemClock } from './infrastructure/system-clock.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    KyselyUserAccountStore,
    KyselySessionStore,
    ScryptPasswordHashing,
    RandomSessionTokenIssuer,
    SystemClock,
    CryptoIdGenerator,
    { provide: USER_ACCOUNT_STORE, useExisting: KyselyUserAccountStore },
    { provide: SESSION_STORE, useExisting: KyselySessionStore },
    { provide: PASSWORD_HASHING, useExisting: ScryptPasswordHashing },
    { provide: SESSION_TOKEN_ISSUER, useExisting: RandomSessionTokenIssuer },
    { provide: CLOCK, useExisting: SystemClock },
    { provide: ID_GENERATOR, useExisting: CryptoIdGenerator },
    {
      provide: GetSetupStatusUseCase,
      useFactory: (users: UserAccountStore) => new GetSetupStatusUseCase(users),
      inject: [USER_ACCOUNT_STORE],
    },
    {
      provide: SetupAdminUseCase,
      useFactory: (
        users: UserAccountStore,
        sessions: SessionStore,
        passwordHashing: PasswordHashing,
        tokenIssuer: SessionTokenIssuer,
        clock: Clock,
        idGenerator: IdGenerator,
      ) => new SetupAdminUseCase(users, sessions, passwordHashing, tokenIssuer, clock, idGenerator),
      inject: [
        USER_ACCOUNT_STORE,
        SESSION_STORE,
        PASSWORD_HASHING,
        SESSION_TOKEN_ISSUER,
        CLOCK,
        ID_GENERATOR,
      ],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        users: UserAccountStore,
        sessions: SessionStore,
        passwordHashing: PasswordHashing,
        tokenIssuer: SessionTokenIssuer,
        clock: Clock,
      ) => new LoginUseCase(users, sessions, passwordHashing, tokenIssuer, clock),
      inject: [USER_ACCOUNT_STORE, SESSION_STORE, PASSWORD_HASHING, SESSION_TOKEN_ISSUER, CLOCK],
    },
    {
      provide: AuthenticateTokenUseCase,
      useFactory: (
        users: UserAccountStore,
        sessions: SessionStore,
        tokenIssuer: SessionTokenIssuer,
        clock: Clock,
      ) => new AuthenticateTokenUseCase(users, sessions, tokenIssuer, clock),
      inject: [USER_ACCOUNT_STORE, SESSION_STORE, SESSION_TOKEN_ISSUER, CLOCK],
    },
    {
      provide: GetCurrentUserUseCase,
      useFactory: (authenticateToken: AuthenticateTokenUseCase) =>
        new GetCurrentUserUseCase(authenticateToken),
      inject: [AuthenticateTokenUseCase],
    },
    {
      provide: LogoutUseCase,
      useFactory: (sessions: SessionStore, tokenIssuer: SessionTokenIssuer) =>
        new LogoutUseCase(sessions, tokenIssuer),
      inject: [SESSION_STORE, SESSION_TOKEN_ISSUER],
    },
    AuthGuard,
  ],
  exports: [AuthGuard, AuthenticateTokenUseCase],
})
export class AuthModule {}
