# Project Overview

## Product
Obsidian AI Agent is a local-first desktop app that ingests media files, extracts insights with Gemini, and writes structured notes into an Obsidian vault.

## Current Architecture (Target)

```text
obsidian-web/
├── src/                          # React UI
│   ├── app/                      # App shell and feature composition
│   ├── components/               # Reusable UI + feature components
│   ├── features/
│   │   ├── ingestion/            # Upload queue and processing views
│   │   ├── jobs/                 # Job history and details
│   │   ├── notes/                # Note preview and publish flow
│   │   └── settings/             # Vault/model/preferences
│   ├── lib/                      # Shared TS utilities and contracts
│   └── main.tsx                  # Entrypoint
├── src-tauri/                    # Rust backend and desktop host
│   ├── src/
│   │   ├── db/                   # SQLite pool + migrations + repositories
│   │   ├── gemini/               # Gemini API client and adapters
│   │   ├── ingestion/            # Media validation/storage/job orchestration
│   │   ├── obsidian/             # CLI + fallback writer gateway
│   │   └── lib.rs                # Tauri commands registration
│   ├── resources/                # WebView2Loader and bundle resources
│   ├── windows/                  # NSIS hooks
│   └── tauri.conf.json
├── scripts/                      # Windows environment and build scripts
├── docs/                         # Architecture and implementation notes
└── progress.txt                  # Session log
```

## Data Flow
1. User selects media files.
2. Tauri command validates type/size and copies to app storage.
3. Job processor uploads media to Gemini and gets structured extraction JSON.
4. Synthesizer builds note preview using modular prompt templates.
5. Obsidian gateway writes note using CLI-first strategy, fallback to direct vault file write.
6. SQLite stores traceability (job state, prompts, outputs, note path, hashes).

## Key Design Decisions
- Local-first with SQLite, no mandatory cloud backend in v1.
- Obsidian integration is resilient to missing CLI.
- Security baseline: parameterized queries, canonicalized file paths, atomic note writes.
- UI direction: dark brutalist Obsidian-inspired language with zero radius geometry.
