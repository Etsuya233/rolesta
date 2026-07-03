import type { Session } from '../domain/session.js';
import type { UserAccount } from '../domain/user-account.js';

export const USER_ACCOUNT_STORE = Symbol('USER_ACCOUNT_STORE');
export const SESSION_STORE = Symbol('SESSION_STORE');
export const PASSWORD_HASHING = Symbol('PASSWORD_HASHING');
export const SESSION_TOKEN_ISSUER = Symbol('SESSION_TOKEN_ISSUER');
export const CLOCK = Symbol('CLOCK');
export const ID_GENERATOR = Symbol('ID_GENERATOR');

export interface UserAccountStore {
  count(): Promise<number>;
  findById(id: string): Promise<UserAccount | null>;
  findByUsername(username: string): Promise<UserAccount | null>;
  save(user: UserAccount): Promise<void>;
}

export interface SessionStore {
  save(session: Session): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteExpired(now: Date): Promise<void>;
}

export interface PasswordHashing {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

export type IssuedSessionToken = {
  value: string;
  hash: string;
};

export interface SessionTokenIssuer {
  issue(): IssuedSessionToken;
  hash(token: string): string;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  createId(): string;
}
