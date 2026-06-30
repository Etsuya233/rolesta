# Rolesta Project Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the initial Rolesta TypeScript monorepo skeleton for a separated NestJS API and React workbench frontend.

**Architecture:** The repository will use pnpm workspaces and Turborepo with `apps/api`, `apps/web`, `packages/config`, `packages/db`, and `packages/shared`. Backend modules follow controller/service/repository boundaries, frontend features separate API calls, TanStack Query hooks, form logic, layout components, and route rendering.

**Tech Stack:** pnpm, Turborepo, TypeScript, NestJS, Kysely, SQLite, React, Vite, Tailwind CSS, shadcn/ui-compatible primitives, Radix, TanStack Query, React Hook Form, Zod, Vitest, Playwright, OpenAPI.

---

## Planning Constraints

- Keep state, API calls, form logic, and rendering in separate frontend units. Do not put them all in one component.
- Reuse UI primitives before adding new style fragments.
- If implementation discovers that the current structure blocks a feature, stop and make the smallest structural cleanup first.
- Keep SQLite simple: application-generated string ids, ISO timestamp strings, text JSON snapshots, and normal columns for queryable fields.
- Keep repository queries portable by default. Add dialect-specific repository overrides only after a concrete need appears.
- Do not implement full character, worldbook, preset, model call, or chat generation features in this skeleton.

## File Structure

Create or modify these paths:

```text
.env.example
.github/workflows/ci.yml
.eslint.config.cjs
.gitignore
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
vitest.workspace.ts
apps/api/.env.example
apps/api/package.json
apps/api/nest-cli.json
apps/api/tsconfig.json
apps/api/tsconfig.build.json
apps/api/vitest.config.ts
apps/api/test/setup-vitest.ts
apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/configure-app.ts
apps/api/src/config/app-config.ts
apps/api/src/config/config.module.ts
apps/api/src/database/database.module.ts
apps/api/src/database/database.provider.ts
apps/api/src/health/health.controller.ts
apps/api/src/health/health.module.ts
apps/api/src/health/health.service.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/auth/auth.module.ts
apps/api/src/auth/auth.service.ts
apps/api/src/auth/dto/current-user-response.dto.ts
apps/api/src/auth/dto/login-request.dto.ts
apps/api/src/auth/dto/setup-admin-request.dto.ts
apps/api/src/users/users.module.ts
apps/api/src/characters/characters.module.ts
apps/api/src/worldbooks/worldbooks.module.ts
apps/api/src/presets/presets.module.ts
apps/api/src/model-profiles/model-profiles.module.ts
apps/api/src/chats/chats.module.ts
apps/api/src/generation-debug/generation-debug.module.ts
apps/api/test/health.e2e-spec.ts
apps/api/test/openapi.e2e-spec.ts
apps/web/package.json
apps/web/components.json
apps/web/index.html
apps/web/tsconfig.json
apps/web/tsconfig.node.json
apps/web/vite.config.ts
apps/web/vitest.config.ts
apps/web/postcss.config.js
apps/web/tailwind.config.ts
apps/web/src/main.tsx
apps/web/src/app/app.tsx
apps/web/src/app/router.tsx
apps/web/src/app/providers.tsx
apps/web/src/app/workbench-layout.tsx
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/card.tsx
apps/web/src/components/ui/field.tsx
apps/web/src/components/ui/input.tsx
apps/web/src/components/ui/separator.tsx
apps/web/src/features/auth/api/auth-api.ts
apps/web/src/features/auth/hooks/use-current-user.ts
apps/web/src/features/auth/schemas/login-schema.ts
apps/web/src/features/auth/routes/login-page.tsx
apps/web/src/features/auth/routes/setup-page.tsx
apps/web/src/features/chats/routes/workbench-page.tsx
apps/web/src/lib/api/client.ts
apps/web/src/lib/api/generated/schema.ts
apps/web/src/lib/api/openapi-types.ts
apps/web/src/lib/api/sse-client.ts
apps/web/src/lib/forms/form-error.ts
apps/web/src/lib/utils.ts
apps/web/src/styles/globals.css
apps/web/tests/workbench.spec.ts
packages/config/package.json
packages/config/eslint/base.cjs
packages/config/prettier/base.cjs
packages/config/tsconfig/base.json
packages/db/package.json
packages/db/tsconfig.json
packages/db/vitest.config.ts
packages/db/src/index.ts
packages/db/src/schema/database.ts
packages/db/src/schema/users.ts
packages/db/src/migrations/0001_initial.ts
packages/db/src/migrator.ts
packages/db/src/dialects/sqlite.ts
packages/db/src/test-utils/create-test-database.ts
packages/db/src/migrator.test.ts
packages/shared/package.json
packages/shared/tsconfig.json
packages/shared/vitest.config.ts
packages/shared/src/index.ts
packages/shared/src/errors.ts
packages/shared/src/pagination.ts
packages/shared/src/time.ts
packages/shared/src/time.test.ts
```

