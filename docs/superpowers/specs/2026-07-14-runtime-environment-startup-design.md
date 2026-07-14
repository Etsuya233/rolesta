# Runtime Environment Startup Design

## Goal

Rolesta should start through repository-owned Bash and PowerShell scripts. The scripts load local runtime configuration before Node or pnpm is required, run an extension point for future startup tasks, and then start the existing Turborepo development workspace.

Corepack is removed from the repository's active startup and tool commands. Developers select locally installed Node and pnpm executables through a root `.env` file.

## Entry Points

The authoritative development entry points are:

```bash
bash ./start.sh
```

```powershell
pwsh -File ./start.ps1
```

Bash is the documented default. Direct script execution is required for environment bootstrapping because `pnpm dev` cannot be invoked when pnpm only becomes discoverable after loading the root `.env`.

The root `package.json` provides these convenience commands for environments where pnpm is already available:

```json
{
  "scripts": {
    "dev": "bash ./start.sh",
    "dev:pwsh": "pwsh -File ./start.ps1",
    "dev:workspace": "turbo dev"
  }
}
```

Both startup scripts finish by invoking `pnpm dev:workspace`.

## Supported Environments

The supported startup combinations are:

- Git Bash and PowerShell 7 on Windows;
- Bash and PowerShell 7 on Linux and macOS;
- Bash in WSL, treated as a Linux environment with Linux paths.

MSYS2 and Cygwin are outside the supported startup matrix. On Windows, the Bash entry point specifically targets the Git for Windows environment. On Unix hosts, both Shells use the host's native path format.

## Files And Responsibilities

`start.sh` owns Bash-compatible environment loading, Windows path conversion when running under Git Bash, Bash pre-startup task execution, and workspace startup.

`start.ps1` owns PowerShell-compatible environment loading, Windows path merging, PowerShell pre-startup task execution, and workspace startup.

`.env.example` documents the root startup environment without containing machine-specific paths. The developer-created root `.env` remains ignored by Git.

`.pre_startup_task/startup.sh` and `.pre_startup_task/startup.ps1` are committed extension points. They contain no project task initially. Future setup commands can be added without changing the startup orchestrators. Each task runs as a child process with the repository root as its working directory. File changes persist, while task-local environment changes and working-directory changes do not affect workspace startup.

Application environment files under `apps/api`, `apps/web`, and `packages/db` retain their current responsibilities. The root startup `.env` does not replace them.

## Startup Sequence

Each startup entry point performs the following sequence:

1. Resolve the repository root from the startup script location and use it as the working directory.
2. Read the root `.env` when it exists.
3. Export ordinary variables, replacing values inherited from the parent process.
4. Read `RUNTIME_PATH`, convert its entries when required, and prepend them to the effective `PATH` after ordinary variables have been exported.
5. Execute the pre-startup task for the active Shell.
6. Confirm that `node` and `pnpm` are executable and print their resolved versions.
7. Execute `pnpm dev:workspace` and preserve its exit status.

The root `.env` is optional. Its absence leaves the inherited environment unchanged and does not stop startup. `RUNTIME_PATH` is also optional.

## Environment File Contract

The root `.env` is UTF-8 text. A UTF-8 BOM on the first line is accepted, and both LF and CRLF line endings are accepted. The file supports:

- empty lines;
- full-line comments beginning with `#` after optional leading whitespace;
- `KEY=VALUE` assignments split at the first `=`;
- unquoted values and values enclosed by matching single or double quotes.

Variable names must match `[A-Za-z_][A-Za-z0-9_]*`. Whitespace around the key is ignored. Unquoted values have leading and trailing whitespace removed. Quoted values preserve all content inside the matching quotes, including whitespace and `#`; only whitespace may follow the closing quote. `KEY=` is valid and assigns an empty string. In unquoted values, `#` is literal content; comments are recognized only when `#` is the first non-whitespace character on a line.

Values are treated as literals: startup does not execute substitutions, expand variable references, or evaluate Shell expressions. When a key appears more than once, the last assignment wins. A malformed non-comment line stops startup with the line number and a concise error.

