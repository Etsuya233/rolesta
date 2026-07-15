# Chat Management Implementation Plan

**Goal:** Deliver private Chat CRUD, filtering, live asset associations, shared request validation, and the left-sidebar management experience defined in `docs/superpowers/specs/2026-07-15-chat-management-design.md`.

**Architecture:** Add a `chats` business module around a private `Chat` domain object and a Kysely store. Keep asset acquisition behind Chat-owned ports and serialize Chat writes with asset deletion or visibility changes through the existing Unit of Work. Chat stores live asset IDs and returns Chat-owned narrow summaries. Request field rules come from shared Zod schemas, while asset access remains an application concern. The Web keeps the active Chat in Workbench memory and leaves Center panel navigation independent.

**Tech Stack:** TypeScript, Zod 4, nestjs-zod, NestJS, Kysely, SQLite, React, React Router, TanStack Query, openapi-fetch, i18next, Tailwind CSS, shadcn/ui, Vitest, Playwright.

**Terminology:** Product copy uses “model connection.” Existing code and database types represent the same owned record as `ModelProviderConfig`, `modelProviderId`, `modelProvider`, and `model_provider_configs`; Chat must keep those established code identifiers.

---

### Task 1: Establish shared Zod request validation

**Files:**

- Modify: `packages/shared/package.json`
- Create: `packages/shared/src/validation.ts`
- Create: `packages/shared/src/validation.test.ts`
- Create: `packages/shared/src/chat-validation.ts`
- Create: `packages/shared/src/chat-validation.test.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/package.json`
- Modify: `pnpm-lock.yaml`
- Create: `apps/api/src/http/request-validation.pipe.ts`
- Create: `apps/api/src/http/request-validation.pipe.spec.ts`
- Modify: `apps/api/src/configure-app.ts`
- Modify: `apps/api/src/openapi/create-openapi-document.ts`
- Modify: `apps/api/test/openapi.e2e-spec.ts`

- [ ] Add Zod 4 to `@rolesta/shared` and add `nestjs-zod` to the API workspace.
- [ ] Define reusable validation issue types and stable project rule codes represented as `{ field, rule }`, without input values or library-generated messages. `field` uses a dot-separated request path, nested array indexes use numeric segments, object-level issues use `$`, and unknown keys produce one issue at their own field path.
- [ ] Define shared schemas for Chat title, create input, non-empty patch input, and list query input. Require and trim create titles, reject blank or over-512-character titles, preserve omitted patch fields, accept `null` only for optional associations, and validate the role filter, sort, direction, zero-based page index, and page size.
- [ ] Replace the placeholder global validation setup with one readable request-validation entry point that selects Zod DTO validation or legacy `class-validator` DTO validation from explicit metadata. A request must use exactly one validation system.
- [ ] Map all Zod issues into one `VALIDATION_FAILED` envelope with the exact shape `data: { issues: Array<{ field, rule }> }`; keep existing modules on their current DTO rules until separately migrated.
- [ ] Apply `nestjs-zod` OpenAPI cleanup and assert that required, nullable, enum, string-length, and non-empty-patch constraints survive document generation.
- [ ] Run `pnpm --filter @rolesta/shared test`, `pnpm --filter @rolesta/shared typecheck`, and focused API validation/OpenAPI tests.

### Task 2: Add Chat persistence

**Files:**

- Create: `packages/db/src/schema/chats.ts`
- Create: `packages/db/src/migrations/0014_chats.ts`
- Modify: `packages/db/src/schema/database.ts`
- Modify: `packages/db/src/migrations/index.ts`
- Modify: `packages/db/src/migrator.test.ts`

- [ ] Define `chats` with a non-null title, nullable references for the four assets, owner and timestamp columns, and no copied asset names or content.
- [ ] Add `ON DELETE CASCADE` for the owner and `ON DELETE SET NULL` for every asset association.
- [ ] Add the owner-plus-sort indexes and owner-plus-chat-character index required by the list query; every sort will append `id` for stable ordering.
- [ ] Register migration `0014_chats` and export the table type through `@rolesta/db`.
- [ ] Test columns, indexes, owner deletion, and asset association cleanup without changing `updated_at_ms`.
- [ ] Run `pnpm --filter @rolesta/db test` and `pnpm --filter @rolesta/db typecheck`.

### Task 3: Build the Chat domain, ports, and Kysely adapters

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

