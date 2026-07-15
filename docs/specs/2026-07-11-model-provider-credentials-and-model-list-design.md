# Model Provider Credentials and Model List Design

**Date:** 2026-07-11
**Status:** Approved for implementation planning

## Goal

Improve the Model Provider create and edit experience by simplifying the form structure, supporting either a provider-owned manual secret or a reusable user-level API key, and replacing the explicit model-fetch action with a lazily loaded available-model list.

## Scope

This change covers:

- Merging the existing Basic Info and Provider and Base URL editor sections.
- Adding a credential field that supports manual secrets and user-level API keys.
- Moving API keys from Model Provider ownership to user ownership.
- Migrating existing provider API keys into the user-level key vault.
- Adding a lazily loaded Available Models section beside Default Model.
- Updating API, persistence, frontend state, translations, and tests for the new contracts.

This change does not add key sharing between users, provider-specific key restrictions, server-side model pagination, or compatibility endpoints for the old provider-scoped API key API.

## Chosen Approach

Model Provider credentials use an explicit mode:

- `manual`: the Provider stores and uses its own secret.
- `vault`: the Provider references a user-owned global API key.

The explicit mode is persisted instead of being inferred from nullable fields. This keeps validation and transitions deterministic and makes the active credential source visible throughout the domain, API, and UI layers.

## Domain Model

### User-Level API Key

API keys become independent user assets with these fields:

- `id`
- `ownerUserId`
- `name`
- `secret`
- `createdAtMs`
- `updatedAtMs`

A key may be referenced by multiple Model Providers owned by the same user. Keys are not tied to a Provider kind, base URL, or individual Model Provider.

### Model Provider Credential

Each Model Provider stores:

- `credentialMode: "manual" | "vault"`
- `secret: string`
- `apiKeyId: string | null`

The invariant is:

- In `manual` mode, `apiKeyId` is `null`. The manual secret may be empty because some compatible endpoints do not require authentication.
- In `vault` mode, `apiKeyId` references a key owned by the same user and the Provider `secret` is empty.

Create and update operations clear the inactive credential field as part of applying the selected mode. The backend validates vault-key ownership before saving.

## Persistence and Migration

Add a user-level API key table and add credential mode, manual secret, and global API key reference columns to the Model Provider table.

The migration converts every existing provider-scoped key into a user-level key owned by the same user as its current Provider:

- Existing selected keys remain referenced by their original Provider in `vault` mode.
- Providers without a selected key become `manual` with an empty manual secret.
- Existing unselected keys are retained as user-level keys.
- Key names and secrets are preserved.

If multiple existing keys happen to share a name, each remains a separate key. Migration does not deduplicate credentials because equality of names or secrets does not establish user intent.

The old provider-scoped key storage and nested API contracts are removed after migration.

## Global Key Deletion

Deleting a user-level API key is an explicit cascading credential reset:

1. The frontend opens a shadcn `Dialog` for confirmation.
2. The dialog states how many Model Providers currently reference the key.
3. On confirmation, the backend performs one transaction that:
   - changes every referencing Provider to `manual` mode;
   - clears each Provider manual secret;
   - clears each Provider global key ID;
   - deletes the global key.
4. The affected Providers remain saved but have no configured secret.

The backend owns this cascade so deletion remains consistent regardless of which client invokes it.

## API Design

Replace the provider-nested API key endpoints with user-level API key endpoints under `/api-keys` for listing, creating, updating, and deleting keys.

API key list and mutation responses expose key metadata needed by the vault UI. Global API key secrets are accepted on create and update but are not returned by read endpoints.

Model Provider create and update requests accept the explicit credential mode and the corresponding manual secret or global API key ID. Model Provider detail responses include:

- credential mode;
- the Provider manual secret only when the mode is `manual`;
- selected global key ID and name when the mode is `vault`.

They do not expose the selected global key secret.

Model listing and connection testing obtain the effective secret through one shared application-level credential operation:

- `manual` returns the Provider manual secret;
- `vault` loads the selected user-owned key and returns its secret.

Preview endpoints used by unsaved create-page drafts continue to accept the effective secret supplied by the frontend. When a draft selects a vault key, the client sends the key ID instead of receiving and resending its secret; the backend resolves that ID for the authenticated user.

## Editor Structure

The create and edit pages share the same editor structure and behavior.

### Basic Info

Merge Basic Info and Provider and Base URL into one accordion section named Basic Info. Its fields appear in this order:

1. Name
2. Provider
3. Base URL
4. API Key

The summary combines the Provider name and base URL host while preserving the existing compact editor-section presentation.

### API Key Field

The credential row contains:

- a flexible-width input on the left;
- a key-vault icon button on the right.

