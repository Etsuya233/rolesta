# Chat Management Implementation Plan

**Goal:** Deliver private Chat CRUD, filtering, asset association lifecycle, and the left-sidebar management experience defined in `docs/superpowers/specs/2026-07-15-chat-management-design.md`.

**Architecture:** Add a complete `chats` business module around a `Chat` domain object and a Kysely store. Keep asset access behind Chat-owned ports, clear invalid references through foreign keys and synchronous visibility events, expose typed HTTP contracts, then consume generated OpenAPI types from a Chat Web feature integrated into the existing workspace shell.

**Tech Stack:** TypeScript, NestJS, Kysely, SQLite, React, React Router, TanStack Query, openapi-fetch, i18next, Tailwind CSS, shadcn/ui, Vitest, Playwright.

---

### Task 1: Add Chat persistence

**Files:**
- Create: `packages/db/src/schema/chats.ts`
- Create: `packages/db/src/migrations/0014_chats.ts`
- Modify: `packages/db/src/schema/database.ts`
- Modify: `packages/db/src/migrations/index.ts`
- Modify: `packages/db/src/migrator.test.ts`

- [ ] Define the `chats` schema with owner, title, four nullable asset references, timestamps, and list indexes.
- [ ] Register migration `0014_chats` and export the table type through `@rolesta/db`.
- [ ] Test table columns, indexes, cascade owner deletion, and `SET NULL` asset deletion.
- [ ] Run `pnpm --filter @rolesta/db test` and `pnpm --filter @rolesta/db typecheck`.

### Task 2: Build the Chat domain, ports, and persistence

**Files:**
- Create: `apps/api/src/chats/domain/chat.ts`
- Create: `apps/api/src/chats/domain/chat.spec.ts`
- Create: `apps/api/src/chats/ports/chat-store.ts`
- Create: `apps/api/src/chats/ports/chat-asset-access.ts`
- Create: `apps/api/src/chats/ports/chat-port-error.ts`
- Create: `apps/api/src/chats/persistence/chat-row-mapper.ts`
- Create: `apps/api/src/chats/persistence/kysely-chat-store.ts`
- Create: `apps/api/src/chats/persistence/kysely-chat-store.spec.ts`
- Create: `apps/api/src/chats/persistence/kysely-chat-asset-access.ts`

- [ ] Model creation, title defaulting, 512-character validation, editable associations, and system-cleared associations.
- [ ] Define owner-scoped store operations and list filters without leaking Kysely types into application code.
- [ ] Implement joined asset summaries for list and detail responses.
- [ ] Test keyword, role state, stable sorting, pagination, ownership, and current asset summaries.

### Task 3: Implement Chat use cases and errors

**Files:**
- Create: `apps/api/src/chats/application/chat-application-error.ts`
- Create: `apps/api/src/chats/application/chat-error.mapper.ts`
- Create: `apps/api/src/chats/application/chat-application-services.ts`
- Create: `apps/api/src/chats/application/create-chat.use-case.ts`
- Create: `apps/api/src/chats/application/list-chats.use-case.ts`
- Create: `apps/api/src/chats/application/get-chat.use-case.ts`
- Create: `apps/api/src/chats/application/update-chat.use-case.ts`
- Create: `apps/api/src/chats/application/delete-chat.use-case.ts`
- Create: `apps/api/src/chats/application/chat-use-cases.spec.ts`

- [ ] Validate visible dialogue characters, owned Personas, visible presets, and owned model connections.
- [ ] Apply the role-name title default on creation and reject empty edited titles.
- [ ] Enforce owner-only reads and writes without revealing another user's Chat.
- [ ] Use the shared clock, ID generator, pagination helpers, and Unit of Work patterns.
- [ ] Cover success, permission, missing asset, validation, and deletion behavior with unit tests.

### Task 4: Clear associations on visibility changes

**Files:**
- Create: `apps/api/src/characters/events/character-visibility-changed.event.ts`
- Modify: `apps/api/src/characters/events/index.ts`
- Modify: `apps/api/src/characters/application/update-character.use-case.ts`
- Modify: `apps/api/src/characters/characters.module.ts`
- Create: `apps/api/src/presets/events/preset-visibility-changed.event.ts`
- Modify: `apps/api/src/presets/events/index.ts`
- Modify: `apps/api/src/presets/application/update-preset.use-case.ts`
- Modify: `apps/api/src/presets/presets.module.ts`
- Create: `apps/api/src/chats/application/asset-visibility-events.listener.ts`
- Create: `apps/api/src/chats/application/asset-visibility-events.integration.spec.ts`

