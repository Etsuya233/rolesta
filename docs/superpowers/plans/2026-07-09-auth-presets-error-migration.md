# Auth and Presets Error Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `auth` and `presets` onto the same layered error model already used by `characters`, with `reason + params + cause`, shared use-case wrapping, and HTTP-only exposure of safe failure data.

**Architecture:** `auth` and `presets` each keep their own `DomainError`, `PortError`, and `ApplicationError` types under the module. `execute()` methods that can fail use the shared `@UseCase(...)` decorator from `apps/api/src/common/errors`, and the module-level mapper translates domain/port failures into the module's application error before HTTP maps that into `ApiFailure`.

**Tech Stack:** TypeScript, NestJS, shared error base classes in `apps/api/src/common/errors`, Vitest.

---

### Task 1: Auth error model

**Files:**
- Create: `apps/api/src/auth/domain/auth-domain-error.ts`
- Create: `apps/api/src/auth/ports/auth-port-error.ts`
- Modify: `apps/api/src/auth/application/auth-application-error.ts`
- Modify: `apps/api/src/auth/application/setup-admin.use-case.ts`
- Modify: `apps/api/src/auth/application/login.use-case.ts`
- Modify: `apps/api/src/auth/application/authenticate-token.use-case.ts`
- Modify: `apps/api/src/auth/application/get-current-user.use-case.ts`
- Modify: `apps/api/src/auth/application/get-setup-status.use-case.ts`
- Modify: `apps/api/src/auth/application/logout.use-case.ts`
- Modify: `apps/api/src/auth/domain/user-account.ts`
- Modify: `apps/api/src/auth/http/auth-application-error.mapper.ts`
- Modify: `apps/api/src/auth/http/auth.guard.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] Move auth failure data onto the shared error shape with `reason`, semantic `params`, and optional `cause`.
- [ ] Introduce `AuthDomainError` for domain validation and `AuthPortError` for port-level failures.
- [ ] Wrap the failing auth use cases with `@UseCase(authErrorMapper)`.
- [ ] Update the guard and controller to convert `AuthApplicationError` into `ApiFailure` without exposing internal details.

### Task 2: Presets error model

**Files:**
- Create: `apps/api/src/presets/domain/preset-domain-error.ts`
- Create: `apps/api/src/presets/ports/preset-port-error.ts`
- Modify: `apps/api/src/presets/application/preset-application-error.ts`
- Create: `apps/api/src/presets/application/preset-error.mapper.ts`
- Modify: `apps/api/src/presets/application/create-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/get-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/update-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/delete-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/export-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/import-preset.use-case.ts`
- Modify: `apps/api/src/presets/application/create-preset-entry.use-case.ts`
- Modify: `apps/api/src/presets/application/update-preset-entry.use-case.ts`
- Modify: `apps/api/src/presets/application/delete-preset-entry.use-case.ts`
- Modify: `apps/api/src/presets/application/update-preset-prompt-items.use-case.ts`
- Modify: `apps/api/src/presets/adapters/silly-tavern/silly-tavern-preset-codec.ts`
- Modify: `apps/api/src/presets/http/preset-application-error.mapper.ts`
- Modify: `apps/api/src/presets/http/presets.controller.ts`

- [ ] Convert preset import/export and prompt-item failures to the shared preset error shape.
- [ ] Move SillyTavern codec failures onto `PresetPortError`.
- [ ] Wrap preset use cases with `@UseCase(presetErrorMapper)`.
- [ ] Keep HTTP mapping limited to status/code/safe params.

### Task 3: Tests and verification

**Files:**
- Create: `apps/api/src/auth/application/auth-use-cases.spec.ts`
- Create: `apps/api/src/presets/application/preset-use-cases.spec.ts`
- Modify: `apps/api/src/presets/adapters/silly-tavern/silly-tavern-preset-codec.spec.ts`

- [ ] Add focused tests that assert auth and preset errors preserve `reason`, `params`, and `cause` through the new mapping path.
- [ ] Update codec tests to check the port error class instead of the old application error class.
- [ ] Run `pnpm --filter @rolesta/api lint`.
- [ ] Run `pnpm --filter @rolesta/api typecheck`.
- [ ] Run `pnpm --filter @rolesta/api test`.