## Task 1: Root Workspace and Shared Tooling

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `eslint.config.cjs`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig/base.json`
- Create: `packages/config/eslint/base.cjs`
- Create: `packages/config/prettier/base.cjs`

- [ ] **Step 1: Confirm clean starting state**

Run:

```powershell
git status --short
```

Expected: no output.

- [ ] **Step 2: Create root workspace manifests**

Create `package.json`:

```json
{
  "name": "rolesta",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:migrate": "pnpm --filter @rolesta/db migrate",
    "db:seed": "pnpm --filter @rolesta/db seed",
    "openapi:generate": "pnpm --filter @rolesta/api openapi:generate && pnpm --filter @rolesta/web openapi:generate",
    "format": "prettier --write \"**/*.{ts,tsx,js,cjs,json,md,css}\""
  },
  "devDependencies": {
    "@eslint/js": "^9.30.0",
    "@types/node": "^22.15.30",
    "eslint": "^9.30.0",
    "prettier": "^3.5.3",
    "turbo": "^2.5.4",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.34.1",
    "vitest": "^3.2.4"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**", "test-results/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "openapi:generate": {
      "dependsOn": ["^build"],
      "outputs": ["src/lib/api/generated/**", "openapi.json"]
    }
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@rolesta/shared": ["packages/shared/src/index.ts"],
      "@rolesta/db": ["packages/db/src/index.ts"]
    }
  }
}
```

Create `vitest.workspace.ts`:

```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/shared/vitest.config.ts',
  'packages/db/vitest.config.ts',
  'apps/api/vitest.config.ts',
  'apps/web/vitest.config.ts',
]);
```

Create `eslint.config.cjs`:

```js
module.exports = require('./packages/config/eslint/base.cjs');
```

- [ ] **Step 3: Update ignore rules and environment example**

Add these lines to `.gitignore` if they are missing:

```gitignore
.turbo/
.data/
**/openapi.json
playwright-report/
test-results/
```

Create `.env.example`:

```dotenv
NODE_ENV=development
API_HOST=127.0.0.1
API_PORT=3000
WEB_PORT=5173
WEB_API_BASE_URL=http://127.0.0.1:3000
DATABASE_DIALECT=sqlite
SQLITE_DATABASE_PATH=.data/rolesta.sqlite
SESSION_SECRET=change-me-in-local-development
MODEL_PROVIDER_BASE_URL=
MODEL_PROVIDER_API_KEY=
```

- [ ] **Step 4: Create shared config package**

Create `packages/config/package.json`:

```json
{
  "name": "@rolesta/config",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    "./eslint/base": "./eslint/base.cjs",
    "./prettier/base": "./prettier/base.cjs",
    "./tsconfig/base": "./tsconfig/base.json"
  }
}
```

Create `packages/config/tsconfig/base.json`:

```json
{
  "extends": "../../../tsconfig.base.json"
}
```

Create `packages/config/eslint/base.cjs`:

```js
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd()
      }
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
);
```

Create `packages/config/prettier/base.cjs`:

```js
module.exports = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100
};
```

- [ ] **Step 5: Install root dependencies**

Run:

```powershell
pnpm install
```

Expected: command exits 0 and creates `pnpm-lock.yaml`.

- [ ] **Step 6: Verify root workspace command wiring**

Run:

```powershell
pnpm turbo --version
```

Expected: prints a Turborepo version.

- [ ] **Step 7: Commit root workspace tooling**

Run:

```powershell
git add package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json vitest.workspace.ts eslint.config.cjs .gitignore .env.example packages/config
git commit -m "build(workspace): add monorepo tooling"
```

Expected: commit succeeds.

## Task 2: Shared Package Foundation

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/errors.ts`
- Create: `packages/shared/src/pagination.ts`
- Create: `packages/shared/src/time.ts`
- Create: `packages/shared/src/time.test.ts`

- [ ] **Step 1: Create shared package manifest**

Create `packages/shared/package.json`:

```json
{
  "name": "@rolesta/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint \"src/**/*.ts\"",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@rolesta/config": "workspace:*"
  }
}
```

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"]
}
```

Create `packages/shared/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write failing shared time tests**

Create `packages/shared/src/time.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createIsoTimestamp, isIsoTimestamp } from './time.js';

describe('time helpers', () => {
  it('creates an ISO timestamp string', () => {
    const timestamp = createIsoTimestamp(new Date('2026-06-30T12:00:00.000Z'));

    expect(timestamp).toBe('2026-06-30T12:00:00.000Z');
  });

  it('detects invalid timestamp values', () => {
    expect(isIsoTimestamp('2026-06-30T12:00:00.000Z')).toBe(true);
    expect(isIsoTimestamp('2026-06-30 12:00:00')).toBe(false);
    expect(isIsoTimestamp('')).toBe(false);
  });
});
```

- [ ] **Step 3: Run the failing shared test**

Run:

```powershell
pnpm --filter @rolesta/shared test
```

Expected: FAIL because `packages/shared/src/time.ts` does not exist.

- [ ] **Step 4: Implement shared helpers**

Create `packages/shared/src/errors.ts`:

```ts
export const ERROR_CODES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiErrorResponse {
  code: ErrorCode;
  message: string;
}
```

Create `packages/shared/src/pagination.ts`:

```ts
export interface PageRequest {
  limit: number;
  cursor?: string;
}

export interface PageResponse<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export function clampPageLimit(limit: number, maxLimit = 100): number {
  if (!Number.isFinite(limit)) {
    return maxLimit;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), maxLimit);
}
```

Create `packages/shared/src/time.ts`:

```ts
export type IsoTimestamp = string;

export function createIsoTimestamp(date = new Date()): IsoTimestamp {
  return date.toISOString();
}

export function isIsoTimestamp(value: string): value is IsoTimestamp {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return new Date(parsed).toISOString() === value;
}
```

Create `packages/shared/src/index.ts`:

```ts
export * from './errors.js';
export * from './pagination.js';
export * from './time.js';
```

- [ ] **Step 5: Run shared tests and typecheck**

Run:

