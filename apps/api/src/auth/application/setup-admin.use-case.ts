import { UseCase } from '../../common/errors/index.js';
import type { UnitOfWork } from '../../common/application/unit-of-work.js';
import { UserAccount } from '../domain/user-account.js';
import { AuthApplicationError } from './auth-application-error.js';
import { translateAuthError } from './auth-error.mapper.js';
import type {
  Clock,
  IdGenerator,
  PasswordHashing,
  SessionStore,
  SessionTokenIssuer,
  UserAccountStore,
} from '../ports/auth-ports.js';
import type { AuthenticatedUserResult } from './auth-results.js';
import { createSessionForUser } from './session-factory.js';

export type SetupAdminCommand = {
  username: string;
  password: string;
};

export class SetupAdminUseCase {
  constructor(
    private readonly users: UserAccountStore,
    private readonly sessions: SessionStore,
    private readonly passwordHashing: PasswordHashing,
    private readonly tokenIssuer: SessionTokenIssuer,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  @UseCase(translateAuthError)
  async execute(command: SetupAdminCommand): Promise<AuthenticatedUserResult> {
    const passwordHash = await this.passwordHashing.hash(command.password);
    const user = UserAccount.createAdmin({
      id: this.idGenerator.createId(),
      username: command.username,
      passwordHash,
      now: this.clock.now().toISOString(),
    });
    const token = this.tokenIssuer.issue();

    return this.unitOfWork.run(async () => {
      if ((await this.users.count()) > 0) {
        throw new AuthApplicationError({
          reason: 'setup-already-completed',
          params: { operation: 'setup-admin' },
        });
      }

      await this.sessions.deleteExpired(this.clock.now());
      await this.users.save(user);
      await this.sessions.save(createSessionForUser({ token, userId: user.id, clock: this.clock }));

      return { token: token.value, user: user.toCurrentUser() };
    });
  }
}