- [ ] Model a Chat whose persisted title is non-empty, whose current dialogue character is required on creation but may later be cleared by the system, and whose Persona, preset, and model connection are optional.
- [ ] Keep role and Persona changes prospective: they change future Chat behavior and do not imply historical message rewrites. Do not add message or generation snapshot fields in this phase.
- [ ] Define owner-scoped create, find, update, delete, list, and association-clear operations without leaking Kysely types into application code.
- [ ] Define asset acquisition capabilities for visible dialogue characters, visible Persona characters, visible presets, and owned model connections. PostgreSQL and MySQL implementations lock acquired rows; SQLite performs acquisition and Chat writes in one transaction.
- [ ] Implement title keyword search, the all/missing/specific role filter, stable sorting, and zero-based pagination using existing SQLite conventions.
- [ ] Implement Chat-owned internal list and detail read models. Persistence returns `avatarResourceId` for character summaries; it does not query file-module persistence or construct HTTP avatar URLs. Task 6 hydrates public avatar objects through the exported file application capability.
- [ ] Test live summary reads after asset edits, missing associations, every filter and sort combination, stable ordering, pagination, and owner isolation.

### Task 4: Implement Chat use cases and stable errors

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

- [ ] Accept the title already parsed and normalized by the shared request-validation boundary. Do not generate a title from the character name in the API or application layer.
- [ ] Run create and update in the existing Unit of Work, acquire every submitted non-null asset, and validate assets in this fixed order: dialogue character, Persona, preset, model connection.
- [ ] Return one stable unavailable-field application error at a time. Missing, deleted, private, and unauthorized assets share the same public semantics and never echo asset IDs.
- [ ] Allow a system-cleared Chat to remain readable and editable. Users may assign a replacement dialogue character but may not explicitly clear that association.
- [ ] Preserve omitted patch fields. Accept valid same-value patches as ordinary updates and update `updatedAtMs`; do not add optimistic locking, version checks, or server-side dirty comparison.
- [ ] Keep `updatedAtMs` unchanged for foreign-key cleanup, visibility-event cleanup, and edits to live referenced assets.
- [ ] Enforce identical 404 behavior for missing and non-owned Chats, and hard-delete an owned Chat.
- [ ] Cover creation, list, detail, patch, deletion, asset access order, unavailable-field errors, missing-character edits, timestamp semantics, ownership, and Unit of Work rollback.

### Task 5: Clear associations on visibility changes

**Files:**

- Create: `apps/api/src/characters/events/character-visibility-changed.event.ts`
- Modify: `apps/api/src/characters/events/index.ts`
- Modify: `apps/api/src/characters/application/update-character.use-case.ts`
- Modify: `apps/api/src/characters/application/delete-character.use-case.ts`
- Modify: `apps/api/src/characters/characters.module.ts`
- Create: `apps/api/src/presets/events/preset-visibility-changed.event.ts`
- Modify: `apps/api/src/presets/events/index.ts`
- Modify: `apps/api/src/presets/application/update-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/delete-preset.use-case.ts`
- Modify: `apps/api/src/presets/presets.module.ts`
- Modify: `apps/api/src/model-profiles/application/delete-model-provider.use-case.ts`
- Create: `apps/api/src/chats/application/asset-visibility-events.listener.ts`
- Create: `apps/api/src/chats/application/asset-visibility-events.integration.spec.ts`

- [ ] Publish a past-tense event only when a public character card or preset becomes private.
- [ ] Put each visibility update, event publication, and Chat cleanup in the same Unit of Work. A listener failure must roll back the asset update.
- [ ] Clear references only from Chats owned by users other than the asset owner and preserve the Chat timestamp.
- [ ] Serialize visibility changes, deletions, and Chat association writes through the acquired asset row so a committed non-null association is accessible at commit time.
- [ ] Verify character, preset, and model-connection deletion use cases keep their read/delete/event sequence inside the Unit of Work so their database row lock serializes with Chat asset acquisition; modify only paths that do not already satisfy this rule.
- [ ] Test that a character visibility event clears other users' dialogue-character and Persona references while retaining both references for the asset owner, and that a preset visibility event clears only other users' preset references. Also cover rollback and create/update races.

### Task 6: Expose and generate the Chat HTTP contract

**Files:**

