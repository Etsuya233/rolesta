import { EventEmitter2 } from '@nestjs/event-emitter';
import { describe, expect, it } from 'vitest';
import { DomainEventPublisher } from '../../common/events/index.js';
import { KyselyDatabaseContext } from '../../database/kysely-database-context.js';
import { KyselyUnitOfWork } from '../../database/kysely-unit-of-work.js';
import { CharacterAvatarEventsListener } from '../../files/application/character-avatar-events.listener.js';
import { KyselyFileMetadataStore } from '../../files/persistence/kysely-file-metadata-store.js';
import { createTestDatabase } from '../../../../../packages/db/src/test-utils/create-test-database.js';
import { createEmptyCharacterCardDraft } from '../domain/character-card.js';
import { CHARACTER_AVATAR_CHANGED, type CharacterAvatarChangedEvent } from '../events/index.js';
import type { CharacterAvatarService } from '../ports/character-avatar-service.js';
import { KyselyCharacterAvatarAssignment } from '../persistence/kysely-character-avatar-assignment.js';
import { KyselyCharacterCardStore } from '../persistence/kysely-character-card-store.js';
import { CharacterApplicationError } from './character-application-error.js';
import { DeleteCharacterAvatarUseCase } from './delete-character-avatar.use-case.js';
import { UploadCharacterAvatarUseCase } from './upload-character-avatar.use-case.js';

describe('character avatar domain events', () => {
  it('commits the character reference and file lifecycle changes together', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const cards = new KyselyCharacterCardStore(context);
    const assignment = new KyselyCharacterAvatarAssignment(context);
    const metadata = new KyselyFileMetadataStore(context);
    const events = publisherWithFileListener(metadata);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, 'old-avatar', 'character-avatar', 'active');
      await seedResource(database.db, 'new-avatar', 'character-avatar', 'pending');
      await cards.save({
        ...createEmptyCharacterCardDraft({
          id: 'character',
          ownerUserId: 'owner',
          nowMs: 1,
        }),
        avatarResourceId: 'old-avatar',
      });
      const upload = new UploadCharacterAvatarUseCase(
        cards,
        new FixedAvatarService('new-avatar'),
        assignment,
        new FixedClock(200),
        unitOfWork,
        events,
      );

      await expect(
        upload.execute({
          id: 'character',
          ownerUserId: 'owner',
          fileName: 'avatar.png',
          content: Buffer.from('image'),
          crop: { x: 0, y: 0, width: 1, height: 1 },
        }),
      ).resolves.toMatchObject({ avatarResourceId: 'new-avatar' });
      await expect(resourceState(database.db, 'new-avatar')).resolves.toEqual({
        status: 'active',
        orphaned_at_ms: null,
      });
      await expect(resourceState(database.db, 'old-avatar')).resolves.toEqual({
        status: 'orphaned',
        orphaned_at_ms: 200,
      });

      const remove = new DeleteCharacterAvatarUseCase(
        assignment,
        new FixedClock(300),
        unitOfWork,
        events,
      );
      await remove.execute('character', 'owner');

      await expect(cards.findOwnedById('character', 'owner')).resolves.toMatchObject({
        avatarResourceId: null,
      });
      await expect(resourceState(database.db, 'new-avatar')).resolves.toEqual({
        status: 'orphaned',
        orphaned_at_ms: 300,
      });
    } finally {
      await database.destroy();
    }
  });

  it('rolls back the character update when the new resource cannot be activated', async () => {
    const database = await createTestDatabase();
    const context = new KyselyDatabaseContext(database.db);
    const unitOfWork = new KyselyUnitOfWork(database.db, context);
    const cards = new KyselyCharacterCardStore(context);
    const assignment = new KyselyCharacterAvatarAssignment(context);
    const metadata = new KyselyFileMetadataStore(context);
    const events = publisherWithFileListener(metadata);

    try {
      await seedUser(database.db, 'owner');
      await seedResource(database.db, 'old-avatar', 'character-avatar', 'active');
      await seedResource(database.db, 'candidate', 'user-avatar', 'pending');
      await cards.save({
        ...createEmptyCharacterCardDraft({
          id: 'character',
          ownerUserId: 'owner',
          nowMs: 1,
        }),
        avatarResourceId: 'old-avatar',
      });
      const upload = new UploadCharacterAvatarUseCase(
        cards,
        new FixedAvatarService('candidate'),
        assignment,
        new FixedClock(200),
        unitOfWork,
        events,
      );

      await expect(
        upload.execute({
          id: 'character',
          ownerUserId: 'owner',
          fileName: 'avatar.png',
          content: Buffer.from('image'),
          crop: { x: 0, y: 0, width: 1, height: 1 },
        }),
      ).rejects.toMatchObject(
        new CharacterApplicationError({
          reason: 'avatar-assignment-conflict',
          params: { detail: 'Avatar resource state changed concurrently.' },
        }),
      );
      await expect(cards.findOwnedById('character', 'owner')).resolves.toMatchObject({
        avatarResourceId: 'old-avatar',
        updatedAtMs: 1,
      });
      await expect(resourceState(database.db, 'old-avatar')).resolves.toEqual({
        status: 'active',
        orphaned_at_ms: null,
      });
      await expect(resourceState(database.db, 'candidate')).resolves.toEqual({
        status: 'pending',
        orphaned_at_ms: null,
      });
    } finally {
      await database.destroy();
    }
  });
});

function publisherWithFileListener(metadata: KyselyFileMetadataStore): DomainEventPublisher {
  const emitter = new EventEmitter2();
  const listener = new CharacterAvatarEventsListener(metadata);
  onAsyncEvent<CharacterAvatarChangedEvent>(emitter, CHARACTER_AVATAR_CHANGED, (event) =>
    listener.onCharacterAvatarChanged(event),
  );
  return new DomainEventPublisher(emitter);
}

function onAsyncEvent<TEvent>(
  emitter: EventEmitter2,
  eventName: string,
  listener: (event: TEvent) => Promise<void>,
): void {
  emitter.on(eventName, listener as (event: TEvent) => void);
}

class FixedAvatarService implements CharacterAvatarService {
  constructor(private readonly resourceId: string) {}

  createAvatar(): Promise<{ resourceId: string }> {
    return Promise.resolve({ resourceId: this.resourceId });
  }
}

class FixedClock {
  constructor(private readonly nowMs: number) {}

  now(): Date {
    return new Date(this.nowMs);
  }
}

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>['db'];

async function seedUser(db: TestDatabase, id: string): Promise<void> {
  await db
    .insertInto('users')
    .values({
      id,
      username: id,
      password_hash: 'unused',
      display_name: id,
      role: 'user',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();
}

async function seedResource(
  db: TestDatabase,
  id: string,
  purpose: string,
  status: 'pending' | 'active',
): Promise<void> {
  await db
    .insertInto('file_resources')
    .values({
      id,
      owner_user_id: 'owner',
      purpose,
      status,
      orphaned_at_ms: null,
      created_at_ms: 1,
    })
    .execute();
}

function resourceState(db: TestDatabase, id: string) {
  return db
    .selectFrom('file_resources')
    .select(['status', 'orphaned_at_ms'])
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}
