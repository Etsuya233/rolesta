# Worldbook Entry Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Persist and edit SillyTavern-compatible core worldbook entry fields using Rolesta-owned semantic enums.

**Architecture:** Domain enums stay in `apps/api/src/worldbooks/domain/worldbook.ts`; use cases and DTOs expose semantic values; Kysely and OpenAPI adapters map those values at boundaries. SillyTavern numeric values remain confined to `silly-tavern-world-info.mapper.ts`.

**Tech Stack:** TypeScript, NestJS, Kysely, SQLite-compatible migrations, React, OpenAPI-generated web schema.

---

### Task 1: Backend Domain And Persistence

**Files:**

- Modify: `apps/api/src/worldbooks/domain/worldbook.ts`
- Modify: `apps/api/src/worldbooks/application/worldbook-entry-editable-fields.ts`
- Modify: `apps/api/src/worldbooks/application/create-worldbook-entry.use-case.ts`
- Modify: `packages/db/src/schema/worldbooks.ts`
- Create: `packages/db/src/migrations/0007_worldbook_entry_compatibility.ts`
- Modify: `apps/api/src/worldbooks/infrastructure/kysely-worldbook-store.ts`

- [x] Add semantic insertion position, entry role, and selective logic enums.
- [x] Add entry fields for role, selective logic, scan depth, recursion flags, and anchor name.
- [x] Add migration columns with defaults for existing rows.
- [x] Map new columns to and from the aggregate.

### Task 2: API DTOs And Use Cases

**Files:**

- Modify: `apps/api/src/worldbooks/http/worldbook-requests.dto.ts`
- Modify: `apps/api/src/worldbooks/http/worldbook-responses.dto.ts`
- Modify: `apps/api/src/worldbooks/application/worldbook-use-cases.spec.ts`

- [x] Expose semantic enums and new fields in create/update requests.
- [x] Return new fields from worldbook entry responses.
- [x] Cover create/update persistence behavior in existing use-case tests.

### Task 3: SillyTavern Import And Export

**Files:**

- Modify: `apps/api/src/worldbooks/infrastructure/silly-tavern-world-info.mapper.ts`
- Modify: `apps/api/src/worldbooks/infrastructure/silly-tavern-world-info.mapper.spec.ts`

- [x] Import requested direct fields and compatible `extensions.*` fields.
- [x] Export requested fields as SillyTavern numeric/direct names.
- [x] Cover numeric mapping for insertion position, role, and selective logic.

### Task 4: Generated Web Schema

**Files:**

- Modify: `apps/web/src/lib/api/generated/schema.ts`
- Modify: `apps/web/src/features/worldbooks/api/worldbooks-api.ts`

- [x] Regenerate OpenAPI web schema from the API after DTO changes.
- [x] Add convenience web API types for new enum fields.

### Task 5: Web Form And Editor UI

**Files:**

- Modify: `apps/web/src/features/worldbooks/model/worldbook-editor-form.ts`
- Modify: `apps/web/src/features/worldbooks/components/worldbook-entry-editor.tsx`
- Modify: `apps/web/src/features/worldbooks/components/worldbook-entry-list-page.tsx`
- Modify: `apps/web/src/lib/i18n/resources.ts`

- [x] Add new fields to the form state and payload builder.
- [x] Remove enabled toggle from the entry edit page.
- [x] Move Content near the top and group controls into default-open sections.
- [x] Add compact primary/secondary key textareas and responsive control grids.
- [x] Localize insertion, role, and selective logic labels for all locales.

### Task 6: Verification

**Commands:**

- `pnpm --filter @rolesta/api test -- worldbooks`
- `pnpm --filter @rolesta/web test -- worldbooks`
- `pnpm typecheck`

- [x] Run targeted backend tests.
- [x] Run affected frontend tests if present.
- [x] Run typecheck for API and web integration.

