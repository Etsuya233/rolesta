# Character Card Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete SillyTavern-compatible character card management module with backend persistence, import/export, permissions, pagination, and a mobile-first embeddable React manager component.

**Architecture:** The API follows the existing NestJS use-case and Kysely store pattern. SillyTavern compatibility stays at mapper boundaries, while Rolesta stores an internal `CharacterCard` domain model. The web UI exposes a URL-independent `CharacterCardManager` that uses an internal page stack and reusable asset components.

**Tech Stack:** TypeScript, NestJS, Kysely, SQLite, OpenAPI, React, Vite, TanStack Query, Tailwind CSS, Radix primitives, lucide-react, Vitest, Supertest, Playwright.

---

## Planning Constraints

- Read `README.md` before implementation if the session has not already done so.
- For Java commands this repo has no Java build; the `-T 1C` Maven rule does not apply.
- Do not implement avatar file service in this phase.
- Do not preserve or export unmodeled SillyTavern fields.
- Do not add URL state inside `CharacterCardManager`; it must be embeddable.
- Keep role and permission checks in backend use cases and store queries.
- Use `xxx.mapper.ts` for object conversions.
- Use UTF-8 for all file reads and writes.

## File Structure

Create or modify these paths:

```text
packages/shared/src/pagination.ts
packages/shared/src/pagination.test.ts
packages/db/src/schema/database.ts
packages/db/src/schema/characters.ts
packages/db/src/migrations/0003_character_cards.ts
packages/db/src/migrations/index.ts
packages/db/src/migrator.test.ts
apps/api/package.json
apps/api/src/characters/characters.module.ts
apps/api/src/characters/domain/character-card.ts
apps/api/src/characters/domain/character-visibility.ts
apps/api/src/characters/domain/epoch-millis.ts
apps/api/src/characters/application/character-card-store.ts
apps/api/src/characters/application/character-application-error.ts
apps/api/src/characters/application/list-characters.use-case.ts
apps/api/src/characters/application/get-character.use-case.ts
apps/api/src/characters/application/create-character.use-case.ts
apps/api/src/characters/application/update-character.use-case.ts
apps/api/src/characters/application/delete-character.use-case.ts
apps/api/src/characters/application/import-character-card.use-case.ts
apps/api/src/characters/application/export-character-card.use-case.ts
apps/api/src/characters/infrastructure/kysely-character-card-store.ts
apps/api/src/characters/infrastructure/silly-tavern-character-card.mapper.ts
apps/api/src/characters/infrastructure/silly-tavern-character-card.mapper.spec.ts
apps/api/src/characters/infrastructure/silly-tavern-png-metadata.reader.ts
apps/api/src/characters/infrastructure/silly-tavern-png-metadata.reader.spec.ts
apps/api/src/characters/http/character-application-error.mapper.ts
apps/api/src/characters/http/character-requests.dto.ts
apps/api/src/characters/http/character-responses.dto.ts
apps/api/src/characters/http/characters.controller.ts
apps/api/test/characters.e2e-spec.ts
apps/web/package.json
apps/web/src/app/router.tsx
apps/web/src/lib/api/generated/schema.ts
apps/web/src/features/assets/components/mobile-top-bar.tsx
apps/web/src/features/assets/components/asset-list-item.tsx
apps/web/src/features/assets/components/asset-tag-list.tsx
apps/web/src/features/assets/components/asset-scope-tabs.tsx
apps/web/src/features/assets/components/asset-sort-menu.tsx
apps/web/src/features/assets/components/page-controls.tsx
apps/web/src/features/assets/components/mobile-form-section.tsx
apps/web/src/features/assets/components/collapsible-field-group.tsx
apps/web/src/features/characters/api/characters-api.ts
apps/web/src/features/characters/hooks/use-character-card-manager.ts
apps/web/src/features/characters/components/character-card-manager.tsx
apps/web/src/features/characters/components/character-card-list-panel.tsx
apps/web/src/features/characters/components/character-card-form.tsx
apps/web/src/features/characters/components/character-advanced-form.tsx
apps/web/src/features/characters/components/character-greetings-editor.tsx
apps/web/src/features/characters/components/character-import-panel.tsx
apps/web/src/features/characters/routes/characters-page.tsx
apps/web/tests/characters.spec.ts
```

## Task 1: Shared Pagination and Character Table

**Files:**
- Modify: `packages/shared/src/pagination.ts`
- Create: `packages/shared/src/pagination.test.ts`
- Create: `packages/db/src/schema/characters.ts`
- Modify: `packages/db/src/schema/database.ts`
- Create: `packages/db/src/migrations/0003_character_cards.ts`
- Modify: `packages/db/src/migrations/index.ts`
- Modify: `packages/db/src/migrator.test.ts`

- [ ] **Step 1: Write failing pagination tests**

Create `packages/shared/src/pagination.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampPageIndex, clampPageSize, getTotalPages } from './pagination.js';

describe('offset pagination helpers', () => {
  it('normalizes page index and page size', () => {
    expect(clampPageIndex(-1)).toBe(0);
    expect(clampPageIndex(2.8)).toBe(2);
    expect(clampPageSize(0)).toBe(20);
    expect(clampPageSize(500)).toBe(100);
  });

  it('calculates total pages with at least one page', () => {
    expect(getTotalPages(0, 20)).toBe(1);
    expect(getTotalPages(1, 20)).toBe(1);
    expect(getTotalPages(21, 20)).toBe(2);
  });
});
```

- [ ] **Step 2: Run failing shared test**

Run:

```powershell
pnpm --filter @rolesta/shared test -- src/pagination.test.ts
```

Expected: FAIL because `clampPageIndex` and `getTotalPages` are not exported.

