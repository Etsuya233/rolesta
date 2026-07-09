import { Injectable } from '@nestjs/common';
import type { Clock } from '../ports/auth-ports.js';

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
