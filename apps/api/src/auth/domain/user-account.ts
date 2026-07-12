import { AuthDomainError } from './auth-domain-error.js';

export type UserRole = 'admin' | 'user';

export type UserAccountSnapshot = {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  avatarResourceId: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export class UserAccount {
  private constructor(private readonly snapshot: UserAccountSnapshot) {}

  static createAdmin(options: {
    id: string;
    username: string;
    passwordHash: string;
    now: string;
  }): UserAccount {
    const username = options.username.trim();

    if (username.length === 0) {
      throw new AuthDomainError({
        reason: 'invalid-username',
        params: {
          field: 'username',
        },
      });
    }

    return new UserAccount({
      id: options.id,
      username,
      passwordHash: options.passwordHash,
      displayName: username,
      avatarResourceId: null,
      role: 'admin',
      createdAt: options.now,
      updatedAt: options.now,
    });
  }

  static restore(snapshot: UserAccountSnapshot): UserAccount {
    return new UserAccount(snapshot);
  }

  toSnapshot(): UserAccountSnapshot {
    return this.snapshot;
  }

  toCurrentUser() {
    return {
      id: this.snapshot.id,
      username: this.snapshot.username,
      displayName: this.snapshot.displayName,
      role: this.snapshot.role,
    };
  }

  get id(): string {
    return this.snapshot.id;
  }

  get passwordHash(): string {
    return this.snapshot.passwordHash;
  }
}