```powershell
pnpm --filter @rolesta/shared test
pnpm --filter @rolesta/shared typecheck
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit shared package**

Run:

```powershell
git add packages/shared
git commit -m "build(shared): add shared package foundation"
```

Expected: commit succeeds.

## Task 3: Database Package with SQLite Migration

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/vitest.config.ts`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/src/schema/database.ts`
- Create: `packages/db/src/schema/users.ts`
- Create: `packages/db/src/migrations/0001_initial.ts`
- Create: `packages/db/src/migrator.ts`
- Create: `packages/db/src/dialects/sqlite.ts`
- Create: `packages/db/src/test-utils/create-test-database.ts`
- Create: `packages/db/src/migrator.test.ts`

- [ ] **Step 1: Create database package manifest**

Create `packages/db/package.json`:

```json
{
  "name": "@rolesta/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint \"src/**/*.ts\"",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "migrate": "node dist/migrator.js",
    "seed": "node -e \"console.log('No seed data is defined for the skeleton.')\""
  },
  "dependencies": {
    "better-sqlite3": "^11.10.0",
    "kysely": "^0.28.2"
  },
  "devDependencies": {
    "@rolesta/config": "workspace:*",
    "@types/better-sqlite3": "^7.6.13"
  }
}
```

Create `packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"]
}
```

Create `packages/db/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: Write failing migration test**

Create `packages/db/src/migrator.test.ts`:

```ts
import { sql } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from './test-utils/create-test-database.js';

describe('database migrations', () => {
  const databases: Array<Awaited<ReturnType<typeof createTestDatabase>>> = [];

  afterEach(async () => {
    await Promise.all(databases.map((database) => database.destroy()));
    databases.length = 0;
  });

  it('creates the users table with portable columns', async () => {
    const database = await createTestDatabase();
    databases.push(database);

    const rows = await sql<{ name: string }>`select name from sqlite_master where type = 'table'`
      .execute(database.db)
      .then((result) => result.rows.map((row) => row.name));

    expect(rows).toContain('users');
  });
});
```

- [ ] **Step 3: Run the failing migration test**

Run:

```powershell
pnpm install
pnpm --filter @rolesta/db test
```

Expected: FAIL because `create-test-database.ts` does not exist.

- [ ] **Step 4: Implement SQLite schema, dialect, and migration**

Create `packages/db/src/schema/users.ts`:

```ts
import type { Generated } from 'kysely';

export interface UsersTable {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface SessionsTable {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface MigrationLockTable {
  id: Generated<number>;
  locked_at: string;
}
```

Create `packages/db/src/schema/database.ts`:

```ts
import type { MigrationLockTable, SessionsTable, UsersTable } from './users.js';

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  migration_lock: MigrationLockTable;
}
```

Create `packages/db/src/dialects/sqlite.ts`:

```ts
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import DatabaseDriver = require('better-sqlite3');
import { Kysely, SqliteDialect } from 'kysely';
import type { Database } from '../schema/database.js';

export interface SqliteDatabaseOptions {
  databasePath: string;
}

export function createSqliteDatabase(options: SqliteDatabaseOptions): Kysely<Database> {
  mkdirSync(path.dirname(options.databasePath), { recursive: true });

  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new DatabaseDriver(options.databasePath),
    }),
  });
}
```

Create `packages/db/src/migrations/0001_initial.ts`:

```ts
import type { Kysely } from 'kysely';
import type { Database } from '../schema/database.js';

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('email', 'text', (column) => column.notNull().unique())
    .addColumn('password_hash', 'text', (column) => column.notNull())
    .addColumn('display_name', 'text', (column) => column.notNull())
    .addColumn('role', 'text', (column) => column.notNull())
    .addColumn('created_at', 'text', (column) => column.notNull())
    .addColumn('updated_at', 'text', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'text', (column) => column.primaryKey())
    .addColumn('user_id', 'text', (column) => column.notNull().references('users.id').onDelete('cascade'))
    .addColumn('expires_at', 'text', (column) => column.notNull())
    .addColumn('created_at', 'text', (column) => column.notNull())
    .execute();

  await db.schema
    .createTable('migration_lock')
    .ifNotExists()
    .addColumn('id', 'integer', (column) => column.primaryKey().autoIncrement())
    .addColumn('locked_at', 'text', (column) => column.notNull())
    .execute();
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('sessions').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
  await db.schema.dropTable('migration_lock').ifExists().execute();
}
```

Create `packages/db/src/migrator.ts`:

```ts
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { FileMigrationProvider, Migrator } from 'kysely';
import { createSqliteDatabase } from './dialects/sqlite.js';

export async function migrateToLatest(databasePath: string): Promise<void> {
  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  const db = createSqliteDatabase({ databasePath });

  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(import.meta.dirname, 'migrations'),
      }),
    });

    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
      if (result.status === 'Success') {
        console.log(`Migration ${result.migrationName} completed`);
      }
    });

    if (error) {
      throw error;
    }
  } finally {
    await db.destroy();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const databasePath = process.env.SQLITE_DATABASE_PATH ?? '.data/rolesta.sqlite';
  await migrateToLatest(databasePath);
}
```

Create `packages/db/src/test-utils/create-test-database.ts`:

```ts
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FileMigrationProvider, Migrator } from 'kysely';
import { createSqliteDatabase } from '../dialects/sqlite.js';

export async function createTestDatabase() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rolesta-db-'));
  const databasePath = path.join(directory, 'test.sqlite');
  const db = createSqliteDatabase({ databasePath });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(import.meta.dirname, '..', 'migrations'),
    }),
  });

  const { error } = await migrator.migrateToLatest();

  if (error) {
    await db.destroy();
    throw error;
  }

  return {
    db,
    databasePath,
    async destroy() {
      await db.destroy();
      await fs.rm(directory, { recursive: true, force: true });
    },
  };
}
```

Create `packages/db/src/index.ts`:

```ts
export * from './dialects/sqlite.js';
export * from './migrator.js';
export type * from './schema/database.js';
export type * from './schema/users.js';
```

