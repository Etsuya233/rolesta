# Rolesta HTTP Authentication Design

## Context

Rolesta currently has an `auth` module, placeholder auth routes, and initial login/setup pages. The API returns a shared envelope format, and the web app already has an OpenAPI client and React Router routes for `/setup`, `/login`, and `/app`.

The first authentication scope is HTTP request authentication. Realtime channels and plugin authentication are outside this design.

Existing user storage has `email`, `display_name`, and `password_hash` fields. The product requirement uses account names as usernames, so the user model will move to `username`, `display_name`, and `password_hash`. The setup page only asks for username and password. The backend stores `display_name` as the same username for the initial administrator.

## Goals

- Authenticate HTTP requests with stateful opaque Bearer tokens.
- Use username and password for login.
- Show the administrator setup page when the user table is empty.
- Create the first administrator from a minimal setup page with username, password, and create button.
- Persist login across browser refreshes.
- Keep auth behavior centralized in the API service, API client, and route protection layers.
- Preserve the existing API envelope and i18n error key approach.

## Non-Goals

- Multi-user administration UI.
- Password reset, email verification, and account recovery.
- Device management and session listing UI.
- Realtime or WebSocket authentication.
- Role permission design beyond identifying `admin` and `user`.

## Recommended Approach

Use opaque Bearer tokens stored in `localStorage` and backed by the existing `sessions` table.

The API creates a cryptographically random token after login or initial administrator creation. It stores only the token hash in `sessions`, then returns the original token to the web app. The web app stores the token under `rolesta.auth.token`. The OpenAPI request middleware reads that value before each request and sets:

```http
Authorization: Bearer <token>
```

This keeps refresh behavior simple for a personal deployment product while allowing logout to invalidate the current token immediately.

## Alternatives Considered

### JWT Bearer Tokens

JWTs satisfy stateless token authentication and avoid a database lookup on each request. They make logout less direct because the server has no session row to remove. A denylist or short token lifetime would be needed for immediate invalidation.

### Cookie-Carried Token

This would hide token handling from most frontend code and can use the same `sessions` table. The current product direction keeps token transport explicit through the `Authorization` header, so the first implementation should avoid cookie-specific CORS and SameSite behavior.

## User Model

The database user table should represent accounts by username:

```ts
type UserRole = 'admin' | 'user';

type User = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
```

`username` is unique and required. The initial validation rules should be modest: trim whitespace, require a non-empty value, and reject values longer than the database column limit. Case sensitivity should follow the database comparison behavior for now; a future account policy can define canonicalization if needed.

`display_name` remains in the table because the current response DTO already exposes it. During setup, it receives the same value as `username`.

## Password Handling

Passwords are never stored directly. The API stores a one-way password hash in `password_hash`.

The first implementation can use Node's built-in crypto primitives with a per-password salt and a strong key derivation function. The stored hash string should contain enough parameters to verify the password later, such as algorithm, iteration or cost, salt, and digest. Login compares the submitted password against the stored hash.

The setup password minimum remains 12 characters. The login password DTO should accept the same minimum used by setup so invalid forms fail early.

## Session Token Model

The API generates an opaque token with enough entropy for long-lived browser sessions. The token has no embedded user information and no client-readable payload.

```ts
type SessionRecord = {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
};
```

`sessions.id` stores the token hash, not the original token. The response body returns the original token only once. On later requests, the API hashes the Bearer token and loads the matching session row.

The session row carries the expiry. When the session is missing, expired, or points to a missing user, the request is unauthenticated. Expired rows can be deleted opportunistically during login, logout, and token validation.

## API Contract

### `GET /auth/setup-status`

Public endpoint.

Returns whether the system needs initial administrator setup:

```ts
type SetupStatusResponse = {
  requiresSetup: boolean;
};
```

`requiresSetup` is true when the user count is 0.

### `POST /auth/setup-admin`

Public endpoint only while no users exist.

Request:

```ts
type SetupAdminRequest = {
  username: string;
  password: string;
};
```

Response:

```ts
type AuthenticatedUserResponse = {
  token: string;
  user: CurrentUser;
};
```

If any user already exists, return `FORBIDDEN` using the existing envelope.

### `POST /auth/login`

Public endpoint.

Request:

```ts
type LoginRequest = {
  username: string;
  password: string;
};
```

Response:

```ts
type AuthenticatedUserResponse = {
  token: string;
  user: CurrentUser;
};
```

Invalid username or password returns `UNAUTHENTICATED`. The response should not reveal which field was wrong.

### `GET /auth/current-user`

Public endpoint that returns the current user when a valid token is present.

Response:

```ts
type CurrentUserResponse = {
  user: CurrentUser | null;
};
```

Missing or invalid token returns `{ user: null }` for this endpoint. Other protected endpoints should return `UNAUTHENTICATED` when no valid token is present.

