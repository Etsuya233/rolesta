import { Session } from '../domain/session.js';
import type { Clock, IssuedSessionToken } from '../ports/auth-ports.js';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export function createSessionForUser(options: {
  token: IssuedSessionToken;
  userId: string;
  clock: Clock;
}): Session {
  const createdAt = options.clock.now();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DURATION_MS);

  return Session.create({
    tokenHash: options.token.hash,
    userId: options.userId,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}
