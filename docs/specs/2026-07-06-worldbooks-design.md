# Worldbooks Design

## Scope

Build Worldbook as a first-class Rolesta asset for creation, editing, listing, searching, sorting, importing, exporting, and entry management.

This iteration does not integrate Worldbook activation into chats, generation-debug, prompt assembly, or runtime generation. It also does not expose an activation preview API or UI. The chat-facing trigger and prompt insertion behavior belongs to a later chat/generation iteration.

Implementation work must happen on a new development branch. The selected branch for this work is `codex/worldbooks`.

## Existing Patterns

Worldbook should follow the existing character card, preset, and model provider implementation style:

- Database schema and migrations live in `packages/db`.
- API code is split into `domain`, `application`, `infrastructure`, and `http`.
- Controllers use `AuthGuard`, Swagger DTOs, `ApiEnvelopeOkResponse`, and feature-specific application error mappers.
- Frontend feature code lives under `apps/web/src/features/<feature>`.
- Asset pages use `KeepAliveStackViewport` plus draft session providers so list and editor state survive page-stack navigation.
- Frontend API wrappers use generated OpenAPI schema types.

## Database

Add `packages/db/src/migrations/0006_worldbooks.ts`, `packages/db/src/schema/worldbooks.ts`, and update `schema/database.ts` and `migrations/index.ts`.

Create `worldbooks`:

- `id`
- `owner_user_id`
- `visibility`
- `name`
- `description`
- `tags_json`
- `scan_depth`
- `token_budget`
- `recursive_scan`
- `source_format`
- `source_snapshot_json`
- `created_at_ms`
- `updated_at_ms`
- `last_used_at_ms`
- `usage_count`

Create `worldbook_entries`:

- `id`
- `worldbook_id`
- `enabled`
- `name`
- `comment`
- `content`
- `primary_keys_json`
- `secondary_keys_json`
- `selective`
- `constant`
- `case_sensitive`
- `match_whole_words`
- `insertion_position`
- `insertion_order`
- `depth`
- `probability`
- `token_count`
- `created_at_ms`
- `updated_at_ms`

Do not add `metadata_json` to `worldbook_entries`. Original imported SillyTavern fields that Rolesta does not model are preserved only in `worldbooks.source_snapshot_json`.

Use text JSON columns as in the existing preset and character schemas. Add indexes for owner/list queries, visibility, updated time, name, usage count, and entry ordering.

## Backend Architecture

Add `apps/api/src/worldbooks` with the same layer structure as presets and characters.

Domain:

- `Worldbook`, `WorldbookSummary`, and `WorldbookEntry`.
- `WorldbookVisibility` as `private | public`.
- `WorldbookSourceFormat` as `sillytavern_world_info | rolesta`.
- `WorldbookInsertionPosition` using the supported editable positions.
- Summary/stat helpers for entry count, enabled entry count, and total token count.

Application:

- `listWorldbooks`
- `getWorldbook`
- `createWorldbook`
- `updateWorldbook`
- `deleteWorldbook`
- `importWorldbook`
- `exportWorldbook`
- `createWorldbookEntry`
- `updateWorldbookEntry`
- `deleteWorldbookEntry`
- `updateWorldbookEntryOrder`

Store:

- `list` returns worldbooks owned by the viewer or marked public.
- `findVisibleById` allows owner and public reads.
- `findOwnedById` is used for every write operation.
- `save`, `update`, and `deleteOwned` persist aggregates transactionally.

Permissions:

- List can show the viewer's own worldbooks and public worldbooks.
- Get can read owned or public worldbooks.
- Create always uses the authenticated user as owner.
- Update, delete, entry create/update/delete, entry order/enabled updates, and export require owner access.

Errors:

- `not-found` maps to HTTP 404.
- `forbidden` maps to HTTP 403.
- `invalid-import-file`, `invalid-worldbook`, `unknown-entry`, and duplicate/order validation errors map to HTTP 400 validation failures.

## HTTP API

Expose:

- `GET /worldbooks`
- `GET /worldbooks/:id`
- `POST /worldbooks`
- `PATCH /worldbooks/:id`
- `DELETE /worldbooks/:id`
- `POST /worldbooks/import`
- `GET /worldbooks/:id/export/sillytavern`
- `POST /worldbooks/:id/entries`
- `PATCH /worldbooks/:id/entries/:entryId`
- `DELETE /worldbooks/:id/entries/:entryId`
- `PUT /worldbooks/:id/entries/order`

Normal JSON responses use the API envelope. The export endpoint returns raw JSON for file download compatibility, following the preset export pattern.

After backend DTOs are complete, run OpenAPI generation and update `apps/web/src/lib/api/generated/schema.ts`.

## SillyTavern Import And Export