- [ ] **Step 3: Replace shared pagination model**

Modify `packages/shared/src/pagination.ts`:

```ts
export interface PageRequest {
  pageIndex: number;
  pageSize: number;
}

export interface PageResponse<TItem> {
  items: TItem[];
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function clampPageIndex(pageIndex: number): number {
  if (!Number.isFinite(pageIndex)) {
    return 0;
  }

  return Math.max(Math.trunc(pageIndex), 0);
}

export function clampPageSize(pageSize: number, defaultPageSize = 20, maxPageSize = 100): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) {
    return defaultPageSize;
  }

  return Math.min(Math.trunc(pageSize), maxPageSize);
}

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(Math.ceil(totalItems / pageSize), 1);
}
```

- [ ] **Step 4: Run shared tests**

Run:

```powershell
pnpm --filter @rolesta/shared test -- src/pagination.test.ts
pnpm --filter @rolesta/shared typecheck
```

Expected: both commands exit 0.

- [ ] **Step 5: Add character schema type**

Create `packages/db/src/schema/characters.ts`:

```ts
export interface CharactersTable {
  id: string;
  owner_user_id: string;
  visibility: 'private' | 'public';
  name: string;
  nickname: string | null;
  comment: string;
  tags_json: string;
  version: string;
  creator: string | null;
  description: string;
  personality: string;
  scenario: string;
  first_message: string;
  alternate_greetings_json: string;
  group_only_greetings_json: string;
  message_example: string;
  creator_notes: string;
  creator_notes_multilingual_json: string;
  system_prompt: string;
  post_history_instructions: string;
  character_book_json: string | null;
  assets_json: string;
  source_json: string;
  metadata_json: string;
  source_format: 'sillytavern_v1' | 'sillytavern_v2' | 'sillytavern_v3';
  source_snapshot_json: string;
  created_at_ms: number;
  updated_at_ms: number;
  creation_date_ms: number | null;
  modification_date_ms: number | null;
  last_used_at_ms: number | null;
  usage_count: number;
}
```

Modify `packages/db/src/schema/database.ts`:

```ts
import type { CharactersTable } from './characters.js';
import type { MigrationLockTable, SessionsTable, UsersTable } from './users.js';

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  characters: CharactersTable;
  migration_lock: MigrationLockTable;
}
```

- [ ] **Step 6: Add migration**

Create `packages/db/src/migrations/0003_character_cards.ts` with the `characters` table and indexes:

```ts
import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('characters')
    .addColumn('id', 'varchar(255)', (column) => column.primaryKey())
    .addColumn('owner_user_id', 'varchar(255)', (column) =>
      column.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('visibility', 'varchar(16)', (column) => column.notNull())
    .addColumn('name', 'varchar(255)', (column) => column.notNull())
    .addColumn('nickname', 'varchar(255)')
    .addColumn('comment', 'text', (column) => column.notNull())
    .addColumn('tags_json', 'text', (column) => column.notNull())
    .addColumn('version', 'varchar(255)', (column) => column.notNull())
    .addColumn('creator', 'varchar(255)')
    .addColumn('description', 'text', (column) => column.notNull())
    .addColumn('personality', 'text', (column) => column.notNull())
    .addColumn('scenario', 'text', (column) => column.notNull())
    .addColumn('first_message', 'text', (column) => column.notNull())
    .addColumn('alternate_greetings_json', 'text', (column) => column.notNull())
    .addColumn('group_only_greetings_json', 'text', (column) => column.notNull())
    .addColumn('message_example', 'text', (column) => column.notNull())
    .addColumn('creator_notes', 'text', (column) => column.notNull())
    .addColumn('creator_notes_multilingual_json', 'text', (column) => column.notNull())
    .addColumn('system_prompt', 'text', (column) => column.notNull())
    .addColumn('post_history_instructions', 'text', (column) => column.notNull())
    .addColumn('character_book_json', 'text')
    .addColumn('assets_json', 'text', (column) => column.notNull())
    .addColumn('source_json', 'text', (column) => column.notNull())
    .addColumn('metadata_json', 'text', (column) => column.notNull())
    .addColumn('source_format', 'varchar(32)', (column) => column.notNull())
    .addColumn('source_snapshot_json', 'text', (column) => column.notNull())
    .addColumn('created_at_ms', 'integer', (column) => column.notNull())
    .addColumn('updated_at_ms', 'integer', (column) => column.notNull())
    .addColumn('creation_date_ms', 'integer')
    .addColumn('modification_date_ms', 'integer')
    .addColumn('last_used_at_ms', 'integer')
    .addColumn('usage_count', 'integer', (column) => column.notNull())
    .execute();

  await db.schema.createIndex('characters_owner_created_idx').on('characters').columns(['owner_user_id', 'created_at_ms']).execute();
  await db.schema.createIndex('characters_visibility_created_idx').on('characters').columns(['visibility', 'created_at_ms']).execute();
  await db.schema.createIndex('characters_updated_idx').on('characters').column('updated_at_ms').execute();
  await db.schema.createIndex('characters_name_idx').on('characters').column('name').execute();
  await db.schema.createIndex('characters_last_used_idx').on('characters').column('last_used_at_ms').execute();
  await db.schema.createIndex('characters_usage_count_idx').on('characters').column('usage_count').execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('characters_usage_count_idx').ifExists().execute();
  await db.schema.dropIndex('characters_last_used_idx').ifExists().execute();
  await db.schema.dropIndex('characters_name_idx').ifExists().execute();
  await db.schema.dropIndex('characters_updated_idx').ifExists().execute();
  await db.schema.dropIndex('characters_visibility_created_idx').ifExists().execute();
  await db.schema.dropIndex('characters_owner_created_idx').ifExists().execute();
  await db.schema.dropTable('characters').ifExists().execute();
}
```