### `POST /auth/logout`

Public endpoint that accepts the current Bearer token when present.

The API hashes the presented token and deletes the matching session row. The web app removes the token from `localStorage` after the logout request finishes.

## Backend Components

`AuthService` owns the authentication workflow:

- count users for setup status.
- create the first administrator.
- verify username and password.
- create session tokens.
- validate session tokens and load users.
- delete the current session on logout.

The module should include focused helpers where they carry real behavior, for example password hashing and session token hashing. Thin forwarding methods and placeholder carrier classes should be avoided.

A Nest guard can protect future routes by reading the Bearer token, validating it through `AuthService`, and attaching the authenticated user to the request. The first milestone should add the guard even if most existing routes remain public, because it defines the HTTP auth boundary for subsequent endpoints.

## Frontend Data Flow

The web app stores the token under:

```ts
const AUTH_TOKEN_STORAGE_KEY = 'rolesta.auth.token';
```

`apps/web/src/lib/api/client.ts` adds the `Authorization` header at request time when a token exists. It should keep the existing `Accept-Language` behavior.

The auth feature exposes API functions:

- `getSetupStatus()`
- `login(values)`
- `setupAdmin(values)`
- `getCurrentUser()`
- `logout()`

Login and setup functions store the returned token after the request succeeds. Logout removes the token.

## Routing Behavior

The app should route from startup state:

1. Query setup status.
2. If setup is required, send the user to `/setup`.
3. If setup is not required, query current user.
4. If current user exists, allow `/app`.
5. If current user is null, send the user to `/login`.

`/setup` should redirect away when setup is no longer required. `/login` should redirect away when the user is already authenticated.

The initial route `/` can continue to redirect into the app shell, but the auth route protection should decide whether the final page is `/setup`, `/login`, or `/app`.

## Setup Page UI

The setup page contains only:

- Username field.
- Password field.
- Create button.

The visual style should match the referenced shadcn v4 app direction: restrained spacing, quiet borders, compact form controls, and no marketing hero. Visible copy stays minimal and comes from i18n resources.

The page should show validation and API errors near the form using the existing API error formatting behavior.

## Login Page UI

The login page uses the same form visual language:

- Username field.
- Password field.
- Login button.

It should not include account creation links in this milestone. Account creation outside the first administrator setup is out of scope.

## Error Handling

Expected auth failures use the existing `ApiFailure` pattern and shared error codes:

- Validation errors return `VALIDATION_FAILED`.
- Missing or invalid token on protected routes returns `UNAUTHENTICATED`.
- Invalid login credentials return `UNAUTHENTICATED`.
- Setup attempted after a user already exists returns `FORBIDDEN`.

Frontend forms display API errors through the existing i18n-aware error helper. Local validation messages must use i18n resources.

## Testing

Backend tests:

- setup status returns true when no users exist.
- setup admin creates the first administrator and returns token plus user.
- repeated setup admin is rejected.
- login with valid username and password returns token plus user.
- login with invalid credentials returns `UNAUTHENTICATED`.
- current user returns null without token.
- current user returns the user with a valid Bearer token.
- logout deletes the current session token.
- a deleted or expired session token no longer authenticates.
- protected guard rejects missing or invalid tokens.

Frontend tests:

- API client attaches `Authorization` when a token exists.
- API client omits `Authorization` when no token exists.
- setup and login API functions store returned tokens.
- logout removes the token.
- auth routing sends an empty system to `/setup`.
- auth routing sends unauthenticated users to `/login`.
- auth routing allows authenticated users into `/app`.
- setup page renders only username, password, and create controls.

## Implementation Order

1. Update database schema and migration from `email` to `username`.
2. Update auth DTOs and OpenAPI response DTOs.
3. Implement password hashing and verification.
4. Implement opaque session token generation, hashing, storage, and expiry checks.
5. Implement setup status, setup admin, login, current user, and logout behavior.
6. Add an HTTP auth guard for protected routes.
7. Regenerate OpenAPI schema for the web app.
8. Update web auth API functions and token storage.
9. Add route protection around setup, login, and app routes.
10. Build setup and login forms with i18n text.
11. Add backend and frontend tests.
12. Run lint, typecheck, targeted tests, and build if time allows.

## Acceptance Criteria

- A fresh database opens the web app at the administrator setup page.
- The setup page only asks for username and password and has a create button.
- Creating the first administrator logs the user in and moves them into the app.
- A database with at least one user sends unauthenticated visitors to the login page.
- Login uses username and password.
- Refreshing the browser keeps the user logged in while the token is valid.
- HTTP requests carry a Bearer token after login.
- Invalid or expired tokens do not authenticate protected HTTP requests.
- Logout deletes the current session row and clears the stored token.
- The auth UI follows the existing shadcn-inspired visual direction and uses i18n resources.