- [ ] **Step 5: Run database tests and typecheck**

Run:

```powershell
pnpm --filter @rolesta/db test
pnpm --filter @rolesta/db typecheck
pnpm --filter @rolesta/db build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit database package**

Run:

```powershell
git add packages/db pnpm-lock.yaml
git commit -m "build(db): add sqlite migration foundation"
```

Expected: commit succeeds.

## Task 4: NestJS API Skeleton

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/test/setup-vitest.ts`
- Create: `apps/api/.env.example`
- Create: `apps/api/src/configure-app.ts`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/config/app-config.ts`
- Create: `apps/api/src/config/config.module.ts`
- Create: `apps/api/src/database/database.module.ts`
- Create: `apps/api/src/database/database.provider.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/api/src/health/health.service.ts`
- Create: `apps/api/test/health.e2e-spec.ts`

- [ ] **Step 1: Create API package manifest**

Create `apps/api/package.json`:

```json
{
  "name": "@rolesta/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "nest build",
    "start": "node dist/main.js",
    "test": "vitest run",
    "test:e2e": "vitest run test",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "openapi:generate": "tsx src/openapi/generate-openapi.ts"
  },
  "dependencies": {
    "@nestjs/common": "^11.1.3",
    "@nestjs/core": "^11.1.3",
    "@nestjs/platform-express": "^11.1.3",
    "@nestjs/swagger": "^11.2.0",
    "@rolesta/db": "workspace:*",
    "@rolesta/shared": "workspace:*",
    "cookie-parser": "^1.4.7",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.7",
    "@nestjs/testing": "^11.1.3",
    "@rolesta/config": "workspace:*",
    "@types/cookie-parser": "^1.4.8",
    "@types/express": "^5.0.3",
    "supertest": "^7.1.1",
    "tsx": "^4.20.3"
  }
}
```

Create `apps/api/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "tsConfigPath": "tsconfig.build.json",
    "deleteOutDir": true
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

Create `apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["test/**/*.ts", "src/**/*.test.ts"]
}
```

Create `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    globals: false,
    setupFiles: ['./test/setup-vitest.ts'],
  },
});
```

Create `apps/api/test/setup-vitest.ts`:

```ts
import 'reflect-metadata';
```

Create `apps/api/.env.example`:

```dotenv
NODE_ENV=development
API_HOST=127.0.0.1
API_PORT=3000
DATABASE_DIALECT=sqlite
SQLITE_DATABASE_PATH=../../.data/rolesta.sqlite
SESSION_SECRET=change-me-in-local-development
```

- [ ] **Step 2: Write failing health e2e test**

Create `apps/api/test/health.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('Health API', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns service status', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 'ok',
          service: 'rolesta-api',
        });
      });
  });
});
```

- [ ] **Step 3: Run failing API test**

Run:

```powershell
pnpm install
pnpm --filter @rolesta/api test:e2e
```

Expected: FAIL because `apps/api/src/app.module.ts` does not exist.

- [ ] **Step 4: Implement API app, config, database provider, and health endpoint**

Create `apps/api/src/config/app-config.ts`:

```ts
export interface AppConfig {
  nodeEnv: string;
  host: string;
  port: number;
  databaseDialect: 'sqlite';
  sqliteDatabasePath: string;
  sessionSecret: string;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    host: env.API_HOST ?? '127.0.0.1',
    port: Number.parseInt(env.API_PORT ?? '3000', 10),
    databaseDialect: 'sqlite',
    sqliteDatabasePath: env.SQLITE_DATABASE_PATH ?? '.data/rolesta.sqlite',
    sessionSecret: env.SESSION_SECRET ?? 'change-me-in-local-development',
  };
}
```

Create `apps/api/src/config/config.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { loadAppConfig } from './app-config.js';

export const APP_CONFIG = Symbol('APP_CONFIG');

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadAppConfig(),
    },
  ],
  exports: [APP_CONFIG],
})
export class ConfigModule {}
```

Create `apps/api/src/database/database.provider.ts`:

```ts
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { createSqliteDatabase, type Database } from '@rolesta/db';
import type { Kysely } from 'kysely';
import type { AppConfig } from '../config/app-config.js';
import { APP_CONFIG } from '../config/config.module.js';

export const KYSELY_DB = Symbol('KYSELY_DB');

@Injectable()
export class DatabaseLifecycle implements OnModuleDestroy {
  constructor(@Inject(KYSELY_DB) private readonly db: Kysely<Database>) {}

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}

export const databaseProvider = {
  provide: KYSELY_DB,
  useFactory: (config: AppConfig): Kysely<Database> => {
    return createSqliteDatabase({ databasePath: config.sqliteDatabasePath });
  },
  inject: [APP_CONFIG],
};
```

Create `apps/api/src/database/database.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { databaseProvider, DatabaseLifecycle, KYSELY_DB } from './database.provider.js';

@Module({
  providers: [databaseProvider, DatabaseLifecycle],
  exports: [KYSELY_DB],
})
export class DatabaseModule {}
```

Create `apps/api/src/configure-app.ts`:

```ts
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

export function configureApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}
```

Create `apps/api/src/health/health.service.ts`:

```ts
import { Injectable } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  service: 'rolesta-api';
}

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'rolesta-api',
    };
  }
}
```

Create `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService, type HealthResponse } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['status', 'service'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        service: { type: 'string', enum: ['rolesta-api'] },
      },
    },
  })
  getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
```

Create `apps/api/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
```

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule],
})
export class AppModule {}
```

Create `apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';