Modify `packages/db/src/migrations/index.ts` to import and register `0003_character_cards`.

- [ ] **Step 7: Extend migration test**

Modify `packages/db/src/migrator.test.ts` to assert `characters` exists and includes `created_at_ms`, `updated_at_ms`, `visibility`, and `source_format`.

Run:

```powershell
pnpm --filter @rolesta/db test -- src/migrator.test.ts
pnpm --filter @rolesta/db typecheck
```

Expected: both commands exit 0.

- [ ] **Step 8: Commit shared pagination and DB schema**

Run:

```powershell
git add packages/shared/src/pagination.ts packages/shared/src/pagination.test.ts packages/db/src/schema packages/db/src/migrations packages/db/src/migrator.test.ts
git commit -m "feat(characters): add character table and pagination model"
```

Expected: commit succeeds.

## Task 2: Character Domain, Errors, and Store Contract

**Files:**
- Create: `apps/api/src/characters/domain/epoch-millis.ts`
- Create: `apps/api/src/characters/domain/character-visibility.ts`
- Create: `apps/api/src/characters/domain/character-card.ts`
- Create: `apps/api/src/characters/application/character-application-error.ts`
- Create: `apps/api/src/characters/application/character-card-store.ts`

- [ ] **Step 1: Add domain model**

Create `apps/api/src/characters/domain/epoch-millis.ts`:

```ts
export type EpochMillis = number;

export function ensureEpochMillis(value: number): EpochMillis {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error('Epoch millis must be a non-negative safe integer.');
  }

  return value;
}
```

Create `apps/api/src/characters/domain/character-visibility.ts`:

```ts
export type CharacterVisibility = 'private' | 'public';

export function isCharacterVisibility(value: string): value is CharacterVisibility {
  return value === 'private' || value === 'public';
}
```

Create `apps/api/src/characters/domain/character-card.ts` with the exact interface from the design spec and an exported `createEmptyCharacterCardDraft` function that fills string fields with `''`, arrays with `[]`, JSON records with `{}`, `visibility` with `'private'`, `usageCount` with `0`, and timestamp fields from the caller-provided `nowMs`.

- [ ] **Step 2: Add application error type**

Create `apps/api/src/characters/application/character-application-error.ts`:

```ts
export type CharacterApplicationErrorReason =
  | 'not-found'
  | 'forbidden'
  | 'invalid-import-file'
  | 'unsupported-character-card'
  | 'invalid-character-card';

export class CharacterApplicationError extends Error {
  constructor(readonly reason: CharacterApplicationErrorReason) {
    super(reason);
    this.name = 'CharacterApplicationError';
  }
}
```

- [ ] **Step 3: Add store contract**

Create `apps/api/src/characters/application/character-card-store.ts`:

```ts
import type { PageResponse } from '@rolesta/shared';
import type { CharacterCard } from '../domain/character-card.js';
import type { CharacterVisibility } from '../domain/character-visibility.js';

export type CharacterListScope = 'all' | 'mine' | 'public';
export type CharacterSortKey = 'createdAt' | 'updatedAt' | 'name' | 'lastUsedAt' | 'usageCount';
export type SortDirection = 'asc' | 'desc';

export interface ListCharactersRequest {
  viewerUserId: string;
  scope: CharacterListScope;
  sort: CharacterSortKey;
  direction: SortDirection;
  pageIndex: number;
  pageSize: number;
  q: string;
}

export interface CharacterCardStore {
  list(request: ListCharactersRequest): Promise<PageResponse<CharacterCard>>;
  findVisibleById(id: string, viewerUserId: string): Promise<CharacterCard | null>;
  findOwnedById(id: string, ownerUserId: string): Promise<CharacterCard | null>;
  save(card: CharacterCard): Promise<void>;
  update(card: CharacterCard): Promise<void>;
  deleteOwned(id: string, ownerUserId: string): Promise<boolean>;
}
```

- [ ] **Step 4: Typecheck API domain**

Run:

```powershell
pnpm --filter @rolesta/api typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit domain and store contract**

Run:

```powershell
git add apps/api/src/characters/domain apps/api/src/characters/application/character-application-error.ts apps/api/src/characters/application/character-card-store.ts
git commit -m "feat(characters): add character domain contract"
```

Expected: commit succeeds.

## Task 3: SillyTavern Mapper and PNG Metadata Reader

**Files:**
- Create: `apps/api/src/characters/infrastructure/silly-tavern-character-card.mapper.ts`
- Create: `apps/api/src/characters/infrastructure/silly-tavern-character-card.mapper.spec.ts`
- Create: `apps/api/src/characters/infrastructure/silly-tavern-png-metadata.reader.ts`
- Create: `apps/api/src/characters/infrastructure/silly-tavern-png-metadata.reader.spec.ts`

- [ ] **Step 1: Write mapper tests**

Create tests for V1, V2, V3, and export:

```ts
import { describe, expect, it } from 'vitest';
import {
  fromSillyTavernCharacterCard,
  toSillyTavernCharacterCard,
} from './silly-tavern-character-card.mapper.js';

