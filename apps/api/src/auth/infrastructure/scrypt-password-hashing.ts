import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import type { PasswordHashing } from '../application/auth-ports.js';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

@Injectable()
export class ScryptPasswordHashing implements PasswordHashing {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH).toString('base64url');
    const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

    return ['scrypt', salt, derivedKey.toString('base64url')].join('$');
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [algorithm, salt, expected] = passwordHash.split('$');

    if (algorithm !== 'scrypt' || !salt || !expected) {
      return false;
    }

    const expectedBuffer = Buffer.from(expected, 'base64url');
    const actualBuffer = (await scryptAsync(password, salt, expectedBuffer.length)) as Buffer;

    return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
