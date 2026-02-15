use std::sync::Arc;

use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use tauri::{AppHandle, Manager};

use crate::db::migrations;

pub type DbPool = Arc<Pool<SqliteConnectionManager>>;
pub type DbConnection = PooledConnection<SqliteConnectionManager>;

pub struct AppState {
  pub db_pool: DbPool,
}

impl AppState {
  pub fn initialize(app: &AppHandle) -> Result<Self, String> {
    let app_data_dir = app
      .path()
      .app_data_dir()
      .map_err(|error| format!("failed to resolve app data dir: {error}"))?;

    std::fs::create_dir_all(&app_data_dir)
      .map_err(|error| format!("failed to create app data directory: {error}"))?;

    let db_path = app_data_dir.join("obsidian_ai_agent.db");
    let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
      conn.execute_batch(
        "
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
        ",
      )
    });

    let pool = Pool::builder()
      .max_size(8)
      .build(manager)
      .map_err(|error| format!("failed to build sqlite pool: {error}"))?;

    {
      let conn = pool
        .get()
        .map_err(|error| format!("failed to get sqlite connection for migration: {error}"))?;
      migrations::run(&conn)?;
    }

    Ok(Self { db_pool: Arc::new(pool) })
  }

  pub fn conn(&self) -> Result<DbConnection, String> {
    self
      .db_pool
      .get()
      .map_err(|error| format!("failed to borrow sqlite connection: {error}"))
  }
}
