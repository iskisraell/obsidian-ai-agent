# Obsidian AI Agent

Local-first desktop app to ingest audio/video/images, extract structured insights, and publish notes into an Obsidian vault through CLI-first integration with filesystem fallback.

## Stack

- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS v4 + Framer Motion
- Tauri v2 (Rust backend)
- SQLite (local, embedded via `rusqlite`)
- Bun (package/runtime toolchain)

## Quickstart

```bat
C:\Users\israel.toledo\.bun\bin\bun.exe install
C:\Users\israel.toledo\.bun\bin\bun.exe run dev
```

## Build and Verify

```bat
C:\Users\israel.toledo\.bun\bin\bun.exe run typecheck
C:\Users\israel.toledo\.bun\bin\bun.exe run test
C:\Users\israel.toledo\.bun\bin\bun.exe run build
```

`bun run build` runs TypeScript checks and frontend build output generation (`dist/`).

## Tauri (Windows, no-admin workflow)

```bat
.\scripts\setup-mingw-manual.bat
.\scripts\verify-env-manual.bat
.\scripts\tauri-dev.bat
.\scripts\tauri-build.bat
```

Quick aliases:

```bat
bun run tauri-dev
bun run tauri-build
```

## Environment Variables

Use placeholders only:

```env
GEMINI_API_KEY=your_fake_placeholder_key
OBSIDIAN_VAULT_PATH=C:\path\to\your\vault
OBSIDIAN_CLI_PATH=obsidian
```

The app persists runtime settings in SQLite.
Gemini API key can be configured securely in-app (Runtime Settings) and stored in OS keychain.
`GEMINI_API_KEY` env var is still supported as fallback.

## Core Behavior

1. Queue media inputs (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.jpg`, `.png`, `.heif`).
2. Persist jobs/assets in local SQLite.
3. Generate note preview payload.
4. Publish to Obsidian:
   - First attempt CLI
   - Fallback to direct markdown file write under `AI Captures` in vault
