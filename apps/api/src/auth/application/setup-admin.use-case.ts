import { UserAccount } from '../domain/user-account.js';
import { AuthApplicationError } from './auth-application-error.js';
import type {
  Clock,
  IdGenerator,
  PasswordHashing,
  SessionStore,
  SessionTokenIssuer,
  UserAccountStore,
} from './auth-ports.js';
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
  ) {}

  async execute(command: SetupAdminCommand): Promise<AuthenticatedUserResult> {
    if ((await this.users.count()) > 0) {
      throw new AuthApplicationError('setup-already-completed');
    }

    const username = command.username.trim();

    if (username.length === 0) {
      throw new AuthApplicationError('invalid-username');
    }

    await this.sessions.deleteExpired(this.clock.now());

    const passwordHash = await this.passwordHashing.hash(command.password);
    const user = UserAccount.createAdmin({
      id: this.idGenerator.createId(),
      username,
      passwordHash,
      now: this.clock.now().toISOString(),
    });
    const token = this.tokenIssuer.issue();

    await this.users.save(user);
    await this.sessions.save(createSessionForUser({ token, userId: user.id, clock: this.clock }));

    return { token: token.value, user: user.toCurrentUser() };
  }
}
