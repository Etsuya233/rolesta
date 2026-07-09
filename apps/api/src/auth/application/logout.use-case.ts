import { UseCase } from '../../common/errors/index.js';
import { translateAuthError } from './auth-error.mapper.js';
import type { SessionStore, SessionTokenIssuer } from '../ports/auth-ports.js';

export class LogoutUseCase {
  constructor(
    private readonly sessions: SessionStore,
    private readonly tokenIssuer: SessionTokenIssuer,
  ) {}

  @UseCase(translateAuthError)
  async execute(token: string | null): Promise<{ ok: true }> {
    if (token) {
      await this.sessions.deleteByTokenHash(this.tokenIssuer.hash(token));
    }

    return { ok: true };
  }
}