async function bootstrap(): Promise<void> {
  const config = loadAppConfig();
  const app = configureApp(await NestFactory.create(AppModule));

  const openApiConfig = new DocumentBuilder()
    .setTitle('Rolesta API')
    .setDescription('Rolesta backend API')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('/docs', app, document);

  await app.listen(config.port, config.host);
}

await bootstrap();
```

- [ ] **Step 5: Run API tests and typecheck**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e
pnpm --filter @rolesta/api typecheck
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit API skeleton**

Run:

```powershell
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): add nest health skeleton"
```

Expected: commit succeeds.

## Task 5: API Auth and Business Module Scaffolding

**Files:**
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/dto/current-user-response.dto.ts`
- Create: `apps/api/src/auth/dto/login-request.dto.ts`
- Create: `apps/api/src/auth/dto/setup-admin-request.dto.ts`
- Create: `apps/api/src/users/users.module.ts`
- Create: `apps/api/src/characters/characters.module.ts`
- Create: `apps/api/src/worldbooks/worldbooks.module.ts`
- Create: `apps/api/src/presets/presets.module.ts`
- Create: `apps/api/src/model-profiles/model-profiles.module.ts`
- Create: `apps/api/src/chats/chats.module.ts`
- Create: `apps/api/src/generation-debug/generation-debug.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write failing auth module smoke test**

Create `apps/api/test/auth.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Auth API skeleton', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns no current user before session support is implemented', async () => {
    await request(app.getHttpServer())
      .get('/auth/current-user')
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({ user: null });
      });
  });
});
```

- [ ] **Step 2: Run failing auth test**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e -- test/auth.e2e-spec.ts
```

Expected: FAIL with 404 for `/auth/current-user`.

- [ ] **Step 3: Implement auth DTOs and service skeleton**

Create `apps/api/src/auth/dto/current-user-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

class CurrentUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['admin', 'user'] })
  role!: 'admin' | 'user';
}

export class CurrentUserResponseDto {
  @ApiProperty({ nullable: true, type: CurrentUserDto })
  user!: CurrentUserDto | null;
}
```

Create `apps/api/src/auth/dto/login-request.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password!: string;
}
```

Create `apps/api/src/auth/dto/setup-admin-request.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SetupAdminRequestDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  displayName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  password!: string;
}
```

Create `apps/api/src/auth/auth.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import type { CurrentUserResponseDto } from './dto/current-user-response.dto.js';

@Injectable()
export class AuthService {
  getCurrentUser(): CurrentUserResponseDto {
    return { user: null };
  }
}
```

- [ ] **Step 4: Implement auth controller and business module shells**

Create `apps/api/src/auth/auth.controller.ts`:

```ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CurrentUserResponseDto } from './dto/current-user-response.dto.js';
import { LoginRequestDto } from './dto/login-request.dto.js';
import { SetupAdminRequestDto } from './dto/setup-admin-request.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('current-user')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  getCurrentUser(): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('login')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  login(@Body() _body: LoginRequestDto): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('setup-admin')
  @ApiOkResponse({ type: CurrentUserResponseDto })
  setupAdmin(@Body() _body: SetupAdminRequestDto): CurrentUserResponseDto {
    return this.authService.getCurrentUser();
  }

  @Post('logout')
  @ApiOkResponse({ schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  logout(): { ok: true } {
    return { ok: true };
  }
}
```

Create `apps/api/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

Create `apps/api/src/users/users.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class UsersModule {}
```

Create `apps/api/src/characters/characters.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class CharactersModule {}
```

Create `apps/api/src/worldbooks/worldbooks.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class WorldbooksModule {}
```

Create `apps/api/src/presets/presets.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class PresetsModule {}
```

Create `apps/api/src/model-profiles/model-profiles.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class ModelProfilesModule {}
```

Create `apps/api/src/chats/chats.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class ChatsModule {}
```

Create `apps/api/src/generation-debug/generation-debug.module.ts`:

```ts
import { Module } from '@nestjs/common';

@Module({})
export class GenerationDebugModule {}
```

Modify `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CharactersModule } from './characters/characters.module.js';
import { ChatsModule } from './chats/chats.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { GenerationDebugModule } from './generation-debug/generation-debug.module.js';
import { HealthModule } from './health/health.module.js';
import { ModelProfilesModule } from './model-profiles/model-profiles.module.js';
import { PresetsModule } from './presets/presets.module.js';
import { UsersModule } from './users/users.module.js';
import { WorldbooksModule } from './worldbooks/worldbooks.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CharactersModule,
    WorldbooksModule,
    PresetsModule,
    ModelProfilesModule,
    ChatsModule,
    GenerationDebugModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Install validation dependencies**

Run:

```powershell
pnpm --filter @rolesta/api add class-validator class-transformer
```

Expected: command exits 0 and updates `pnpm-lock.yaml`.

- [ ] **Step 6: Run API e2e and typecheck**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e
pnpm --filter @rolesta/api typecheck
```

Expected: both commands exit 0.

- [ ] **Step 7: Commit API module scaffolding**

Run:

```powershell
git add apps/api pnpm-lock.yaml
git commit -m "feat(api): add auth and module skeletons"
```

Expected: commit succeeds.

## Task 6: OpenAPI Export Path

**Files:**
- Create: `apps/api/src/openapi/create-openapi-document.ts`
- Create: `apps/api/src/openapi/generate-openapi.ts`
- Create: `apps/api/test/openapi.e2e-spec.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Write failing OpenAPI test**

Create `apps/api/test/openapi.e2e-spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { createOpenApiDocument } from '../src/openapi/create-openapi-document.js';

describe('OpenAPI document', () => {
  it('contains health and auth routes', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = configureApp(moduleRef.createNestApplication());
    await app.init();

    const document = createOpenApiDocument(app);

    expect(document.paths['/health']).toBeDefined();
    expect(document.paths['/auth/current-user']).toBeDefined();

    await app.close();
  });
});
```

