import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { describe, expect, it, vi } from 'vitest';
import type { DomainEvent } from './domain-event.js';
import { DomainEventHandlingError } from './domain-event-handling-error.js';
import { DomainEventPublisher } from './domain-event-publisher.js';
import { DomainEventsModule } from './domain-events.module.js';

const TEST_EVENT = 'test.completed';

describe('DomainEventPublisher', () => {
  it('completes when no listener is registered', async () => {
    const publisher = new DomainEventPublisher(new EventEmitter2());

    await expect(publisher.publish(testEvent())).resolves.toBeUndefined();
  });

  it('waits for every asynchronous listener', async () => {
    const emitter = new EventEmitter2();
    const publisher = new DomainEventPublisher(emitter);
    const completed: string[] = [];
    onAsyncEvent(emitter, TEST_EVENT, async () => {
      await Promise.resolve();
      completed.push('first');
    });
    onAsyncEvent(emitter, TEST_EVENT, async () => {
      await Promise.resolve();
      completed.push('second');
    });

    await publisher.publish(testEvent());

    expect(completed).toHaveLength(2);
    expect(completed).toEqual(expect.arrayContaining(['first', 'second']));
  });

  it('waits for nested publication', async () => {
    const emitter = new EventEmitter2();
    const publisher = new DomainEventPublisher(emitter);
    const nestedListener = vi.fn();
    onAsyncEvent(emitter, TEST_EVENT, () =>
      publisher.publish({ type: 'test.nested', occurredAtMs: 2 }),
    );
    emitter.on('test.nested', nestedListener);

    await publisher.publish(testEvent());

    expect(nestedListener).toHaveBeenCalledOnce();
  });

  it('wraps listener rejection with the event type and original cause', async () => {
    const emitter = new EventEmitter2();
    const publisher = new DomainEventPublisher(emitter);
    const cause = new Error('listener failed');
    onAsyncEvent(emitter, TEST_EVENT, () => Promise.reject(cause));

    await expect(publisher.publish(testEvent())).rejects.toMatchObject({
      name: 'DomainEventHandlingError',
      eventType: TEST_EVENT,
      cause,
    });
  });

  it('propagates errors from native Nest listeners when suppression is disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DomainEventsModule],
      providers: [RejectingListener],
    }).compile();
    await moduleRef.init();

    try {
      const publisher = moduleRef.get(DomainEventPublisher);

      await expect(publisher.publish(testEvent())).rejects.toBeInstanceOf(DomainEventHandlingError);
    } finally {
      await moduleRef.close();
    }
  });
});

@Injectable()
class RejectingListener {
  @OnEvent(TEST_EVENT, { suppressErrors: false })
  onTestCompleted(): never {
    throw new Error('native listener failed');
  }
}

function testEvent(): DomainEvent<typeof TEST_EVENT> {
  return { type: TEST_EVENT, occurredAtMs: 1 };
}

function onAsyncEvent(
  emitter: EventEmitter2,
  eventName: string,
  listener: () => Promise<unknown>,
): void {
  emitter.on(eventName, listener as () => void);
}
