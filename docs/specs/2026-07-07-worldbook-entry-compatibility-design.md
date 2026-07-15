# Worldbook Entry Compatibility Design

## Context

Rolesta already supports basic worldbook management and SillyTavern world info import/export. The current entry model only stores a narrow set of fields, so several common SillyTavern entry attributes are lost during import, editing, or export. The entry editor also shows a flat, crowded form and includes an enabled toggle that should be controlled from the entry list instead.

This design covers SillyTavern-compatible core field persistence and the related editor cleanup. It does not attempt to implement every SillyTavern worldbook field.

## Goals

- Persist the core SillyTavern entry fields requested for this task.
- Keep domain code semantic by using Rolesta-owned enums instead of SillyTavern magic numbers.
- Convert SillyTavern numeric values only at mapper boundaries.
- Reorganize the entry editor into default-open groups with compact controls.
- Move Content earlier in the edit form.
- Keep enabled state editable from the entry list, not from the entry edit page.

## Non-Goals

- Full SillyTavern worldbook feature parity.
- Runtime prompt assembly behavior changes.
- Character filters, timed effects, groups, automation, vectorization, and trigger fields.

## Domain Model

The worldbook entry domain model will add Rolesta-owned semantic enums.

`WorldbookInsertionPosition` will include:

- `beforeCharacterDefinition`
- `afterCharacterDefinition`
- `beforeAuthorsNote`
- `afterAuthorsNote`
- `atDepth`
- `beforeExampleMessages`
- `afterExampleMessages`
- `atAnchor`
- `unknown`

`WorldbookEntryRole` will include:

- `system`
- `user`
- `assistant`

`WorldbookSelectiveLogic` will include:

- `andAny`
- `notAll`
- `notAny`
- `andAll`

Worldbook entries will add:

- `selectiveLogic`
- `scanDepth`
- `excludeRecursion`
- `preventRecursion`
- `delayUntilRecursion`
- `insertionRole`
- `anchorName`

`scanDepth` is nullable. A null value means the entry inherits the worldbook scan depth.

## SillyTavern Mapping

The SillyTavern mapper is the only place that knows SillyTavern numeric values.

Insertion position mapping:

- ST `0` maps to `beforeCharacterDefinition`.
- ST `1` maps to `afterCharacterDefinition`.
- ST `2` maps to `beforeAuthorsNote`.
- ST `3` maps to `afterAuthorsNote`.
- ST `4` maps to `atDepth`.
- ST `5` maps to `beforeExampleMessages`.
- ST `6` maps to `afterExampleMessages`.
- ST `7` maps to `atAnchor`.

Role mapping:

- ST `0` maps to `system`.
- ST `1` maps to `user`.
- ST `2` maps to `assistant`.

Selective logic mapping:

- ST `0` maps to `andAny`.
- ST `1` maps to `notAll`.
- ST `2` maps to `notAny`.
- ST `3` maps to `andAll`.

Import will read direct SillyTavern fields first for common exported JSON:

- `position`
- `role`
- `selectiveLogic`
- `scanDepth`
- `excludeRecursion`
- `preventRecursion`
- `delayUntilRecursion`
- `outletName`

Import will also read compatible `extensions.*` names when present:

- `extensions.position`
- `extensions.role`
- `extensions.selectiveLogic`
- `extensions.scan_depth`
- `extensions.exclude_recursion`
- `extensions.prevent_recursion`
- `extensions.delay_until_recursion`
- `extensions.outlet_name`

Export will write the SillyTavern direct fields so a Rolesta-edited worldbook preserves the requested core behavior when opened in SillyTavern.

## Persistence And API

A new database migration will add columns to `worldbook_entries`:

- `selective_logic`
- `scan_depth`
- `exclude_recursion`
- `prevent_recursion`
- `delay_until_recursion`
- `insertion_role`
- `anchor_name`

Default values for existing entries:

- `selective_logic`: `andAny`
- `scan_depth`: null
- `exclude_recursion`: false
- `prevent_recursion`: false
- `delay_until_recursion`: false
- `insertion_role`: `system`
- `anchor_name`: empty string

Request and response DTOs will expose the semantic Rolesta enum values. The generated web API schema will be updated after OpenAPI regeneration.

## Entry Editor UI

The entry editor will use simple default-open groups with titles only. The group components will not add summaries or descriptions.

Groups:

- Basic: name and comment.
- Content: Content textarea placed near the top with token count directly below it.
- Matching: primary keys, secondary keys, selective logic, constant, selective, case sensitive, whole word matching.
- Insertion: insertion position, insertion order, depth, depth role, anchor name.
- Scan And Recursion: entry scan depth, exclude recursion, prevent further recursion, delay until recursion.

The enabled toggle will be removed from the edit page. Entry enabled state remains visible and editable in the entry list.

Primary and secondary key textareas will be reduced to compact heights, such as two rows by default. Short numeric and select controls will use responsive grids, with one column on narrow screens.

Depth role is shown only when insertion position is `atDepth`. Anchor name is shown only when insertion position is `atAnchor`.

## Entry List UI

The entry list remains the control surface for enabled state. Rows will show localized insertion position labels instead of raw enum values.

For `atDepth`, the row includes depth and role. For `atAnchor`, the row includes the anchor name.

## Testing

Backend tests will cover:

- Importing the requested fields from `tmp/世界书.json` style SillyTavern entries.
- Exporting semantic Rolesta enums back to SillyTavern numeric fields.
- Creating and updating entries with the new fields.
- Reading and writing the new persistence fields.

Frontend verification will cover:

- Type checking generated API types after OpenAPI regeneration.
- Entry editor rendering and save payload construction for the new fields.
- Entry list display no longer showing raw insertion enum values.

## Implementation Order

1. Add domain enums and entry fields.
2. Add database migration and store mapping.
3. Extend use cases and HTTP DTOs.
4. Update SillyTavern import/export mapper and tests.
5. Regenerate OpenAPI and web schema.
6. Update web form model, editor UI, list row labels, and translations.
7. Run targeted tests, typecheck, and any affected E2E checks.