- [ ] **Step 2: Run failing OpenAPI test**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e -- test/openapi.e2e-spec.ts
```

Expected: FAIL because `create-openapi-document.ts` does not exist.

- [ ] **Step 3: Implement OpenAPI document helpers**

Create `apps/api/src/openapi/create-openapi-document.ts`:

```ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Rolesta API')
    .setDescription('Rolesta backend API')
    .setVersion('0.1.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}
```

Create `apps/api/src/openapi/generate-openapi.ts`:

```ts
import { promises as fs } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { configureApp } from '../configure-app.js';
import { createOpenApiDocument } from './create-openapi-document.js';

const app = configureApp(await NestFactory.create(AppModule, { logger: false }));
await app.init();

const document = createOpenApiDocument(app);
await fs.writeFile('openapi.json', `${JSON.stringify(document, null, 2)}\n`, 'utf8');

await app.close();
```

Modify `apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import { loadAppConfig } from './config/app-config.js';
import { createOpenApiDocument } from './openapi/create-openapi-document.js';

async function bootstrap(): Promise<void> {
  const config = loadAppConfig();
  const app = configureApp(await NestFactory.create(AppModule));

  SwaggerModule.setup('/docs', app, createOpenApiDocument(app));

  await app.listen(config.port, config.host);
}

await bootstrap();
```

- [ ] **Step 4: Run OpenAPI generation and tests**

Run:

```powershell
pnpm --filter @rolesta/api test:e2e
pnpm --filter @rolesta/api openapi:generate
```

Expected: tests pass and `apps/api/openapi.json` is created.

- [ ] **Step 5: Commit OpenAPI export path**

Run:

```powershell
git add apps/api
git commit -m "feat(api): add openapi export path"
```

Expected: commit succeeds.

## Task 7: React Vite App Foundation

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/components.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/app.tsx`
- Create: `apps/web/src/app/router.tsx`
- Create: `apps/web/src/app/providers.tsx`
- Create: `apps/web/src/styles/globals.css`

- [ ] **Step 1: Create web package manifest**

Create `apps/web/package.json`:

```json
{
  "name": "@rolesta/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "eslint \"src/**/*.{ts,tsx}\"",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "openapi:generate": "openapi-typescript ../api/openapi.json -o src/lib/api/generated/schema.ts"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-slot": "^1.2.3",
    "@rolesta/shared": "workspace:*",
    "@tanstack/react-query": "^5.80.7",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.468.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.58.1",
    "react-router-dom": "^7.6.2",
    "tailwind-merge": "^2.6.0",
    "zod": "^3.25.67"
  },
  "devDependencies": {
    "@playwright/test": "^1.53.0",
    "@rolesta/config": "workspace:*",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "autoprefixer": "^10.4.21",
    "jsdom": "^26.1.0",
    "openapi-typescript": "^7.8.0",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "vite": "^6.3.5"
  }
}
```

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts", "vitest.config.ts"]
}
```

Create `apps/web/tsconfig.node.json`:

```json
{
  "extends": "./tsconfig.json",
  "include": ["vite.config.ts", "vitest.config.ts", "tailwind.config.ts"]
}
```

- [ ] **Step 2: Create Vite, Tailwind, shadcn, and test config**

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rolesta</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/web/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

Create `apps/web/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
```

Create `apps/web/postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

Create `apps/web/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
      },
      borderRadius: {
        md: '6px',
        sm: '4px',
      },
    },
  },
  plugins: [],
};

export default config;
```

Create `apps/web/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: Implement app providers and routing shell**

Create `apps/web/src/styles/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --primary: 173 58% 34%;
  --primary-foreground: 0 0% 100%;
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

Create `apps/web/src/app/providers.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useState } from 'react';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Create `apps/web/src/app/router.tsx`:

```tsx
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const LoginPage = lazy(() =>
  import('../features/auth/routes/login-page').then((module) => ({ default: module.LoginPage })),
);
const SetupPage = lazy(() =>
  import('../features/auth/routes/setup-page').then((module) => ({ default: module.SetupPage })),
);
const WorkbenchPage = lazy(() =>
  import('../features/chats/routes/workbench-page').then((module) => ({
    default: module.WorkbenchPage,
  })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/setup',
    element: <SetupPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: <WorkbenchPage />,
  },
  {
    path: '/app/chats/:chatId',
    element: <WorkbenchPage />,
  },
]);
```

Create `apps/web/src/app/app.tsx`:

```tsx
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';

