import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IssuedSessionToken, SessionTokenIssuer } from '../ports/auth-ports.js';
import { AuthPortError } from '../ports/auth-port-error.js';

@Injectable()
export class RandomSessionTokenIssuer implements SessionTokenIssuer {
  issue(): IssuedSessionToken {
    try {
      const value = randomBytes(32).toString('base64url');
      return { value, hash: this.hash(value) };
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-token-issuer-failed',
        params: { operation: 'issue' },
        cause: error,
      });
    }
  }

  hash(token: string): string {
    try {
      return createHash('sha256').update(token, 'utf8').digest('hex');
    } catch (error) {
      throw new AuthPortError({
        reason: 'session-token-issuer-failed',
        params: { operation: 'hash' },
        cause: error,
      });
    }
  }
}
