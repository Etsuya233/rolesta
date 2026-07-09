import { describe, expect, it } from 'vitest';
import { AuthApplicationError } from './auth-application-error.js';
import { AuthPortError } from '../ports/auth-port-error.js';
import { AuthDomainError } from '../domain/auth-domain-error.js';
import { SetupAdminUseCase } from './setup-admin.use-case.js';
import type {
  Clock,
  IdGenerator,
  PasswordHashing,
  SessionStore,
  SessionTokenIssuer,
  UserAccountStore,
} from '../ports/auth-ports.js';

describe('auth use cases', () => {
  it('maps invalid username validation to an application error', async () => {
    const useCase = new SetupAdminUseCase(
      new InMemoryUserAccountStore(0),
      new NoopSessionStore(),
      new FakePasswordHashing(),
      new FakeSessionTokenIssuer(),
      new FixedClock('2026-07-09T00:00:00.000Z'),
      new FixedIdGenerator('user_1'),
    );

    await expect(
      useCase.execute({
        username: '   ',
        password: 'secret',
      }),
    ).rejects.toMatchObject(
      new AuthApplicationError({
        reason: 'invalid-username',
        params: {
          field: 'username',
        },
        cause: expect.any(AuthDomainError),
      }),
    );
  });

  it('maps port failures to an internal application error', async () => {
    const useCase = new SetupAdminUseCase(
      new ThrowingUserAccountStore(),
      new NoopSessionStore(),
      new FakePasswordHashing(),
      new FakeSessionTokenIssuer(),
      new FixedClock('2026-07-09T00:00:00.000Z'),
      new FixedIdGenerator('user_1'),
    );

    await expect(
      useCase.execute({
        username: 'admin',
        password: 'secret',
      }),
    ).rejects.toMatchObject(
      new AuthApplicationError({
        reason: 'internal-error',
        params: {
          component: 'user-account-store',
          operation: 'count',
        },
        cause: expect.any(AuthPortError),
      }),
    );
  });
});

class InMemoryUserAccountStore implements UserAccountStore {
  constructor(private readonly countValue: number) {}

  count(): Promise<number> {
    return Promise.resolve(this.countValue);
  }

  findById(): Promise<null> {
    return Promise.resolve(null);
  }

  findByUsername(): Promise<null> {
    return Promise.resolve(null);
  }

  save(): Promise<void> {
    return Promise.resolve();
  }
}

class ThrowingUserAccountStore implements UserAccountStore {
  count(): Promise<number> {
    return Promise.reject(
      new AuthPortError({
        reason: 'user-account-store-failed',
        params: {
          operation: 'count',
        },
      }),
    );
  }

  findById(): Promise<null> {
    return Promise.resolve(null);
  }

  findByUsername(): Promise<null> {
    return Promise.resolve(null);
  }

  save(): Promise<void> {
    return Promise.resolve();
  }
}

class NoopSessionStore implements SessionStore {
  save(): Promise<void> {
    return Promise.resolve();
  }

  findByTokenHash(): Promise<null> {
    return Promise.resolve(null);
  }

  deleteByTokenHash(): Promise<void> {
    return Promise.resolve();
  }

  deleteExpired(): Promise<void> {
    return Promise.resolve();
  }
}

class FakePasswordHashing implements PasswordHashing {
  hash(): Promise<string> {
    return Promise.resolve('hashed-password');
  }

  verify(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class FakeSessionTokenIssuer implements SessionTokenIssuer {
  issue() {
    return {
      value: 'token',
      hash: 'token-hash',
    };
  }

  hash(token: string): string {
    return `hash:${token}`;
  }
}

class FixedClock implements Clock {
  constructor(private readonly nowValue: string) {}

  now(): Date {
    return new Date(this.nowValue);
  }
}

class FixedIdGenerator implements IdGenerator {
  constructor(private readonly value: string) {}

  createId(): string {
    return this.value;
  }
}
