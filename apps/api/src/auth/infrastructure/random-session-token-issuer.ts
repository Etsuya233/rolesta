import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IssuedSessionToken, SessionTokenIssuer } from '../ports/auth-ports.js';

@Injectable()
export class RandomSessionTokenIssuer implements SessionTokenIssuer {
  issue(): IssuedSessionToken {
    const value = randomBytes(32).toString('base64url');
    return { value, hash: this.hash(value) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
