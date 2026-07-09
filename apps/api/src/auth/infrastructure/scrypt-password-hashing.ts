import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import type { PasswordHashing } from '../ports/auth-ports.js';
import { AuthPortError } from '../ports/auth-port-error.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

@Injectable()
export class ScryptPasswordHashing implements PasswordHashing {
  async hash(password: string): Promise<string> {
    try {
      const salt = randomBytes(SALT_LENGTH).toString('base64url');
      const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

      return ['scrypt', salt, derivedKey.toString('base64url')].join('$');
    } catch (error) {
      throw new AuthPortError({
        reason: 'password-hashing-failed',
        params: { operation: 'hash' },
        cause: error,
      });
    }
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      const [algorithm, salt, expected] = passwordHash.split('$');

      if (algorithm !== 'scrypt' || !salt || !expected) {
        return false;
      }

      const expectedBuffer = Buffer.from(expected, 'base64url');
      const actualBuffer = (await scryptAsync(password, salt, expectedBuffer.length)) as Buffer;

      return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
    } catch (error) {
      throw new AuthPortError({
        reason: 'password-hashing-failed',
        params: { operation: 'verify' },
        cause: error,
      });
    }
  }
}