- Create: `apps/api/src/chats/http/chat-requests.dto.ts`
- Create: `apps/api/src/chats/http/chat-responses.dto.ts`
- Create: `apps/api/src/chats/http/chat-application-error.mapper.ts`
- Create: `apps/api/src/chats/http/chats.controller.ts`
- Modify existing stub: `apps/api/src/chats/chats.module.ts`
- Reuse existing root import: `apps/api/src/app.module.ts`
- Reuse: `apps/api/src/files/files.module.ts`
- Reuse: `apps/api/src/files/application/get-public-file-objects.use-case.ts`
- Create: `apps/api/test/chats.e2e-spec.ts`
- Modify: `apps/api/test/openapi.e2e-spec.ts`
- Generate: `apps/api/openapi.json`
- Generate: `apps/web/src/lib/api/generated/schema.ts`

- [ ] Build Chat request DTOs from the shared Zod schemas; do not duplicate their rules with `class-validator` decorators.
- [ ] Implement authenticated `POST /chats`, `GET /chats`, `GET /chats/:id`, `PATCH /chats/:id`, and `DELETE /chats/:id` endpoints.
- [ ] Return the list through the normal success envelope with `data: { items, pageIndex, pageSize, totalItems, totalPages }`. Each item is exactly `{ id, title, updatedAtMs, chatCharacter }`, where `chatCharacter` is `{ id, name, avatar } | null` and `avatar` is `{ resourceId, sources: Record<string, string> } | null`.
- [ ] Return detail through the normal success envelope with `id`, `title`, nullable `chatCharacterId`, `personaCharacterId`, `presetId`, and `modelProviderId`, plus `createdAtMs`, `updatedAtMs`, `chatCharacter: { id, name, avatar } | null`, `persona: { id, name, avatar } | null`, `preset: { id, name } | null`, and `modelProvider: { id, name, providerKind, defaultModelName } | null`. Character `avatar` uses the same nullable shape as the list; `defaultModelName` is a non-null string.
- [ ] Hydrate `avatar` through the existing exported `GetPublicFileObjectsUseCase` from `FilesModule`. Do not query file persistence from Chat or reuse the wide asset-management response DTOs.
- [ ] Map validation issues, one-at-a-time asset field errors, identical owner-safe 404s, and successful `{ ok: true }` deletion through the shared API envelope.
- [ ] Cover authentication, request transformation, unknown-field rejection, create/patch validation, filters, responses, ownership, errors, and deletion with e2e tests.
- [ ] Assert the complete Chat contract in OpenAPI, then run `pnpm openapi:generate` and inspect both generated files without manual edits.

### Task 7: Add typed Web data access and form state

**Files:**

- Create: `apps/web/src/features/chats/api/chats-api.ts`
- Create: `apps/web/src/features/chats/api/chats-api.test.ts`
- Create: `apps/web/src/features/chats/hooks/use-chats.ts`
- Create: `apps/web/src/features/chats/model/chat-form.ts`
- Create: `apps/web/src/features/chats/model/chat-form.test.ts`
- Modify: `apps/web/src/features/characters/api/characters-api.ts`
- Modify: `apps/web/src/features/presets/api/presets-api.ts`
- Modify: `apps/web/src/features/model-providers/api/model-providers-api.ts`
- Reuse: `apps/web/src/features/chat-preferences/hooks/use-asset-defaults.ts`

- [ ] Consume generated Chat request and response types for HTTP calls, and use the shared Zod schemas for form validation and normalization.
- [ ] Define list/detail query keys, create/update/delete mutations, and exact cache updates or invalidation. Editing a non-active Chat must not change the active selection.
- [ ] Model title source state during create: selected character names populate the visible title field and follow character changes until the user first edits the title; later character changes do not overwrite it. Edit initializes the saved title as user-controlled and never changes it automatically when the dialogue character changes.
- [ ] Model non-blocking default-asset loading for create only. On failure, open the form with optional fields empty, show retry, retain user input, and fill only fields whose source remains `unset`. Edit starts exclusively from the Chat's saved associations and does not apply user defaults.
- [ ] Model connection source priority during create as `manual > owned-preset > user-default > unset`. A late default response may fill only `unset` state and cannot overwrite a connection already derived from a user-selected preset. An owned default or newly selected preset association may replace `user-default` or `unset`; a manual selection or clear locks the field. Public, unlinked, and cleared presets preserve the current connection.
- [ ] Model connection source state during edit: an existing non-null connection starts locked; an existing null connection may follow a newly selected owned preset association until the user manually selects or clears the connection. Public, unlinked, and cleared presets preserve the current connection.
- [ ] Resolve the current owned preset association and pin its connection at the top of model candidates. Public presets never expose or apply the author's connection.
- [ ] Compute edit dirty state from normalized title and four association IDs so the Web can disable save when nothing changed.
- [ ] Preserve form values on Zod issues and application field errors, mapping `{ field, rule }` and asset field names to localized messages.

