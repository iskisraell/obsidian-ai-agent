mod app_state;
mod db;
mod gemini;
mod ingestion;
mod models;
mod obsidian;

use tauri::{AppHandle, Manager, State};
use std::sync::atomic::{AtomicU64, Ordering};

use app_state::AppState;
use db::repository;
use models::{
  EnqueueIngestionRequest, EnqueueIngestionResponse, JobDetails, JobStatus, JobSummary,
  PreviewNoteResponse, PublishNoteResponse, SettingsPayload, UpdateJobResponse,
};

fn time_now_ms() -> i64 {
  let now = std::time::SystemTime::now();
  now
    .duration_since(std::time::UNIX_EPOCH)
    .map(|duration| duration.as_millis() as i64)
    .unwrap_or(0)
}

static JOB_COUNTER: AtomicU64 = AtomicU64::new(0);

fn make_job_id(now: i64) -> String {
  let sequence = JOB_COUNTER.fetch_add(1, Ordering::Relaxed);
  format!("job-{now}-{sequence}")
}

fn build_note_markdown(job: &JobDetails) -> String {
  let mut markdown = String::new();
  markdown.push_str("---\n");
  markdown.push_str(&format!("title: \"[AI Capture] {}\"\n", job.job.title));
  markdown.push_str("tags: [ai-capture, obsidian-agent]\n");
  markdown.push_str("---\n\n");
  markdown.push_str("## Key Insights\n");
  markdown.push_str("- Insights extraction scaffold is active.\n");
  markdown.push_str("- Gemini integration module is initialized.\n");
  markdown.push_str("- Obsidian write path is CLI-first with fallback.\n\n");
  markdown.push_str("## Source Files\n");
  for asset in &job.assets {
    markdown.push_str(&format!("- {} ({})\n", asset.original_path, asset.media_type));
  }
  markdown
}

#[tauri::command]
fn enqueue_ingestion(
  state: State<'_, AppState>,
  request: EnqueueIngestionRequest,
) -> Result<EnqueueIngestionResponse, String> {
  if request.file_paths.is_empty() {
    return Err("enqueue_ingestion requires at least one file path".to_string());
  }

  let now = time_now_ms();
  let job_id = make_job_id(now);
  let title = ingestion::build_job_title(request.note_title.as_deref(), request.file_paths.len());

  let mut conn = state.conn()?;
  repository::insert_job_with_assets(
    &mut conn,
    &job_id,
    &title,
    JobStatus::Queued.as_str(),
    &request.file_paths,
    now,
  )?;

  Ok(EnqueueIngestionResponse { job_id })
}

#[tauri::command]
fn list_jobs(state: State<'_, AppState>) -> Result<Vec<JobSummary>, String> {
  let conn = state.conn()?;
  repository::list_jobs(&conn)
}

#[tauri::command]
fn get_job(state: State<'_, AppState>, job_id: String) -> Result<Option<JobDetails>, String> {
  if job_id.trim().is_empty() {
    return Err("get_job requires a non-empty job_id".to_string());
  }
  let conn = state.conn()?;
  repository::find_job_with_assets(&conn, job_id.trim())
}

#[tauri::command]
fn retry_job(state: State<'_, AppState>, job_id: String) -> Result<UpdateJobResponse, String> {
  let conn = state.conn()?;
  let changed = repository::update_job_status(
    &conn,
    job_id.trim(),
    JobStatus::Queued.as_str(),
    time_now_ms(),
  )?;
  Ok(UpdateJobResponse { ok: changed })
}

#[tauri::command]
fn cancel_job(state: State<'_, AppState>, job_id: String) -> Result<UpdateJobResponse, String> {
  let conn = state.conn()?;
  let changed = repository::update_job_status(
    &conn,
    job_id.trim(),
    JobStatus::Cancelled.as_str(),
    time_now_ms(),
  )?;
  Ok(UpdateJobResponse { ok: changed })
}

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Result<SettingsPayload, String> {
  let conn = state.conn()?;
  repository::get_settings(&conn)
}

#[tauri::command]
fn save_settings(state: State<'_, AppState>, payload: SettingsPayload) -> Result<SettingsPayload, String> {
  let conn = state.conn()?;
  repository::save_settings(&conn, &payload)?;
  repository::get_settings(&conn)
}

#[tauri::command]
fn preview_note(state: State<'_, AppState>, job_id: String) -> Result<PreviewNoteResponse, String> {
  let conn = state.conn()?;
  let maybe_job = repository::find_job_with_assets(&conn, job_id.trim())?;
  let job = maybe_job.ok_or_else(|| "job not found".to_string())?;
  Ok(PreviewNoteResponse {
    markdown: build_note_markdown(&job),
  })
}

#[tauri::command]
fn publish_note(
  _app: AppHandle,
  state: State<'_, AppState>,
  job_id: String,
) -> Result<PublishNoteResponse, String> {
  let conn = state.conn()?;
  let maybe_job = repository::find_job_with_assets(&conn, job_id.trim())?;
  let job = maybe_job.ok_or_else(|| "job not found".to_string())?;
  let settings = repository::get_settings(&conn)?;
  let markdown = build_note_markdown(&job);
  obsidian::publish_note(&settings, &job.job.title, &markdown)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      let state = AppState::initialize(app.handle())?;
      app.manage(state);
      let gemini = gemini::GeminiClient::new();
      log::info!("gemini module status: {}", gemini.model_health());
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      enqueue_ingestion,
      list_jobs,
      get_job,
      retry_job,
      cancel_job,
      get_settings,
      save_settings,
      preview_note,
      publish_note
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
