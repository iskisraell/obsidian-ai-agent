use rusqlite::{params, Connection, OptionalExtension};

struct Migration {
  version: i64,
  name: &'static str,
  sql: &'static str,
}

fn migrations() -> Vec<Migration> {
  vec![
    Migration {
      version: 1,
      name: "init_core_tables",
      sql: "
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
          storage_path TEXT NOT NULL DEFAULT '',
          media_type TEXT NOT NULL,
          mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
          size_bytes INTEGER NOT NULL DEFAULT 0,
          sha256 TEXT NOT NULL DEFAULT '',
          duration_ms INTEGER,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          vault_path TEXT NOT NULL,
          obsidian_cli_path TEXT NOT NULL,
          gemini_model TEXT NOT NULL,
          write_mode TEXT NOT NULL
        );
      ",
    },
    Migration {
      version: 2,
      name: "add_traceability_tables",
      sql: "
        CREATE TABLE IF NOT EXISTS extraction_result (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT NOT NULL REFERENCES ingestion_job(id) ON DELETE CASCADE,
          model TEXT NOT NULL,
          raw_output TEXT NOT NULL,
          normalized_output TEXT NOT NULL,
          confidence REAL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS keyword (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          value TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS extraction_keyword (
          extraction_id INTEGER NOT NULL REFERENCES extraction_result(id) ON DELETE CASCADE,
          keyword_id INTEGER NOT NULL REFERENCES keyword(id) ON DELETE CASCADE,
          weight REAL,
          PRIMARY KEY (extraction_id, keyword_id)
        );

        CREATE TABLE IF NOT EXISTS obsidian_note (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT NOT NULL REFERENCES ingestion_job(id) ON DELETE CASCADE,
          note_path TEXT NOT NULL,
          method TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prompt_template (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS prompt_run (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT NOT NULL REFERENCES ingestion_job(id) ON DELETE CASCADE,
          prompt_template_key TEXT NOT NULL,
          prompt_body TEXT NOT NULL,
          response_body TEXT,
          created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS job_event (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id TEXT NOT NULL REFERENCES ingestion_job(id) ON DELETE CASCADE,
          kind TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      ",
    },
    Migration {
      version: 3,
      name: "add_indexes_and_fts",
      sql: "
        CREATE INDEX IF NOT EXISTS idx_ingestion_job_status ON ingestion_job(status, updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_media_asset_job ON media_asset(job_id);
        CREATE INDEX IF NOT EXISTS idx_extraction_result_job ON extraction_result(job_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_obsidian_note_job ON obsidian_note(job_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_job_event_job ON job_event(job_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_extraction_keyword_keyword ON extraction_keyword(keyword_id);

        CREATE VIRTUAL TABLE IF NOT EXISTS extraction_fts USING fts5(
          job_id UNINDEXED,
          content
        );

        CREATE TRIGGER IF NOT EXISTS extraction_fts_insert AFTER INSERT ON extraction_result BEGIN
          INSERT INTO extraction_fts(job_id, content)
          VALUES (new.job_id, new.normalized_output);
        END;
      ",
    },
  ]
}

fn ensure_schema_migrations_table(conn: &Connection) -> Result<(), String> {
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
      ",
    )
    .map_err(|error| format!("failed to initialize migration table: {error}"))
}

pub fn run(conn: &Connection) -> Result<(), String> {
  ensure_schema_migrations_table(conn)?;
  let now = crate::time_now_ms();

  for migration in migrations() {
    let already_applied = conn
      .query_row(
        "SELECT version FROM schema_migrations WHERE version = ?1",
        [migration.version],
        |row| row.get::<_, i64>(0),
      )
      .optional()
      .map_err(|error| format!("failed to check migration status: {error}"))?;

    if already_applied.is_some() {
      continue;
    }

    let tx = conn
      .unchecked_transaction()
      .map_err(|error| format!("failed to start migration transaction: {error}"))?;
    tx
      .execute_batch(migration.sql)
      .map_err(|error| format!("failed to apply migration {} ({}): {error}", migration.version, migration.name))?;
    tx
      .execute(
        "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?1, ?2, ?3)",
        params![migration.version, migration.name, now],
      )
      .map_err(|error| format!("failed to register migration {}: {error}", migration.version))?;
    tx
      .commit()
      .map_err(|error| format!("failed to commit migration {}: {error}", migration.version))?;
  }

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
