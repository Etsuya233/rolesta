import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type {
  FileClock,
  FileContentHasher,
  FileIdGenerator,
} from '../ports/file-application-services.js';

@Injectable()
export class CryptoFileIdGenerator implements FileIdGenerator {
  createId(): string {
    return randomUUID();
  }
}

@Injectable()
export class SystemFileClock implements FileClock {
  nowMs(): number {
    return Date.now();
  }
}

@Injectable()
export class Sha256FileContentHasher implements FileContentHasher {
  sha256(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