export function App() {
  return (
    <AppProviders>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}
```

Create `apps/web/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/app';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 4: Run failing web typecheck**

Run:

```powershell
pnpm install
pnpm --filter @rolesta/web typecheck
```

Expected: FAIL because route components do not exist yet.

- [ ] **Step 5: Validate shadcn project context**

Run:

```powershell
pnpm dlx shadcn@latest info --json
```

Expected: command exits 0 and reports `framework` as Vite or React, `base` as radix, and `iconLibrary` as lucide for `apps/web/components.json`.

- [ ] **Step 6: Commit web foundation after route components are added in Task 8**

Do not commit in this task. Task 8 creates the route components needed for typecheck.

## Task 8: Frontend UI Primitives and Workbench Shell

**Files:**
- Create through shadcn CLI: `apps/web/src/components/ui/button.tsx`
- Create through shadcn CLI: `apps/web/src/components/ui/card.tsx`
- Create through shadcn CLI: `apps/web/src/components/ui/field.tsx`
- Create through shadcn CLI: `apps/web/src/components/ui/input.tsx`
- Create through shadcn CLI: `apps/web/src/components/ui/separator.tsx`
- Create through shadcn CLI: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/app/workbench-layout.tsx`
- Create: `apps/web/src/features/auth/routes/login-page.tsx`
- Create: `apps/web/src/features/auth/routes/setup-page.tsx`
- Create: `apps/web/src/features/chats/routes/workbench-page.tsx`

- [ ] **Step 1: Add shadcn UI primitives through the CLI**

Run:

```powershell
pnpm dlx shadcn@latest docs button card field input separator
pnpm dlx shadcn@latest add button card field input separator
```

Expected: the CLI creates `button.tsx`, `card.tsx`, `field.tsx`, `input.tsx`, `separator.tsx`, and `src/lib/utils.ts`. Read the added files and verify imports use `@/lib/utils` and `@/components/ui/...`.

- [ ] **Step 2: Create workbench layout with local state and shadcn composition**

Create `apps/web/src/app/workbench-layout.tsx`:

```tsx
import { PanelRightCloseIcon } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function WorkbenchLayout({ children }: PropsWithChildren) {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="hidden p-3 lg:block">
        <div className="text-sm font-semibold">Rolesta</div>
        <nav className="mt-4 grid gap-1 text-sm text-muted-foreground">
          <span>Chats</span>
          <span>Characters</span>
          <span>Worldbooks</span>
          <span>Presets</span>
        </nav>
      </aside>
      <Separator orientation="vertical" className="hidden lg:block" />
      <section className="min-w-0">{children}</section>
      {rightPanelOpen ? (
        <aside className="hidden p-3 lg:block">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Runtime</div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close runtime panel"
            >
              <PanelRightCloseIcon data-icon="inline-start" />
            </Button>
          </div>
          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Generation context</CardTitle>
              <CardDescription>Debug and model context will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">No generation is running.</CardContent>
          </Card>
        </aside>
      ) : null}
    </main>
  );
}
```

- [ ] **Step 3: Create route components**

Create `apps/web/src/features/auth/routes/login-page.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" />
            </Field>
          </FieldGroup>
          <Button type="button">Sign in</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

Create `apps/web/src/features/auth/routes/setup-page.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export function SetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create admin</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-email">Email</FieldLabel>
              <Input id="admin-email" type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-display-name">Display name</FieldLabel>
              <Input id="admin-display-name" />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-password">Password</FieldLabel>
              <Input id="admin-password" type="password" />
            </Field>
          </FieldGroup>
          <Button type="button">Create account</Button>
        </CardContent>
      </Card>
    </main>
  );
}
```

Create `apps/web/src/features/chats/routes/workbench-page.tsx`:

```tsx
import { SendIcon } from 'lucide-react';
import { WorkbenchLayout } from '@/app/workbench-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

export function WorkbenchPage() {
  return (
    <WorkbenchLayout>
      <div className="flex min-h-screen flex-col">
        <header className="px-4 py-3">
          <h1 className="text-base font-semibold">Chat workbench</h1>
        </header>
        <Separator />
        <div className="flex-1 px-4 py-6 text-sm text-muted-foreground">
          Select a character and start a session.
        </div>
        <Separator />
        <form className="flex gap-2 p-3">
          <Input aria-label="Message" />
          <Button type="button" size="icon" aria-label="Send message">
            <SendIcon data-icon="inline-start" />
          </Button>
        </form>
      </div>
    </WorkbenchLayout>
  );
}
```

- [ ] **Step 4: Run web typecheck and build**

Run:

```powershell
pnpm --filter @rolesta/web typecheck
pnpm --filter @rolesta/web build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit web shell**

Run:

```powershell
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): add react workbench shell"
```

Expected: commit succeeds.

## Task 9: Typed API Client and Auth Hooks

**Files:**
- Create: `apps/web/src/lib/api/generated/schema.ts`
- Create: `apps/web/src/lib/api/openapi-types.ts`
- Create: `apps/web/src/lib/api/client.ts`
- Create: `apps/web/src/features/auth/api/auth-api.ts`
- Create: `apps/web/src/features/auth/hooks/use-current-user.ts`
- Create: `apps/web/src/features/auth/schemas/login-schema.ts`
- Create: `apps/web/src/lib/forms/form-error.ts`

- [ ] **Step 1: Generate OpenAPI schema types**

Run:

```powershell
pnpm --filter @rolesta/api openapi:generate
pnpm --filter @rolesta/web openapi:generate
```

Expected: `apps/web/src/lib/api/generated/schema.ts` exists. Commit the generated schema file so a clean checkout can typecheck without running OpenAPI generation first. Keep `apps/api/openapi.json` ignored because it is an intermediate artifact.

- [ ] **Step 2: Add typed API helper**

Create `apps/web/src/lib/api/openapi-types.ts`:

```ts
import type { paths } from './generated/schema';

export type CurrentUserResponse =
  paths['/auth/current-user']['get']['responses']['200']['content']['application/json'];
```

Create `apps/web/src/lib/api/client.ts`:

```ts
export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiClientError(`API request failed with ${response.status}`, response.status);
  }

  return (await response.json()) as TResponse;
}
```

- [ ] **Step 3: Add auth API and query hook**

Create `apps/web/src/features/auth/api/auth-api.ts`:

```ts
import { apiGet } from '../../../lib/api/client';
import type { CurrentUserResponse } from '../../../lib/api/openapi-types';

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiGet<CurrentUserResponse>('/auth/current-user');
}
```

Create `apps/web/src/features/auth/hooks/use-current-user.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api/auth-api';

