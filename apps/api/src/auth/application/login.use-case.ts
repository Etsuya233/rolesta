import { AuthApplicationError } from './auth-application-error.js';
import type {
  Clock,
  PasswordHashing,
  SessionStore,
  SessionTokenIssuer,
  UserAccountStore,
} from '../ports/auth-ports.js';
import type { AuthenticatedUserResult } from './auth-results.js';
import { createSessionForUser } from './session-factory.js';

export type LoginCommand = {
  username: string;
  password: string;
};

export class LoginUseCase {
  constructor(
    private readonly users: UserAccountStore,
    private readonly sessions: SessionStore,
    private readonly passwordHashing: PasswordHashing,
    private readonly tokenIssuer: SessionTokenIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(command: LoginCommand): Promise<AuthenticatedUserResult> {
    const user = await this.users.findByUsername(command.username.trim());

    if (!user) {
      throw new AuthApplicationError('invalid-credentials');
    }

    const passwordMatches = await this.passwordHashing.verify(command.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AuthApplicationError('invalid-credentials');
    }

    await this.sessions.deleteExpired(this.clock.now());

    const token = this.tokenIssuer.issue();
    await this.sessions.save(createSessionForUser({ token, userId: user.id, clock: this.clock }));

    return { token: token.value, user: user.toCurrentUser() };
  }
}