Ordinary variables overwrite inherited variables in the startup process. This includes `PATH` when a developer explicitly places it in `.env`; `RUNTIME_PATH` is then prepended to that effective value. The provided `.env.example` uses only `RUNTIME_PATH` for tool discovery, so the normal configuration preserves the parent process path. `RUNTIME_PATH` itself is not copied directly over `PATH`.

## Runtime Path Rules

`RUNTIME_PATH` contains directories for project-selected runtime tools such as Node and pnpm. Startup prepends these directories to the effective `PATH`. When `.env` does not explicitly assign `PATH`, this preserves access to the parent process's system tools.

On Windows, `.env` uses the normal Windows semicolon-separated format. Empty path segments are invalid, while paths containing spaces are accepted:

```dotenv
RUNTIME_PATH=D:\software\npm\2418;C:\Users\Etsuya\AppData\Local\pnpm
```

PowerShell uses these entries directly. Git Bash recognizes its Windows host and converts each entry with `cygpath` before joining them with the Bash path separator. Conversion failure stops startup.

On Linux, macOS, and WSL, `.env` uses the normal colon-separated format:

```dotenv
RUNTIME_PATH=/opt/node/bin:/home/user/.local/share/pnpm
```

The same Windows `.env` therefore works with the repository's Git Bash and PowerShell entry points. A Unix `.env` works with Bash and PowerShell 7 on Unix hosts.

## Failure Behavior

Both startup scripts stop immediately when any required step fails. This includes malformed `.env` content, an empty runtime path segment, path conversion failure, a non-zero pre-startup task exit, unavailable Node or pnpm executables, and failure from `pnpm dev:workspace`.

The startup scripts print which stage failed and return a non-zero status. They do not install runtimes, select alternate executables, repair configuration, or continue with a different startup path.

The committed pre-startup files are required. A missing active-Shell task file is treated as a repository integrity error and stops startup.

Startup confirms executable availability and prints the resolved Node and pnpm versions. It does not compare versions in Shell code; `package.json#engines` remains the single version-constraint declaration.

After preparation, Bash uses `exec pnpm dev:workspace` so the development command owns the startup process and receives terminal signals directly. PowerShell runs pnpm as its foreground child and returns the child's exit code. `Ctrl+C` must reach Turborepo and its development processes in both entry points.

## Corepack Removal

The root `package.json` removes the `packageManager` field and retains `engines.node` and `engines.pnpm` as the declared version constraints.

The database and OpenAPI scripts call `pnpm` directly. The Playwright web-server command also calls `pnpm` directly. GitHub Actions keeps `pnpm/action-setup` and `actions/setup-node`, and explicitly configures pnpm version `11.9.0` on `pnpm/action-setup` because the action can no longer obtain a version from `packageManager`.

Historical documents are left unchanged. Active configuration, scripts, and current development documentation must contain no Corepack invocation.

## Documentation

The README development section will:

- require Node 22 or newer and pnpm 11 or newer;
- describe the root `.env` and show Windows and Unix `RUNTIME_PATH` examples;
- document `bash ./start.sh` as the default startup command;
- document `pwsh -File ./start.ps1` as the PowerShell alternative;
- explain the environment loading and pre-startup ordering;
- retain the existing application-specific `.env` setup instructions.

## Verification

Verification will cover:

- Bash syntax validation with `bash -n`;
- PowerShell syntax validation through the PowerShell parser;
- environment parsing for comments, quoting, values containing `=`, and invalid variable names;
- environment parsing with UTF-8 BOM, LF, CRLF, empty values, whitespace, and invalid trailing quoted content;
- duplicate-key behavior and an explicit `PATH` assignment followed by `RUNTIME_PATH` merging;
- ordinary variable replacement and `RUNTIME_PATH` prepend behavior in both Shells;
- Git Bash conversion of Windows runtime paths, including paths containing spaces;
- rejection of empty runtime path segments;
- propagation of pre-startup task failures;
- root `package.json` command structure and JSON validity;
- explicit CI pnpm version configuration;
- removal of active Corepack references;
- a bounded startup smoke test that observes the API and web development processes entering their running state, then terminates them;
- cancellation verification that checks `Ctrl+C` does not leave the development processes running.

No domain glossary update is needed because `RUNTIME_PATH` and pre-startup tasks are engineering configuration terms. No ADR is created because this startup arrangement is localized and inexpensive to reverse.