describe('SillyTavern character card mapper', () => {
  it('imports V2 data fields', () => {
    const card = fromSillyTavernCharacterCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: 'Seraphina',
        description: 'Forest guardian',
        personality: 'Gentle',
        scenario: 'Ancient grove',
        first_mes: 'Welcome, traveler.',
        mes_example: '<START>',
        creator_notes: 'Use a calm tone.',
        system_prompt: 'Stay in character.',
        post_history_instructions: 'Remember the grove.',
        alternate_greetings: ['The leaves whisper.'],
        tags: ['fantasy', 'healer'],
        creator: 'tester',
        character_version: '1.2',
        extensions: {},
      },
    });

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v2',
      name: 'Seraphina',
      version: '1.2',
      tags: ['fantasy', 'healer'],
      firstMessage: 'Welcome, traveler.',
      alternateGreetings: ['The leaves whisper.'],
    });
  });

  it('imports V3 fields supported by the domain', () => {
    const card = fromSillyTavernCharacterCard({
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Nova',
        nickname: 'Pilot',
        description: 'Starship pilot',
        first_mes: 'Engines online.',
        creator_notes_multilingual: { zh: '飞行员' },
        group_only_greetings: ['Crew ready.'],
        assets: [{ type: 'icon', uri: 'asset://icon' }],
        source: ['manual'],
        creation_date: 1783090000000,
        modification_date: 1783090000100,
      },
    });

    expect(card).toMatchObject({
      sourceFormat: 'sillytavern_v3',
      nickname: 'Pilot',
      groupOnlyGreetings: ['Crew ready.'],
      creatorNotesMultilingual: { zh: '飞行员' },
      creationDateMs: 1783090000000,
      modificationDateMs: 1783090000100,
    });
  });

  it('exports only modeled fields as V3 by default', () => {
    const imported = fromSillyTavernCharacterCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: { name: 'A', description: 'B', first_mes: 'C', extensions: { unknown: true } },
    });

    const exported = toSillyTavernCharacterCard(imported, 'v3');

    expect(exported.spec).toBe('chara_card_v3');
    expect(exported.data.name).toBe('A');
    expect(exported.data.extensions).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run failing mapper tests**

Run:

```powershell
pnpm --filter @rolesta/api test -- src/characters/infrastructure/silly-tavern-character-card.mapper.spec.ts
```

Expected: FAIL because the mapper file does not exist.

- [ ] **Step 3: Implement mapper**

Create `silly-tavern-character-card.mapper.ts` with these exported functions:

```ts
export type SillyTavernExportVersion = 'v2' | 'v3';

export function fromSillyTavernCharacterCard(input: unknown): Omit<CharacterCard, 'id' | 'ownerUserId' | 'visibility' | 'createdAtMs' | 'updatedAtMs' | 'lastUsedAtMs' | 'usageCount'>;

export function toSillyTavernCharacterCard(card: CharacterCard, version: SillyTavernExportVersion): Record<string, unknown>;
```

Implementation requirements:

- Detect V1 when `input` has top-level `name`, `description`, or `first_mes` without `data`.
- Detect V2 when `spec === 'chara_card_v2'` or `data` exists with V2-style fields.
- Detect V3 when `spec === 'chara_card_v3'`.
- Map `character_version` to `version`.
- Map missing optional strings to `''`, missing arrays to `[]`, and missing records to `{}`.
- Convert safe integer `creation_date` and `modification_date` into `creationDateMs` and `modificationDateMs`; otherwise use `null`.
- Throw `CharacterApplicationError('unsupported-character-card')` when the shape is not supported.

- [ ] **Step 4: Write PNG reader tests**

Create `silly-tavern-png-metadata.reader.spec.ts` with a minimal PNG containing a `tEXt` chunk named `chara` whose value is base64 JSON:

```ts
import { describe, expect, it } from 'vitest';
import { readSillyTavernPngMetadata } from './silly-tavern-png-metadata.reader.js';

describe('readSillyTavernPngMetadata', () => {
  it('reads base64 character metadata from a PNG tEXt chunk', () => {
    const json = Buffer.from(JSON.stringify({ name: 'PNG Card', first_mes: 'Hello' }), 'utf8').toString('base64');
    const png = createPngWithTextChunk('chara', json);

    expect(readSillyTavernPngMetadata(png)).toEqual({ name: 'PNG Card', first_mes: 'Hello' });
  });
});
```

The helper `createPngWithTextChunk` belongs in the spec file. It should build PNG signature, IHDR, tEXt, IEND chunks and calculate CRC32 locally in the test.

- [ ] **Step 5: Implement PNG reader**

Create `silly-tavern-png-metadata.reader.ts`:

```ts
export function readSillyTavernPngMetadata(file: Buffer): unknown;
```

Implementation requirements:

- Verify the PNG signature.
- Iterate chunks by length and type.
- Read `tEXt` chunk key/value pairs.
- Use the `chara` key first; use `ccv3` second if present.
- Base64-decode the value and parse JSON.
- Throw `CharacterApplicationError('invalid-import-file')` if metadata is missing or invalid.

- [ ] **Step 6: Run mapper and PNG tests**

Run:

```powershell
pnpm --filter @rolesta/api test -- src/characters/infrastructure/silly-tavern-character-card.mapper.spec.ts src/characters/infrastructure/silly-tavern-png-metadata.reader.spec.ts
pnpm --filter @rolesta/api typecheck
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit compatibility mapping**

Run:

```powershell
git add apps/api/src/characters/infrastructure apps/api/src/characters/application/character-application-error.ts
git commit -m "feat(characters): add sillytavern card mapping"
```

Expected: commit succeeds.

## Task 4: Kysely Store and Use Cases

**Files:**
- Create: `apps/api/src/characters/infrastructure/kysely-character-card-store.ts`
- Create: `apps/api/src/characters/application/list-characters.use-case.ts`
- Create: `apps/api/src/characters/application/get-character.use-case.ts`
- Create: `apps/api/src/characters/application/create-character.use-case.ts`
- Create: `apps/api/src/characters/application/update-character.use-case.ts`
- Create: `apps/api/src/characters/application/delete-character.use-case.ts`
- Create: `apps/api/src/characters/application/import-character-card.use-case.ts`
- Create: `apps/api/src/characters/application/export-character-card.use-case.ts`

- [ ] **Step 1: Implement row mapping in the store**

Create `kysely-character-card-store.ts` with:

```ts
@Injectable()
export class KyselyCharacterCardStore implements CharacterCardStore {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}
}
```

Add `toCharacterCard(row)` and `toCharacterRow(card)` helpers in the same file. Parse JSON columns with `JSON.parse`, stringify JSON columns with `JSON.stringify`, and call `ensureEpochMillis` for timestamp columns returned from the database.

- [ ] **Step 2: Implement visible and owned reads**

Add:

```ts
async findVisibleById(id: string, viewerUserId: string): Promise<CharacterCard | null>
async findOwnedById(id: string, ownerUserId: string): Promise<CharacterCard | null>
```

Visible query condition:

```txt
id = :id AND (owner_user_id = :viewerUserId OR visibility = 'public')
```

Owned query condition:

```txt
id = :id AND owner_user_id = :ownerUserId
```

- [ ] **Step 3: Implement list query**

Implement `list(request)`:

- scope `all`: `(owner_user_id = viewerUserId OR visibility = 'public')`
- scope `mine`: `owner_user_id = viewerUserId`
- scope `public`: `visibility = 'public'`
- search `q`: match `name`, `comment`, and `tags_json` with `like`
- sort columns:
  - `createdAt` -> `created_at_ms`
  - `updatedAt` -> `updated_at_ms`
  - `name` -> `name`
  - `lastUsedAt` -> `last_used_at_ms`
  - `usageCount` -> `usage_count`
- always add secondary sort by `id asc`
- count total rows and fetch `limit pageSize offset pageIndex * pageSize`

- [ ] **Step 4: Implement mutations**

Add:

```ts
async save(card: CharacterCard): Promise<void>
async update(card: CharacterCard): Promise<void>
async deleteOwned(id: string, ownerUserId: string): Promise<boolean>
```

`update` must filter by `id` and `owner_user_id`.

- [ ] **Step 5: Add use cases**

Implement use cases with these constructors and rules:

```ts
new ListCharactersUseCase(store)
new GetCharacterUseCase(store)
new CreateCharacterUseCase(store, idGenerator, clock)
new UpdateCharacterUseCase(store, clock)
new DeleteCharacterUseCase(store)
new ImportCharacterCardUseCase(store, idGenerator, clock)
new ExportCharacterCardUseCase(store)
```

Rules:

- Create assigns `id`, `ownerUserId`, default visibility `private` unless request says `public`, `createdAtMs`, `updatedAtMs`, `usageCount: 0`.
- Update first loads the visible card. If no visible card exists, throw `not-found`. If the visible card is owned by another user, throw `forbidden`. Then update only modeled fields from the command.
- Delete first loads the visible card. If no visible card exists, throw `not-found`. If the visible card is owned by another user, throw `forbidden`. Then call `deleteOwned`.
- Import maps JSON/PNG payload to a domain card, assigns owner and timestamps, and saves.
- Export loads visible card and maps to SillyTavern V2 or V3.

- [ ] **Step 6: Run API typecheck**

Run:

```powershell
pnpm --filter @rolesta/api typecheck
```

Expected: command exits 0.

- [ ] **Step 7: Commit store and use cases**

Run:

```powershell
git add apps/api/src/characters/application apps/api/src/characters/infrastructure/kysely-character-card-store.ts
git commit -m "feat(characters): add character use cases"
```

Expected: commit succeeds.

## Task 5: HTTP API, E2E Tests, and OpenAPI

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/characters/characters.module.ts`
- Create: `apps/api/src/characters/http/character-application-error.mapper.ts`
- Create: `apps/api/src/characters/http/character-requests.dto.ts`
- Create: `apps/api/src/characters/http/character-responses.dto.ts`
- Create: `apps/api/src/characters/http/characters.controller.ts`
- Create: `apps/api/test/characters.e2e-spec.ts`
- Modify: `apps/web/src/lib/api/generated/schema.ts`

- [ ] **Step 1: Add multipart type dependency**

Run:

```powershell
pnpm --filter @rolesta/api add -D @types/multer
```

Expected: `apps/api/package.json` and `pnpm-lock.yaml` update.

- [ ] **Step 2: Write E2E tests**

Create `apps/api/test/characters.e2e-spec.ts` using the same `beforeEach`, `afterEach`, `createTestDatabase`, `AppModule`, and `configureApp` setup as `apps/api/test/auth.e2e-spec.ts`. Add these helpers at the bottom of the file:

```ts
async function setupAdmin(app: INestApplication): Promise<string> {
  const response = await request(app.getHttpServer() as App)
    .post('/auth/setup-admin')
    .send({ username: 'admin', password: 'very-secure-password' })
    .expect(201);

  return responseBody<AuthenticatedUserBody>(response).data.token;
}

async function createUserToken(app: INestApplication, username: string): Promise<string> {
  const db = app.get<Kysely<Database>>(KYSELY_DB, { strict: false });
  const token = `test-token-${username}`;
  const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex');

  await db
    .insertInto('users')
    .values({
      id: `user_${username}`,
      username,
      password_hash:
        'scrypt:16384:8:1:placeholder-salt:placeholder-hash-created-for-character-e2e',
      display_name: username,
      role: 'user',
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
    })
    .execute();

  await db
    .insertInto('sessions')
    .values({
      id: tokenHash,
      user_id: `user_${username}`,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      created_at: new Date(0).toISOString(),
    })
    .execute();

  return token;
}

function responseBody<TBody>(response: { body: unknown }): TBody {
  return response.body as TBody;
}
```

