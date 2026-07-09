import type { Clock, SessionStore, SessionTokenIssuer, UserAccountStore } from '../ports/auth-ports.js';
import type { CurrentUserResult } from './auth-results.js';

export class AuthenticateTokenUseCase {
  constructor(
    private readonly users: UserAccountStore,
    private readonly sessions: SessionStore,
    private readonly tokenIssuer: SessionTokenIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(token: string): Promise<CurrentUserResult | null> {
    const tokenHash = this.tokenIssuer.hash(token);
    const session = await this.sessions.findByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    const now = this.clock.now();

    if (session.isExpired(now)) {
      await this.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    const user = await this.users.findById(session.userId);

    if (!user) {
      await this.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    return user.toCurrentUser();
  }
}
