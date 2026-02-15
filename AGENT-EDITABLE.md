## Backlog
- [critical] Fix Bun/Vitest module resolution failure when running tests from junction path.
  - Plan: execute tests from original workspace path (non-junction) via a dedicated script, and split CI/local test commands so junction is used only for Tauri Rust builds.
  - Blast radius: `package.json` scripts, `scripts/*.bat`, developer workflow docs.
- [high] Add guardrails for GNU linker export overflow (`export ordinal too large`) in desktop Tauri templates.
  - Plan: document and enforce desktop-safe crate types (`staticlib`, `rlib`) in project scaffolding; add a startup check in scripts/docs to flag `cdylib` usage on GNU targets.
  - Blast radius: `src-tauri/Cargo.toml`, project templates, cross-project workaround docs.
- [high] Enforce valid ingestion media types at command boundary.
  - Plan: validate `request.file_paths` in `enqueue_ingestion` and reject unknown extensions with deterministic error payload.
  - Blast radius: `src-tauri/src/lib.rs`, `src-tauri/src/ingestion/mod.rs`, frontend error states.
- [high] Respect `write_mode` in note publication pipeline.
  - Plan: route publish behavior by settings (`cli_only`, `filesystem_only`, `cli_fallback`) instead of always trying CLI first.
  - Blast radius: `src-tauri/src/obsidian/mod.rs`, settings UI/contracts, tests.
- [high] Guard job status transitions to prevent invalid concurrent state changes.
  - Plan: implement transition matrix in repository update queries (e.g., queued->processing/completed/failed, processing->completed/failed/cancelled).
  - Blast radius: `src-tauri/src/db/repository.rs`, command handlers, UI status semantics.
- [medium] Decompose dashboard shell into feature-level presentational components.
  - Plan: split hero metrics, timeline, side rails, and pulse matrix into focused components with typed props and memo-safe static data.
  - Blast radius: `src/app/dashboard-shell.tsx`, `src/lib/mock-data.ts`, tests/snapshots.
- [high] Add secure secret storage strategy for Gemini API key.
  - Plan: evaluate Tauri plugin-store + OS keychain approach and migrate from plain settings storage.
  - Blast radius: settings screen, backend config loader, migration.
- [high] Implement real Gemini multimodal processing pipeline (upload, state polling, structured extraction schema).
  - Plan: replace current stub in `src-tauri/src/gemini/mod.rs` and wire async job worker.
  - Blast radius: job orchestration, DB model, prompt templates, error handling, UI status states.
- [medium] Add robust retry policy with jitter and resumable state for long media extraction jobs.
  - Plan: persist per-step retry counters and backoff policy in DB.
  - Blast radius: ingestion worker, job repository, UI status model.
- [medium] Implement nightly DB maintenance (`ANALYZE`, optional `VACUUM`, FTS optimize) with idle guard.
  - Plan: add maintenance command and schedule trigger from app lifecycle.
  - Blast radius: db module and app startup.

## Findings
- Obsidian desktop is installed locally, but `obsidian` command is not currently available in PATH.
- Vault exists and is currently minimal (`Welcome.md` only), which allows us to define note structure from scratch.
- Shell environment does not expose Bun/Rust in PATH by default; scripts need explicit path bootstrap.
- Bun + Tauri + GNU may fail at link time with `export ordinal too large` when `cdylib` is enabled in desktop crates.

## Session Notes
- 2026-02-14: Bootstrapped Vite + React + Tauri, started project governance docs, and began shadcn/Tailwind setup for brutalist Obsidian-inspired UI.
- 2026-02-14: Implemented full first-pass frontend dashboard and secure local Rust command surface.
- 2026-02-14: Build caveat observed: `bun run` nested invocation of `bunx vite build` can crash on this Windows environment; direct command execution succeeds.
- 2026-02-15: Added explicit junction wrapper scripts and documented canonical dev/package flow based on `C:\dev\sinq`.
- 2026-02-15: Hardened production package script with `cargo tauri build` fallback when Bun crashes during Tauri build.
- 2026-02-15: Fixed Bun script path escaping (`./scripts/...`) for junction aliases, added dev fallback to `cargo tauri dev`, and made ingestion writes transactional.
- 2026-02-15: Test suite still fails under Bun/Vitest due junction path resolution (`/@fs/...DESENV~1...`); captured as critical workflow debt.
- 2026-02-15: Added `tauri-dev.bat` and `tauri-build.bat` auto-junction scripts plus Bun aliases for simpler out-of-the-box dev/build commands.
- 2026-02-15: Resolved GNU linker overflow class by removing `cdylib` from `src-tauri/Cargo.toml` crate types for this desktop project and documented reusable fix.