### Task 8: Build Chat management UI and decouple Workbench selection

**Files:**

- Create: `apps/web/src/features/chats/components/chat-sidebar.tsx`
- Create: `apps/web/src/features/chats/components/chat-list-tab.tsx`
- Create: `apps/web/src/features/chats/components/chat-list-item.tsx`
- Create: `apps/web/src/features/chats/components/current-chat-tab.tsx`
- Create: `apps/web/src/features/chats/components/chat-form-dialog.tsx`
- Create: `apps/web/src/features/chats/components/chat-delete-dialog.tsx`
- Add focused component tests beside affected components.
- Modify: `apps/web/src/app/router.tsx`
- Modify: `apps/web/src/features/chats/routes/workbench-page.tsx`
- Modify: `apps/web/src/features/workspace/components/workspace-left-context-panel.tsx`
- Modify: `apps/web/src/features/workspace/model/workspace-panels.tsx`
- Modify: `apps/web/src/features/workspace/components/workspace-shell.tsx`
- Modify: `apps/web/src/lib/i18n/resources.ts`
- Modify: `apps/web/tests/api-mocks.ts`
- Modify: `apps/web/tests/workbench.spec.ts`

- [ ] Implement the list/current tabs, title search, unified role filter, sort, zero-based pagination, current-row highlight, row menus, and 224-448px responsive sidebar layout.
- [ ] Keep `activeChatId` only in `WorkspaceShell` memory. Remove `/app/chats/:chatId`, remove route-param plumbing, do not add a query parameter or local persistence, and reset selection after refresh.
- [ ] Treat active Chat selection and Center layout as independent state. Selecting, switching, clearing, or deleting a Chat must not replace the current Center panel or close the testing panel.
- [ ] On explicit row selection or successful creation, set the active Chat and switch the sidebar to Current. On mobile, close the left drawer after selection. Editing never changes selection or the active tab.
- [ ] Implement create/edit searchable selectors with own-plus-public scopes for dialogue character, Persona, and preset, and an owned-only scope for model connection. Include create-only title auto-fill, default loading, model lock behavior, candidate pinning, dirty-state save disabling, and duplicate-submit disabling.
- [ ] Implement minimal current Chat details, missing-character status, row actions, and hard-delete confirmation. Deleting the active Chat clears `activeChatId` and switches the sidebar to List; deleting a non-active Chat preserves the active Chat and current tab.
- [ ] On detail 404, clear the active Chat and return the sidebar to List. On network or non-404 failures, keep the selection and show retry in Current.
- [ ] Keep the existing Center homepage and panel registry. Do not add a Chat name/ID placeholder or a message-interface `FIXME` in Center.
- [ ] Add English, Simplified Chinese, Traditional Chinese, and Japanese strings for labels, validation rules, asset errors, loading, retry, missing-character, confirmation, and empty states.

### Task 9: Verify the completed workflow

**Files:**

- Verify all files above.

- [ ] Run focused shared, DB, API, Web, transaction, event, and OpenAPI tests during implementation.
- [ ] Run `pnpm --filter @rolesta/shared typecheck`, `pnpm --filter @rolesta/db typecheck`, `pnpm --filter @rolesta/api typecheck`, and `pnpm --filter @rolesta/web typecheck`.
- [ ] Run lint for every affected workspace and confirm generated OpenAPI files contain no manual edits.
- [ ] Start the local development server on available ports.
- [ ] Use the in-app browser to test create, title auto-fill, default-load failure and retry, model precedence, filter, pagination, select, non-switching edit, temporary detail failure, asset cleanup display, current/non-current delete, refresh reset, and Center independence.
- [ ] Capture desktop and mobile screenshots and inspect overflow, overlap, truncation, dialog sizing, drawer closing, and 224-448px sidebar behavior.
- [ ] Run `git diff --check`, inspect final `git status --short`, and compare delivered behavior against the Spec, `CONTEXT.md`, and ADR 0002.