Import `createHash` from `node:crypto` in the E2E test file so `createUserToken` stores the same token hash format as the production `RandomSessionTokenIssuer`.

Add these tests inside `describe('Characters API', () => { ... })`:

```ts
it('imports a SillyTavern JSON character and lists it in all scope', async () => {
  const token = await setupAdmin(app!);

  await request(app!.getHttpServer() as App)
    .post('/characters/import')
    .set('Authorization', `Bearer ${token}`)
    .attach(
      'file',
      Buffer.from(
        JSON.stringify({
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: {
            name: 'Seraphina',
            description: 'Forest guardian',
            first_mes: 'Welcome.',
            tags: ['fantasy'],
            character_version: '1.2',
          },
        }),
        'utf8',
      ),
      { filename: 'seraphina.json', contentType: 'application/json' },
    )
    .expect(201);

  await request(app!.getHttpServer() as App)
    .get('/characters?scope=all&pageIndex=0&pageSize=20')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect((response) => {
      const body = responseBody<SuccessEnvelope<{ items: Array<{ name: string }> }>>(response);
      expect(body.data.items.map((item) => item.name)).toContain('Seraphina');
    });
});

it('blocks another user from editing a public character', async () => {
  const ownerToken = await setupAdmin(app!);
  const otherToken = await createUserToken(app!, 'reader');

  const createResponse = await request(app!.getHttpServer() as App)
    .post('/characters')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Public Card', firstMessage: 'Hello', visibility: 'public' })
    .expect(201);
  const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

  await request(app!.getHttpServer() as App)
    .get(`/characters/${id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .expect(200);

  await request(app!.getHttpServer() as App)
    .patch(`/characters/${id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ comment: 'edited by another user' })
    .expect(403);
});

it('keeps private characters hidden from another user', async () => {
  const ownerToken = await setupAdmin(app!);
  const otherToken = await createUserToken(app!, 'viewer');

  const createResponse = await request(app!.getHttpServer() as App)
    .post('/characters')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Private Card', firstMessage: 'Secret', visibility: 'private' })
    .expect(201);
  const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

  await request(app!.getHttpServer() as App)
    .get(`/characters/${id}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .expect(404);
});

it('paginates with pageIndex and pageSize', async () => {
  const token = await setupAdmin(app!);

  for (const name of ['A', 'B', 'C']) {
    await request(app!.getHttpServer() as App)
      .post('/characters')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, firstMessage: 'Hello' })
      .expect(201);
  }

  await request(app!.getHttpServer() as App)
    .get('/characters?pageIndex=1&pageSize=2&sort=name&direction=asc')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect((response) => {
      const body = responseBody<SuccessEnvelope<{ items: Array<{ name: string }>; totalItems: number; totalPages: number }>>(response);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0]?.name).toBe('C');
      expect(body.data.totalItems).toBe(3);
      expect(body.data.totalPages).toBe(2);
    });
});

