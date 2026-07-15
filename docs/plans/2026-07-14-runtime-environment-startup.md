# Runtime Environment Startup Implementation Plan

**Goal:** Replace Corepack-based development commands with Bash and PowerShell startup scripts that load a root `.env`, prepend `RUNTIME_PATH`, run the active Shell's pre-startup task, and start the Turborepo workspace.

**Architecture:** `start.sh` and `start.ps1` are independent native orchestrators with the same environment-file contract. Each script prepares its process environment before invoking Node or pnpm, runs its pre-startup task in a child process, validates runtime availability, and hands control to `pnpm dev:workspace`. The approved behavior is defined in `docs/specs/2026-07-14-runtime-environment-startup-design.md`.

**Tech Stack:** Bash, PowerShell 7, pnpm 11, Turborepo, GitHub Actions.

---

### Task 1: Add startup configuration and extension points

**Files:**

- Create: `.env.example`
- Create: `.pre_startup_task/startup.sh`
- Create: `.pre_startup_task/startup.ps1`

- [ ] Add a UTF-8 root `.env.example` with commented Windows and Unix `RUNTIME_PATH` examples and an empty active assignment.
- [ ] Add the Bash pre-startup task with strict error handling and no project command.
- [ ] Add the PowerShell pre-startup task with terminating error behavior and no project command.
- [ ] Keep the real root `.env` ignored and leave application-specific `.env` files unchanged.

### Task 2: Implement the Bash startup entry point

**Files:**

- Create: `start.sh`

- [ ] Resolve and enter the repository root from `BASH_SOURCE`.
- [ ] Parse the optional root `.env` as UTF-8, accepting BOM, LF/CRLF, blank lines, full-line comments, empty values, and matching single- or double-quoted values.
- [ ] Validate environment keys, split assignments at the first `=`, preserve literal value content according to the design, and let the last duplicate assignment win.
- [ ] Export ordinary variables, then prepend `RUNTIME_PATH` to the effective `PATH`.
- [ ] On Git Bash, reject empty semicolon-delimited entries and convert each Windows path through `cygpath`; on Linux, macOS, and WSL, reject empty colon-delimited entries and use native paths.
- [ ] Require and run `.pre_startup_task/startup.sh` as a Bash child process from the repository root.
- [ ] Verify `node` and `pnpm` are executable and print their versions without implementing Shell-level version comparison.
- [ ] Use `exec pnpm dev:workspace` so terminal signals and the final exit status belong to the workspace process.

### Task 3: Implement the PowerShell startup entry point

**Files:**

- Create: `start.ps1`

- [ ] Resolve and enter the repository root from `$PSScriptRoot` and enable terminating error behavior.
- [ ] Implement the same optional UTF-8 `.env` grammar and duplicate-key behavior as the Bash entry point, including BOM and CRLF handling.
- [ ] Export ordinary process variables, then split `RUNTIME_PATH` with `[IO.Path]::PathSeparator`, reject empty entries, and prepend it to the effective process `PATH`.
- [ ] Require and run `.pre_startup_task/startup.ps1` in a new PowerShell child process from the repository root so task-local environment and directory changes remain isolated.
- [ ] Verify `node` and `pnpm` are executable, print their versions, run `pnpm dev:workspace` in the foreground, and return its exit code.
- [ ] Ensure stage failures have concise messages and non-zero exit statuses.

### Task 4: Rewire package commands and CI

**Files:**

- Modify: `package.json`
- Modify: `apps/web/playwright.config.ts`
- Modify: `.github/workflows/ci.yml`

- [ ] Remove `packageManager` from the root package manifest while retaining `engines.node` and `engines.pnpm`.
- [ ] Set `dev` to `bash ./start.sh`, add `dev:pwsh`, and move the current Turborepo command to `dev:workspace`.
- [ ] Replace active `corepack pnpm` invocations in database, OpenAPI, and Playwright commands with direct `pnpm` calls.
- [ ] Configure `pnpm/action-setup@v4` with explicit version `11.9.0`, since CI can no longer derive a version from `packageManager`.
- [ ] Parse `package.json` and the workflow after editing to catch syntax or indentation errors.

### Task 5: Update development documentation

**Files:**

- Modify: `README.md`

- [ ] Update the pnpm requirement to version 11 or newer.
- [ ] Retain setup instructions for the API, web, and database environment files.
- [ ] Document the optional root `.env` with Windows and Unix `RUNTIME_PATH` examples.
- [ ] Document `bash ./start.sh` as the authoritative default and `pwsh -File ./start.ps1` as the PowerShell alternative.
- [ ] Explain the order: root environment load, runtime path prepend, pre-startup child task, runtime check, workspace startup.

### Task 6: Verify both startup paths

**Files:**

- Verify: `start.sh`
- Verify: `start.ps1`
- Verify: `.pre_startup_task/startup.sh`
- Verify: `.pre_startup_task/startup.ps1`
- Verify: `package.json`
- Verify: `apps/web/playwright.config.ts`
- Verify: `.github/workflows/ci.yml`
- Verify: `README.md`

- [ ] Run `bash -n start.sh .pre_startup_task/startup.sh`.
- [ ] Parse both PowerShell files with `[System.Management.Automation.Language.Parser]::ParseFile` and require zero syntax errors.
- [ ] Build isolated temporary repository fixtures containing copies of the startup scripts, pre-startup tasks, controlled `.env` files, and fake Node/pnpm executables; do not create or overwrite the project's real `.env`.
- [ ] Exercise BOM, CRLF, comments, values containing `=`, quoted whitespace and `#`, empty values, duplicate keys, invalid keys, invalid quote tails, paths containing spaces, and empty runtime-path segments in both Shells.
- [ ] Verify ordinary variable replacement, explicit `PATH` behavior, `RUNTIME_PATH` precedence, child-process isolation, and pre-startup failure propagation.
- [ ] Scan active scripts and configuration for remaining `corepack` invocations while excluding historical design and handoff documents.
- [ ] Start each entry point with a bounded timeout, observe the API and web development processes reach their running state, and terminate the process tree.
- [ ] Verify cancellation and confirm no Turborepo, API, or Vite child process remains after shutdown.
- [ ] Run `git diff --check` and inspect `git status --short` before handoff.
