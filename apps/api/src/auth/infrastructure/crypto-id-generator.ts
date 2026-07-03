import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { IdGenerator } from '../application/auth-ports.js';

@Injectable()
export class CryptoIdGenerator implements IdGenerator {
  createId(): string {
    return randomUUID();
  }
}