- [ ] Publish an event only when a public asset becomes private.
- [ ] Wrap each asset update and event publication in the existing Unit of Work.
- [ ] Clear references only in Chats owned by users other than the asset owner.
- [ ] Test transactional cleanup for dialogue characters and presets while retaining owner associations.

### Task 5: Expose and generate the Chat HTTP contract

**Files:**
- Create: `apps/api/src/chats/http/chat-requests.dto.ts`
- Create: `apps/api/src/chats/http/chat-responses.dto.ts`
- Create: `apps/api/src/chats/http/chat-application-error.mapper.ts`
- Create: `apps/api/src/chats/http/chats.controller.ts`
- Modify: `apps/api/src/chats/chats.module.ts`
- Modify: `apps/api/test/*` as required for Chat e2e coverage
- Generate: `apps/api/openapi.json`
- Generate: `apps/web/src/lib/api/generated/schema.ts`

- [ ] Implement authenticated CRUD and paginated list endpoints.
- [ ] Validate the unified role filter, sort keys, directions, page inputs, and request bodies.
- [ ] Project list and detail DTOs without private asset contents or credentials.
- [ ] Map stable Chat errors to the shared API envelope.
- [ ] Run focused API tests, then `pnpm openapi:generate`.

### Task 6: Add typed Web data access and form models

**Files:**
- Create: `apps/web/src/features/chats/api/chats-api.ts`
- Create: `apps/web/src/features/chats/api/chats-api.test.ts`
- Create: `apps/web/src/features/chats/hooks/use-chats.ts`
- Create: `apps/web/src/features/chats/model/chat-form.ts`
- Create: `apps/web/src/features/chats/model/chat-form.test.ts`
- Modify: asset API modules only where a searchable selector needs an existing typed query.

- [ ] Consume only generated Chat request and response types.
- [ ] Define query keys, list/detail queries, mutations, and exact cache invalidation.
- [ ] Model create defaults and preset-linked model connection precedence as pure transformations.
- [ ] Preserve form state on API field errors.

### Task 7: Build Chat management UI and workspace integration

**Files:**
- Create: `apps/web/src/features/chats/components/chat-sidebar.tsx`
- Create: `apps/web/src/features/chats/components/chat-list-tab.tsx`
- Create: `apps/web/src/features/chats/components/chat-list-item.tsx`
- Create: `apps/web/src/features/chats/components/current-chat-tab.tsx`
- Create: `apps/web/src/features/chats/components/chat-form-dialog.tsx`
- Create: `apps/web/src/features/chats/components/chat-delete-dialog.tsx`
- Create: `apps/web/src/features/chats/components/chat-placeholder.tsx`
- Add focused component tests beside the affected components.
- Modify: `apps/web/src/features/workspace/components/workspace-left-context-panel.tsx`
- Modify: `apps/web/src/features/workspace/components/recent-workspace-panel.tsx`
- Modify: `apps/web/src/features/workspace/model/workspace-panels.tsx`
- Modify: `apps/web/src/features/workspace/components/workspace-shell.tsx`
- Modify: `apps/web/src/features/chats/routes/workbench-page.tsx`
- Modify: `apps/web/src/lib/i18n/resources.ts`

- [ ] Implement list/search/role filter/sort/pagination in the 224–448px sidebar.
- [ ] Implement route-driven automatic Tab selection and mobile drawer closing after selection.
- [ ] Implement create/edit selectors with the approved visibility scopes and defaults.
- [ ] Implement current Chat details, row actions, delete confirmation, and 404 navigation.
- [ ] Show Chat name and ID in the central placeholder and add the approved `FIXME` comment.
- [ ] Add English, Simplified Chinese, Traditional Chinese, and Japanese strings.

### Task 8: Verify the completed workflow

**Files:**
- Verify all files above.

- [ ] Run focused DB, API, and Web tests during implementation.
- [ ] Run `pnpm --filter @rolesta/api typecheck`, `pnpm --filter @rolesta/web typecheck`, and affected lint commands.
- [ ] Confirm generated OpenAPI files have no manual edits.
- [ ] Start the local development server on available ports.
- [ ] Use the in-app browser to test create, filter, pagination, select, edit, asset cleanup display, delete, and navigation.
- [ ] Capture desktop and mobile screenshots and inspect overflow, overlap, truncation, and dialog sizing.
- [ ] Run `git diff --check` and inspect final `git status --short`.
