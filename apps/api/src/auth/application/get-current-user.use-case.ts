import type { AuthenticateTokenUseCase } from './authenticate-token.use-case.js';
import type { CurrentUserResult } from './auth-results.js';

export class GetCurrentUserUseCase {
  constructor(private readonly authenticateToken: AuthenticateTokenUseCase) {}

  async execute(token: string | null): Promise<{ user: CurrentUserResult | null }> {
    if (!token) {
      return { user: null };
    }

    return { user: await this.authenticateToken.execute(token) };
  }
}