export const currentUserQueryKey = ['auth', 'current-user'] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
  });
}
```

Create `apps/web/src/features/auth/schemas/login-schema.ts`:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

Create `apps/web/src/lib/forms/form-error.ts`:

```ts
export function getFormErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'The request failed.';
}
```

- [ ] **Step 4: Run frontend typecheck**

Run:

```powershell
pnpm --filter @rolesta/web typecheck
```

Expected: command exits 0.

- [ ] **Step 5: Commit typed API client**

Run:

```powershell
git add apps/web/src/lib/api apps/web/src/features/auth apps/web/src/lib/forms pnpm-lock.yaml
git commit -m "feat(web): add typed api client foundation"
```

Expected: commit succeeds.

## Task 10: SSE Client Skeleton

**Files:**
- Create: `apps/web/src/lib/api/sse-client.ts`
- Create: `apps/web/src/lib/api/sse-client.test.ts`

- [ ] **Step 1: Write failing SSE parser test**

Create `apps/web/src/lib/api/sse-client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseSseChunk } from './sse-client';

describe('parseSseChunk', () => {
  it('parses event and data lines', () => {
    const events = parseSseChunk('event: token\ndata: {"text":"hi"}\n\n');

    expect(events).toEqual([{ event: 'token', data: '{"text":"hi"}' }]);
  });
});
```

- [ ] **Step 2: Run failing SSE test**

Run:

```powershell
pnpm --filter @rolesta/web test -- src/lib/api/sse-client.test.ts
```

Expected: FAIL because `sse-client.ts` does not exist.

- [ ] **Step 3: Implement SSE parser**

Create `apps/web/src/lib/api/sse-client.ts`:

```ts
export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseChunk(chunk: string): SseEvent[] {
  return chunk
    .split('\n\n')
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const lines = block.split('\n');
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const dataLine = lines.find((line) => line.startsWith('data:'));

      return {
        event: eventLine?.slice('event:'.length).trim() ?? 'message',
        data: dataLine?.slice('data:'.length).trim() ?? '',
      };
    });
}
```

- [ ] **Step 4: Run SSE tests and typecheck**

Run:

```powershell
pnpm --filter @rolesta/web test -- src/lib/api/sse-client.test.ts
pnpm --filter @rolesta/web typecheck
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit SSE client skeleton**

Run:

```powershell
git add apps/web/src/lib/api/sse-client.ts apps/web/src/lib/api/sse-client.test.ts
git commit -m "feat(web): add sse parser foundation"
```

Expected: commit succeeds.

## Task 11: Playwright Smoke Test and CI

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/tests/workbench.spec.ts`
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create Playwright config**

Create `apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter @rolesta/web dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

Create `apps/web/tests/workbench.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('renders the workbench shell', async ({ page }) => {
  await page.goto('/app');

  await expect(page.getByRole('heading', { name: 'Chat workbench' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
});
```

- [ ] **Step 2: Run Playwright smoke test**

Run:

```powershell
pnpm --filter @rolesta/web exec playwright install chromium
pnpm --filter @rolesta/web test:e2e
```

Expected: Playwright starts Vite, opens `/app`, and passes the smoke test.

- [ ] **Step 3: Add CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.15.4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

- [ ] **Step 4: Run full local verification**

Run:

```powershell
pnpm typecheck
pnpm test
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit Playwright and CI**

Run:

```powershell
git add apps/web/playwright.config.ts apps/web/tests .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "ci: add skeleton verification workflow"
```

Expected: commit succeeds.

## Task 12: Documentation and Final Skeleton Verification

**Files:**
- Modify: `README.md`
- Create: `docs/development.md`

- [ ] **Step 1: Update README with skeleton commands**

Modify `README.md` by appending this section:

```md
## Development

Rolesta uses a TypeScript monorepo with a separated API and web app.

### Requirements

- Node.js 22 or newer.
- pnpm 9 or newer.

### Setup

```powershell
pnpm install
Copy-Item .env.example .env
pnpm db:migrate
```

### Run

```powershell
pnpm dev
```

Default local URLs:

- Web: http://127.0.0.1:5173
- API: http://127.0.0.1:3000
- API docs: http://127.0.0.1:3000/docs

### Verify

```powershell
pnpm typecheck
pnpm test
pnpm build
```
```

- [ ] **Step 2: Add development notes**

Create `docs/development.md`:

```md
# Development Notes

## Boundaries

- API controllers handle HTTP concerns only.
- API services handle business rules and orchestration.
- API repositories handle Kysely database access.
- Web route components compose feature components.
- Web feature API files call typed API helpers.
- Web query hooks own TanStack Query usage.
- Web form schemas live outside rendering components.
- UI primitives are reused before adding new local style fragments.

## Database

SQLite is the default database for the first skeleton. Keep queryable data in normal columns and store compatibility snapshots as text JSON. Repository implementations should use portable Kysely queries unless a measured need requires a database-specific override.

## OpenAPI

The API exports `apps/api/openapi.json`. The web app generates TypeScript API types from that document into `apps/web/src/lib/api/generated/schema.ts`.
```

- [ ] **Step 3: Run final verification**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @rolesta/web test:e2e
git status --short
```

Expected: verification commands exit 0. `git status --short` shows only README and docs changes before the final commit.

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git add README.md docs/development.md
git commit -m "docs: add development workflow"
```

Expected: commit succeeds.

## Self-Review Checklist

- Spec coverage: workspace, API app, web app, shared packages, database package, OpenAPI, typed frontend API, SSE parser, module conventions, health endpoint, tests, CI, and docs are covered.
- User constraints: frontend state, API calls, form schemas, and rendering are split across separate files; UI primitives are created once and reused; structural cleanup is explicitly required before blocked feature additions.
- Scope: full product features are excluded from the skeleton and left for later phases.
- Verification: every implementation task includes a command and expected result.