Import supports common SillyTavern World Info JSON with `entries` as either an object dictionary or an array. The importer reads UTF-8 JSON and requires a top-level object with valid entry objects.

Field mapping:

- `key` or `keys` maps to `primaryKeys`.
- `keysecondary` or `secondaryKeys` maps to `secondaryKeys`.
- `disable` maps to `enabled` by inversion.
- `comment`, `content`, `constant`, `selective`, `caseSensitive`, `matchWholeWords`, `position`, `order`, `depth`, `probability`, and `scanDepth` map to first-class Rolesta fields when present.
- Unsupported SillyTavern fields are not copied into entries.

The main worldbook name is taken from imported `name` when present, then from the uploaded file name without extension, then from `Untitled worldbook`. `sourceFormat` is `sillytavern_world_info`, and `sourceSnapshot` stores the original JSON object exactly as parsed.

Invalid JSON, a missing `entries` field, malformed entries, or invalid field types throw `WorldbookApplicationError`; the importer must not silently skip malformed required structure.

Export produces a SillyTavern-compatible World Info JSON object from Rolesta's current structured fields. Entries are emitted as an object dictionary ordered by the current entry order. Export does not merge unsupported fields back from `sourceSnapshot`, so it preserves core compatibility but does not promise byte-for-byte or full-field round-tripping of advanced SillyTavern options.

## Frontend Architecture

Add route `/app/worldbooks` in `apps/web/src/app/router.tsx` with a lazy page component.

Add `apps/web/src/features/worldbooks` with:

- `api/worldbooks-api.ts`
- `model/worldbook-editor-form.ts`
- `hooks/use-worldbook-draft-sessions.tsx`
- `routes/worldbooks-page.tsx`
- components for manager, stack page, page renderer, list page, import page, create page, edit page, main editor, entry list page, entry create page, entry edit page, list item, entry row, and form fields.

Use `KeepAliveStackViewport` and draft sessions like presets:

- The list page keeps search, sorting, paging, and scroll state when navigating to edit or import and back.
- The main editor keeps unsaved form state, Accordion expansion state, and scroll position when navigating to entry management and back.
- Draft sessions are retained only while their create/edit/entry pages remain in the stack. Unsaved drafts are cleaned when those pages leave the stack.

## Frontend UI

The main editor has Accordion sections:

- Basic information: name, description, tags, visibility.
- Matching settings: scan depth, token budget, recursive scan.

The edit page also shows metrics:

- Entry count.
- Enabled entry count.
- Total token count.

The edit page actions include:

- Entry management.
- Export SillyTavern World Info JSON.
- Delete worldbook.

The create page only shows save-oriented actions.

Entry management includes:

- Searchable entry list.
- Enabled switches.
- Drag ordering.
- Edit and delete actions.

Entry editing includes:

- Name.
- Enabled.
- Constant.
- Selective.
- Primary keywords.
- Secondary keywords.
- Content.
- Insertion position.
- Insertion order.
- Depth.
- Probability.
- Case-sensitive matching.
- Whole-word matching.
- Comment.

Keyword editing can use multiline or comma-separated text in the form and converts to arrays before saving. The content editor should follow the preset entry editor density and show token count.

The visual style follows presets and model providers: compact asset-management layout, lucide-react icons for icon actions, existing card radius/density, and stable button sizing to avoid layout jumps.

## Internationalization

Update `apps/web/src/lib/i18n/resources.ts` for:

- `en-US`
- `zh-CN`
- `zh-TW`
- `ja-JP`

Update translation coverage so `worldbooks` keys are checked across locales alongside assets, characters, presets, and model providers.

## Testing And Verification

Backend tests:

- SillyTavern mapper supports object entries and array entries.
- Invalid JSON or malformed structure raises application errors.
- Import maps core editable fields correctly and does not persist unsupported fields in `worldbook_entries`.
- Export produces compatible core World Info JSON from structured fields.
- Use cases enforce owner/public read rules and owner-only writes.
- Entry create/update/delete/order/enabled changes persist and recalculate token counts.
- Store tests cover list search, sorting, public visibility, aggregate save, and delete.

Frontend tests:

- Translation coverage includes `worldbooks`.
- API wrappers compile against generated schema types.
- Component behavior tests may be added where existing project patterns make them useful, especially for draft session retention and form conversion.

Verification commands:

- Generate OpenAPI after backend DTOs are in place.
- Run the targeted backend tests for worldbooks.
- Run i18n translation coverage.
- Run TypeScript typecheck.
- Run broader lint/test/build commands when implementation risk or changed surface warrants it.

## Out Of Scope

- Activation preview API and UI.
- Chat integration.
- Prompt insertion behavior.
- Generation-debug integration.
- Full SillyTavern advanced-field round-tripping.
- Storing unsupported SillyTavern entry fields in `metadata_json`.