Manual state behavior:

- The input is editable.
- Its value is masked by default.
- `Eye` and `EyeOff` controls inside the input toggle visibility.
- Typing switches the draft to `manual`, clears its global API key ID, and retains the typed value as the Provider manual secret.

Vault state behavior:

- The input is read-only and displays `Selected: {key name}` using the active locale.
- It does not expose the selected key secret.
- It does not show the visibility control.
- Activating the read-only input clears the selection and changes the draft to `manual` with an empty secret.

The key-vault button opens a shadcn Dialog on both create and edit pages. The dialog supports listing, selecting, creating, editing, and deleting user-level keys. Selecting a key closes the dialog, changes the draft to `vault`, clears the manual secret, and records the selected key ID and name.

Deleting a key uses a second confirmation Dialog rather than deleting directly from the vault list.

## Default and Available Models

Default Model remains an independent accordion section with its editable text field.

Add a sibling accordion section named `Available Models` using the correct English spelling. It replaces the existing Fetch model list button and model-candidate select.

Behavior:

- The first expansion starts the remote model-list request.
- The request runs at most once for the current valid input combination during an editor session.
- Results are sorted in ascending dictionary order before display.
- Each result is a stable, clickable list row.
- Selecting a row writes that model name into Default Model without collapsing the list.
- Loading, empty, failure, and loaded states occupy stable layout space and do not resize the editor controls unexpectedly.
- A failed request shows the API error and an explicit retry action.

Changing Provider, Base URL, credential mode, manual secret, or selected global API key invalidates the cached model list and clears its previous error. If Available Models remains expanded, the new valid input combination is loaded automatically. If required connection fields are incomplete, the section shows its empty/not-ready state without making a request.

The model-list cache belongs to the existing Model Provider draft session so mounted keep-alive pages retain their result while the draft remains alive.

## Error and Security Behavior

- Global API key secrets never appear in Model Provider detail responses or the vault list response.
- A global key ID from another user is rejected by Provider save, preview, model-list, and connection-test operations.
- An empty manual secret is valid storage state. Remote authentication requirements are reported by the remote operation rather than assumed by the form.
- Key deletion and Provider reference cleanup are atomic.
- Model-list errors use the existing API error formatting path.
- Changing connection inputs removes stale model results so models from a previous endpoint or credential are never presented as current.

## Component Boundaries

Keep the main editor responsible for composing sections and draft state. Extract focused UI units where they carry a clear contract:

- A credential field handles manual/vault display and switching events.
- A global key vault Dialog handles key CRUD and selection.
- An Available Models section handles lazy query state, sorting, retry, and model selection.

Credential ownership and effective-secret selection remain backend domain/application responsibilities. Generic form wrappers do not absorb Model Provider business rules.

## Testing

### Database and Backend

- Migration preserves every existing key and selected-key reference.
- Migration assigns each global key to the correct user.
- Manual and vault credentials save with mutually exclusive fields.
- Vault references enforce user ownership.
- Effective credential selection uses the correct source.
- Deleting a referenced key resets every referencing Provider and deletes the key in one transaction.
- A transaction failure leaves both the key and Provider references unchanged.
- Global key read responses do not expose secrets.
- Preview and saved model-list requests resolve global keys without sending their secrets to the browser.

### Frontend

- Basic Info contains the merged fields on create and edit pages.
- Manual secrets are masked and can be revealed and hidden.
- Selecting a vault key clears the manual secret and shows the localized selected-key label.
- Returning to manual mode clears the key reference.
- The vault Dialog supports CRUD and selection on both pages.
- Key deletion requires confirmation and refreshes affected Provider draft/query data.
- Available Models loads on first expansion, sorts results, retries failures, and fills Default Model on selection.
- Connection-input changes invalidate and, when expanded, reload the list.
- Existing draft-session and save behavior remains intact.

### Integration and Localization

- Browser tests cover create, edit, global-key selection, referenced-key deletion, lazy model loading, sorting, and Default Model selection.
- All locale branches receive matching keys.
- Translation coverage tests pass.
- OpenAPI-generated frontend schema is regenerated from the changed API contract.

## Acceptance Criteria

- Create and edit pages show one combined Basic Info section.
- Users can save a Provider with either its own manual secret or a referenced user-level API key.
- The same global key can be used by multiple Providers.
- Global key secrets are not sent to the frontend after creation or update.
- Deleting a referenced key requires confirmation and leaves affected Providers in manual mode with empty credentials.
- Available Models loads when first expanded, is sorted, and can populate Default Model.
- Stale model results are cleared whenever connection inputs change.
- Existing Model Provider data is migrated without losing keys or selected references.
