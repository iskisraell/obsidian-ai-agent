# Project Agent Instructions

## Scope
- Build and evolve a local-first Obsidian AI Agent desktop app.
- Keep implementation aligned with the current architecture docs in this repo.

## Stack Rules
- Runtime/package manager: Bun.
- Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui + Framer Motion.
- Desktop: Tauri v2.
- Local persistence: SQLite (Rust side).

## Coding Rules
- Prefer functional, small, composable modules.
- Avoid `any`; use strict, explicit data contracts.
- Use parameterized SQL only.
- Keep file and path operations safe with canonicalization.

## Workflows
- Run `bun run typecheck` after meaningful changes.
- Run `bun run test` when logic or rendering behavior changes.
- Update `progress.txt` each session with dated entries.
- Track technical debt and risk in `AGENT-EDITABLE.md`.
