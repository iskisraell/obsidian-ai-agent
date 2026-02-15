# Scripts Reference

Windows helper scripts for building this Tauri app without admin permissions.

## Main scripts

- `tauri-cargo-dev.bat`
  - Runs `init-env.bat` then executes `cargo tauri dev`.
  - Used by `bun run tauri:dev` to avoid Bun Node-CLI crash path and PATH drift.

- `tauri-cargo-build.bat`
  - Runs `init-env.bat` then executes `cargo tauri build`.
  - Used by `bun run tauri:build` to avoid Bun Node-CLI crash path and PATH drift.

- `tauri-dev.bat`
  - Auto-detects the current project folder and creates/uses `C:\Dev\<project-folder-name>` junction.
  - Initializes environment and runs Tauri dev.
  - Supports: `--clean`, `--dry-run`.

- `tauri-build.bat`
  - Auto-detects the current project folder and creates/uses `C:\Dev\<project-folder-name>` junction.
  - Initializes environment and runs Tauri build.
  - Supports: `--clean`, `--dry-run`.

- `dev-junction.bat`
  - Creates/uses `C:\Dev\obsidian-ai-agent` junction to avoid MinGW path-with-spaces issues.
  - Initializes environment and runs `bun run tauri:dev`.

- `build-junction.bat`
  - Uses the same junction strategy for production builds.
  - Runs `bun run tauri:build`.
  - `tauri:build` is mapped to `cargo tauri build` in `package.json` for stability.

- `tauri-start-junction-dev.bat`
  - Wrapper alias for `dev-junction.bat` (same behavior).

- `tauri-build-junction-package.bat`
  - Wrapper alias for `build-junction.bat` (same behavior).

- `init-env.bat`
  - Adds Rust, MinGW, and Bun to PATH for the current shell session.

- `verify-env-manual.bat`
  - Runs local checks for Rust/Cargo/compiler/runtime/WebView2 readiness.

- `setup-mingw-manual.bat`
  - Installs MinGW in user space and writes `src-tauri/.cargo/config.toml`.

## Typical workflow

```bat
.\scripts\setup-mingw-manual.bat
.\scripts\verify-env-manual.bat
.\scripts\tauri-dev.bat
```

## Package workflow

```bat
.\scripts\tauri-build.bat
```

## Bun aliases

```bat
bun run tauri-dev
bun run tauri-build
```
