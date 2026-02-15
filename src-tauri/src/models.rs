use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum JobStatus {
  Queued,
  Processing,
  Completed,
  Failed,
  Cancelled,
}

impl JobStatus {
  pub fn as_str(&self) -> &'static str {
    match self {
      JobStatus::Queued => "queued",
      JobStatus::Processing => "processing",
      JobStatus::Completed => "completed",
      JobStatus::Failed => "failed",
      JobStatus::Cancelled => "cancelled",
    }
  }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnqueueIngestionRequest {
  pub file_paths: Vec<String>,
  pub note_title: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EnqueueIngestionResponse {
  pub job_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobSummary {
  pub id: String,
  pub title: String,
  pub status: String,
  pub created_at: i64,
  pub updated_at: i64,
  pub asset_count: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobAsset {
  pub id: i64,
  pub job_id: String,
  pub original_path: String,
  pub media_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobDetails {
  pub job: JobSummary,
  pub assets: Vec<JobAsset>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateJobResponse {
  pub ok: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SettingsPayload {
  pub vault_path: String,
  pub obsidian_cli_path: String,
  pub gemini_model: String,
  pub write_mode: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PreviewNoteResponse {
  pub markdown: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PublishNoteResponse {
  pub note_path: String,
  pub method: String,
}
