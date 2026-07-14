import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { DomainEvent } from './domain-event.js';
import { DomainEventHandlingError } from './domain-event-handling-error.js';

@Injectable()
export class DomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(event: DomainEvent): Promise<void> {
    try {
      await this.eventEmitter.emitAsync(event.type, event);
    } catch (error) {
      throw new DomainEventHandlingError(event.type, error);
    }
  }
}
