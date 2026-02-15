use rusqlite::{params, OptionalExtension};

use crate::models::{JobAsset, JobDetails, JobSummary, SettingsPayload};

use super::super::app_state::DbConnection;

pub fn insert_job_with_assets(
  conn: &mut DbConnection,
  job_id: &str,
  title: &str,
  status: &str,
  file_paths: &[String],
  now: i64,
) -> Result<(), String> {
  let tx = conn
    .transaction()
    .map_err(|error| format!("failed to start insert_job_with_assets transaction: {error}"))?;

  tx
    .execute(
      "
      INSERT INTO ingestion_job (id, title, status, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
      ",
      params![job_id, title, status, now, now],
    )
    .map_err(|error| format!("failed to insert ingestion job: {error}"))?;

  for path in file_paths {
    let media_type = crate::ingestion::infer_media_type(path);
    tx
      .execute(
        "
        INSERT INTO media_asset (job_id, original_path, media_type, created_at)
        VALUES (?1, ?2, ?3, ?4)
        ",
        params![job_id, path, media_type, now],
      )
      .map_err(|error| format!("failed to insert media asset: {error}"))?;
  }

  tx
    .commit()
    .map_err(|error| format!("failed to commit insert_job_with_assets transaction: {error}"))
}

pub fn list_jobs(conn: &DbConnection) -> Result<Vec<JobSummary>, String> {
  let mut stmt = conn
    .prepare(
      "
      SELECT
        j.id,
        j.title,
        j.status,
        j.created_at,
        j.updated_at,
        COALESCE(COUNT(a.id), 0) AS asset_count
      FROM ingestion_job j
      LEFT JOIN media_asset a ON a.job_id = j.id
      GROUP BY j.id, j.title, j.status, j.created_at, j.updated_at
      ORDER BY j.updated_at DESC
      ",
    )
    .map_err(|error| format!("failed to prepare list_jobs query: {error}"))?;

  let rows = stmt
    .query_map([], |row| {
      Ok(JobSummary {
        id: row.get(0)?,
        title: row.get(1)?,
        status: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        asset_count: row.get(5)?,
      })
    })
    .map_err(|error| format!("failed to run list_jobs query: {error}"))?;

  let mut jobs = Vec::new();
  for row in rows {
    jobs.push(row.map_err(|error| format!("failed to parse list_jobs row: {error}"))?);
  }

  Ok(jobs)
}

pub fn find_job_with_assets(conn: &DbConnection, job_id: &str) -> Result<Option<JobDetails>, String> {
  let mut stmt = conn
    .prepare(
      "
      SELECT
        j.id,
        j.title,
        j.status,
        j.created_at,
        j.updated_at,
        COALESCE(COUNT(a.id), 0) AS asset_count
      FROM ingestion_job j
      LEFT JOIN media_asset a ON a.job_id = j.id
      WHERE j.id = ?1
      GROUP BY j.id, j.title, j.status, j.created_at, j.updated_at
      ",
    )
    .map_err(|error| format!("failed to prepare get_job query: {error}"))?;

  let job = stmt
    .query_row([job_id], |row| {
      Ok(JobSummary {
        id: row.get(0)?,
        title: row.get(1)?,
        status: row.get(2)?,
        created_at: row.get(3)?,
        updated_at: row.get(4)?,
        asset_count: row.get(5)?,
      })
    })
    .optional()
    .map_err(|error| format!("failed to query job: {error}"))?;

  let Some(job) = job else {
    return Ok(None);
  };

  let mut assets_stmt = conn
    .prepare(
      "
      SELECT id, job_id, original_path, media_type
      FROM media_asset
      WHERE job_id = ?1
      ORDER BY id ASC
      ",
    )
    .map_err(|error| format!("failed to prepare job assets query: {error}"))?;

  let rows = assets_stmt
    .query_map([job_id], |row| {
      Ok(JobAsset {
        id: row.get(0)?,
        job_id: row.get(1)?,
        original_path: row.get(2)?,
        media_type: row.get(3)?,
      })
    })
    .map_err(|error| format!("failed to run job assets query: {error}"))?;

  let mut assets = Vec::new();
  for row in rows {
    assets.push(row.map_err(|error| format!("failed to parse media asset row: {error}"))?);
  }

  Ok(Some(JobDetails { job, assets }))
}

pub fn update_job_status(conn: &DbConnection, job_id: &str, status: &str, now: i64) -> Result<bool, String> {
  let changed = conn
    .execute(
      "UPDATE ingestion_job SET status = ?1, updated_at = ?2 WHERE id = ?3",
      params![status, now, job_id],
    )
    .map_err(|error| format!("failed to update job status: {error}"))?;
  Ok(changed > 0)
}

pub fn get_settings(conn: &DbConnection) -> Result<SettingsPayload, String> {
  conn
    .query_row(
      "
      SELECT vault_path, obsidian_cli_path, gemini_model, write_mode
      FROM settings
      WHERE id = 1
      ",
      [],
      |row| {
        Ok(SettingsPayload {
          vault_path: row.get(0)?,
          obsidian_cli_path: row.get(1)?,
          gemini_model: row.get(2)?,
          write_mode: row.get(3)?,
        })
      },
    )
    .map_err(|error| format!("failed to load settings: {error}"))
}

pub fn save_settings(conn: &DbConnection, payload: &SettingsPayload) -> Result<(), String> {
  conn
    .execute(
      "
      UPDATE settings
      SET vault_path = ?1, obsidian_cli_path = ?2, gemini_model = ?3, write_mode = ?4
      WHERE id = 1
      ",
      params![
        payload.vault_path,
        payload.obsidian_cli_path,
        payload.gemini_model,
        payload.write_mode
      ],
    )
    .map_err(|error| format!("failed to save settings: {error}"))?;
  Ok(())
}
