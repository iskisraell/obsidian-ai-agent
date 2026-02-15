use rusqlite::Connection;

pub fn run(conn: &Connection) -> Result<(), String> {
  conn
    .execute_batch(
      "
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ingestion_job (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS media_asset (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT NOT NULL REFERENCES ingestion_job(id) ON DELETE CASCADE,
        original_path TEXT NOT NULL,
        media_type TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        vault_path TEXT NOT NULL,
        obsidian_cli_path TEXT NOT NULL,
        gemini_model TEXT NOT NULL,
        write_mode TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ingestion_job_status ON ingestion_job(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_media_asset_job ON media_asset(job_id);

      CREATE VIRTUAL TABLE IF NOT EXISTS extraction_fts USING fts5(
        job_id UNINDEXED,
        content
      );
      ",
    )
    .map_err(|error| format!("failed to run schema migration batch: {error}"))?;

  let now = crate::time_now_ms();
  conn
    .execute(
      "INSERT OR IGNORE INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, ?3)",
      (1_i64, "init_schema", now),
    )
    .map_err(|error| format!("failed to register migration: {error}"))?;

  conn
    .execute(
      "
      INSERT OR IGNORE INTO settings (id, vault_path, obsidian_cli_path, gemini_model, write_mode)
      VALUES (1, '', 'obsidian', 'gemini-2.5-flash', 'cli_fallback')
      ",
      [],
    )
    .map_err(|error| format!("failed to seed default settings: {error}"))?;

  Ok(())
}
