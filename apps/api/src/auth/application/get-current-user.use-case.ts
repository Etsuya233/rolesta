import { UseCase } from '../../common/errors/index.js';
import type { AuthenticateTokenUseCase } from './authenticate-token.use-case.js';
import { translateAuthError } from './auth-error.mapper.js';
import type { CurrentUserResult } from './auth-results.js';

export class GetCurrentUserUseCase {
  constructor(private readonly authenticateToken: AuthenticateTokenUseCase) {}

  @UseCase(translateAuthError)
  async execute(token: string | null): Promise<{ user: CurrentUserResult | null }> {
    if (!token) {
      return { user: null };
    }

    return { user: await this.authenticateToken.execute(token) };
  }
}