it('exports a visible character as SillyTavern V3 JSON', async () => {
  const token = await setupAdmin(app!);
  const createResponse = await request(app!.getHttpServer() as App)
    .post('/characters')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Exported', firstMessage: 'Hello' })
    .expect(201);
  const id = responseBody<SuccessEnvelope<{ id: string }>>(createResponse).data.id;

  await request(app!.getHttpServer() as App)
    .get(`/characters/${id}/export/sillytavern?version=v3`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect((response) => {
      expect(response.body).toMatchObject({
        spec: 'chara_card_v3',
        data: { name: 'Exported', first_mes: 'Hello' },
      });
    });
});
```

- [ ] **Step 3: Run failing E2E tests**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e -- test/characters.e2e-spec.ts
```

Expected: FAIL because controller routes do not exist.

- [ ] **Step 4: Add DTOs and error mapper**

Create request DTOs for list, create, update, and import metadata in `character-requests.dto.ts`. Use `class-validator` decorators for strings, arrays, enums, booleans, `pageIndex`, and `pageSize`.

Create response DTOs:

```ts
CharacterSummaryResponseDto
CharacterDetailResponseDto
CharacterPageResponseDto
CharacterImportPreviewResponseDto
```

Create `character-application-error.mapper.ts` mapping:

- `not-found` -> `NOT_FOUND`, HTTP 404
- `forbidden` -> `FORBIDDEN`, HTTP 403
- import and validation reasons -> `VALIDATION_FAILED`, HTTP 400

- [ ] **Step 5: Add controller**

Create `characters.controller.ts`:

```ts
@ApiTags('characters')
@UseGuards(AuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(
    private readonly listCharactersUseCase: ListCharactersUseCase,
    private readonly getCharacterUseCase: GetCharacterUseCase,
    private readonly createCharacterUseCase: CreateCharacterUseCase,
    private readonly updateCharacterUseCase: UpdateCharacterUseCase,
    private readonly deleteCharacterUseCase: DeleteCharacterUseCase,
    private readonly importCharacterCardUseCase: ImportCharacterCardUseCase,
    private readonly exportCharacterCardUseCase: ExportCharacterCardUseCase,
  ) {}
}
```

Add methods:

- `GET /characters`
- `GET /characters/:id`
- `POST /characters`
- `PATCH /characters/:id`
- `DELETE /characters/:id`
- `POST /characters/import` using `FileInterceptor('file')`
- `GET /characters/:id/export/sillytavern`

- [ ] **Step 6: Wire module providers**

Modify `characters.module.ts` to import `DatabaseModule` and `AuthModule`, provide `KyselyCharacterCardStore`, bind store token, and create all use cases with `CryptoIdGenerator` and `SystemClock` or local character providers matching the existing auth module pattern.

- [ ] **Step 7: Run E2E and generate OpenAPI**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e -- test/characters.e2e-spec.ts
pnpm openapi:generate
pnpm --filter @rolesta/api typecheck
```

Expected: commands exit 0 and `apps/web/src/lib/api/generated/schema.ts` updates.

- [ ] **Step 8: Commit API routes**

Run:

```powershell
git add apps/api apps/web/src/lib/api/generated/schema.ts pnpm-lock.yaml
git commit -m "feat(characters): add character management api"
```

Expected: commit succeeds.

## Task 6: Web API Layer and Reusable Asset Components

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/features/characters/api/characters-api.ts`
- Create: `apps/web/src/features/assets/components/mobile-top-bar.tsx`
- Create: `apps/web/src/features/assets/components/asset-tag-list.tsx`
- Create: `apps/web/src/features/assets/components/asset-list-item.tsx`
- Create: `apps/web/src/features/assets/components/asset-scope-tabs.tsx`
- Create: `apps/web/src/features/assets/components/asset-sort-menu.tsx`
- Create: `apps/web/src/features/assets/components/page-controls.tsx`
- Create: `apps/web/src/features/assets/components/mobile-form-section.tsx`
- Create: `apps/web/src/features/assets/components/collapsible-field-group.tsx`

- [ ] **Step 1: Add frontend test dependencies**

Run:

```powershell
pnpm --filter @rolesta/web add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

Expected: package manifest and lockfile update.

- [ ] **Step 2: Add character API wrapper**

Create `characters-api.ts` with typed functions:

```ts
export async function listCharacters(query: ListCharactersQuery): Promise<CharacterPageResponse>;
export async function getCharacter(id: string): Promise<CharacterDetailResponse>;
export async function createCharacter(values: CharacterFormValues): Promise<CharacterDetailResponse>;
export async function updateCharacter(id: string, values: CharacterFormValues): Promise<CharacterDetailResponse>;
export async function deleteCharacter(id: string): Promise<{ ok?: boolean }>;
export async function importCharacterCard(file: File): Promise<CharacterDetailResponse>;
export async function exportCharacterCard(id: string, version: 'v2' | 'v3'): Promise<Blob>;
```

Use `openApiClient` and `requestApi` for JSON endpoints. Use `fetch` with `getAuthToken()` for blob export and multipart import if generated OpenAPI typing cannot express file upload cleanly.

- [ ] **Step 3: Create reusable components**

Implement:

- `MobileTopBar`: sticky top bar with icon back button, title, and right actions.
- `AssetTagList`: compact wrapping tag row.
- `AssetListItem`: avatar placeholder, title, metadata, tags, one-line comment.
- `AssetScopeTabs`: neutral segmented control for `all`, `mine`, `public`.
- `AssetSortMenu`: select or popover for sort key and direction.
- `PageControls`: page size select plus `«`, `‹`, `›`, `»` buttons.
- `MobileFormSection`: unframed section with label and content.
- `CollapsibleFieldGroup`: Radix collapsible wrapper.

Use lucide icons for back, import, add, save, delete, and download. Keep only primary submit buttons in `bg-primary text-primary-foreground`.

- [ ] **Step 4: Run web typecheck**

Run:

```powershell
pnpm --filter @rolesta/web typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit web API and shared UI**

Run:

```powershell
git add apps/web/package.json apps/web/src/features/assets apps/web/src/features/characters/api pnpm-lock.yaml
git commit -m "feat(web): add character api and asset components"
```

Expected: commit succeeds.

## Task 7: Character Manager List and Internal Navigation

**Files:**
- Create: `apps/web/src/features/characters/hooks/use-character-card-manager.ts`
- Create: `apps/web/src/features/characters/components/character-card-manager.tsx`
- Create: `apps/web/src/features/characters/components/character-card-list-panel.tsx`
- Create: `apps/web/src/features/characters/routes/characters-page.tsx`
- Modify: `apps/web/src/app/router.tsx`

- [ ] **Step 1: Add manager state hook**

Create `use-character-card-manager.ts`:

```ts
export type CharacterCardPanel =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'edit'; characterId: string }
  | { name: 'advanced'; characterId: string }
  | { name: 'greetings'; characterId: string }
  | { name: 'import' };

export function useCharacterCardManager() {
  const [stack, setStack] = useState<CharacterCardPanel[]>([{ name: 'list' }]);
  const currentPanel = stack[stack.length - 1] ?? { name: 'list' };

  return {
    currentPanel,
    pushPanel(panel: CharacterCardPanel) {
      setStack((items) => [...items, panel]);
    },
    popPanel() {
      setStack((items) => (items.length > 1 ? items.slice(0, -1) : items));
    },
    isRoot: stack.length === 1,
  };
}
```

- [ ] **Step 2: Add list panel**

Create `character-card-list-panel.tsx`:

- Own local state for `scope`, `sort`, `direction`, `pageIndex`, `pageSize`, and `q`.
- Use TanStack Query with `listCharacters`.
- Render search, scope tabs, sort menu, `PageControls`, then list items.
- Put pagination controls directly below filters and sort.
- Use `AssetListItem` and avatar placeholder.

- [ ] **Step 3: Add manager component**

Create `character-card-manager.tsx`:

- Render all panels in a single module container.
- Keep list panel mounted and hide it when current panel is not `list`.
- Use `MobileTopBar` on each panel.
- On root back, call `onBack`.
- On nested back, call `popPanel`.

- [ ] **Step 4: Add standalone route**

Create `characters-page.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { CharacterCardManager } from '../components/character-card-manager';

export function CharactersPage() {
  const navigate = useNavigate();
  return <CharacterCardManager onBack={() => void navigate('/app')} />;
}
```

Modify `router.tsx` to lazy-load `/app/characters` under `AppRouteGuard`.

- [ ] **Step 5: Run web typecheck**

Run:

```powershell
pnpm --filter @rolesta/web typecheck
```

Expected: command exits 0.

- [ ] **Step 6: Commit manager shell**

Run:

```powershell
git add apps/web/src/features/characters/hooks apps/web/src/features/characters/components/character-card-manager.tsx apps/web/src/features/characters/components/character-card-list-panel.tsx apps/web/src/features/characters/routes apps/web/src/app/router.tsx
git commit -m "feat(web): add character manager navigation"
```

Expected: commit succeeds.

## Task 8: Editor, Advanced Fields, Greetings, and Import UI

**Files:**
- Create: `apps/web/src/features/characters/components/character-card-form.tsx`
- Create: `apps/web/src/features/characters/components/character-advanced-form.tsx`
- Create: `apps/web/src/features/characters/components/character-greetings-editor.tsx`
- Create: `apps/web/src/features/characters/components/character-import-panel.tsx`
- Modify: `apps/web/src/features/characters/components/character-card-manager.tsx`

- [ ] **Step 1: Add character form component**

Create `character-card-form.tsx`:

- Controlled form fields for `name`, `comment`, `tags`, `version`, `visibility`, `description`, and `firstMessage`.
- Save button is primary.
- Advanced and greetings buttons are neutral.
- On create, call `createCharacter`.
- On edit, call `getCharacter` then `updateCharacter`.

- [ ] **Step 2: Add advanced form component**

Create `character-advanced-form.tsx` with collapsible sections:

- Prompt overrides: `systemPrompt`, `postHistoryInstructions`
- Metadata: `creator`, `nickname`, `source`, `assets`, `creatorNotesMultilingual`
- Direct fields: `personality`, `scenario`, `creatorNotes`, `messageExample`

- [ ] **Step 3: Add greetings editor**

Create `character-greetings-editor.tsx`:

- Edit `alternateGreetings` as an ordered list of textareas.
- Add and remove greetings.
- Save through `updateCharacter`.

- [ ] **Step 4: Add import panel**

Create `character-import-panel.tsx`:

- File input accepts `.json,.png`.
- Show selected filename.
- Call `importCharacterCard(file)`.
- On success, push edit panel for the imported character.
- Confirm import button is primary.

- [ ] **Step 5: Wire panels in manager**

Modify `character-card-manager.tsx`:

- `create` renders `CharacterCardForm`.
- `edit` renders `CharacterCardForm`.
- `advanced` renders `CharacterAdvancedForm`.
- `greetings` renders `CharacterGreetingsEditor`.
- `import` renders `CharacterImportPanel`.

- [ ] **Step 6: Run web checks**

Run:

```powershell
pnpm --filter @rolesta/web typecheck
pnpm --filter @rolesta/web test
```

Expected: commands exit 0.

- [ ] **Step 7: Commit editor UI**

Run:

```powershell
git add apps/web/src/features/characters/components
git commit -m "feat(web): add character editor panels"
```

Expected: commit succeeds.

## Task 9: End-to-End Verification and Final Polish

**Files:**
- Create: `apps/web/tests/characters.spec.ts`
- Modify: `README.md` only if a new command or setup note is required

- [ ] **Step 1: Add Playwright coverage**

Create `apps/web/tests/characters.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('renders character manager controls', async ({ page }) => {
  await page.goto('/app/characters');

  await expect(page.getByRole('heading', { name: '角色卡' })).toBeVisible();
  await expect(page.getByRole('button', { name: '«' })).toBeVisible();
  await expect(page.getByRole('button', { name: '‹' })).toBeVisible();
  await expect(page.getByRole('button', { name: '›' })).toBeVisible();
  await expect(page.getByRole('button', { name: '»' })).toBeVisible();
});
```

If auth guards redirect to setup in a clean Playwright browser, use the existing setup flow at the start of the test, then navigate to `/app/characters`.

- [ ] **Step 2: Run API, web, and E2E checks**

Run:

```powershell
pnpm --filter @rolesta/shared test
pnpm --filter @rolesta/db test
pnpm --filter @rolesta/api test
pnpm --filter @rolesta/api test:e2e
pnpm --filter @rolesta/web test
pnpm --filter @rolesta/web test:e2e
```

Expected: all commands exit 0.

- [ ] **Step 3: Run full repository verification**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
git status --short
```

Expected: verification commands exit 0. `git status --short` shows only intended final changes before commit.

- [ ] **Step 4: Commit verification assets**

Run:

```powershell
git add apps/web/tests README.md
git commit -m "test(characters): add character manager e2e coverage"
```

Expected: commit succeeds if there are staged changes.

## Self-Review Checklist

- Spec coverage: the plan includes V1/V2/V3 JSON import, PNG metadata import, CRUD, public/private permissions, `all` default list scope, pageIndex/pageSize pagination, sorting, V2/V3 JSON export, mobile-first embeddable UI, sticky top bar, and retained list state.
- Component boundary: `CharacterCardManager` does not depend on URL state and can be embedded later in WorkspaceShell.
- Compatibility boundary: SillyTavern conversion is isolated in `silly-tavern-character-card.mapper.ts`; row conversion stays in `kysely-character-card-store.ts`.
- Quality checks: every task includes targeted tests or typecheck commands plus a commit boundary.
- Known excluded work: avatar file service and PNG export with embedded metadata remain outside this implementation.
