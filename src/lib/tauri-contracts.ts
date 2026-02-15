export interface EnqueueIngestionRequest {
  file_paths: string[]
  note_title?: string
}

export interface EnqueueIngestionResponse {
  job_id: string
}

export interface JobSummary {
  id: string
  title: string
  status: string
  created_at: number
  updated_at: number
  asset_count: number
}

export interface JobAsset {
  id: number
  job_id: string
  original_path: string
  storage_path: string
  media_type: string
  mime_type: string
  size_bytes: number
  sha256: string
}

export interface JobDetails {
  job: JobSummary
  assets: JobAsset[]
}

export interface UpdateJobResponse {
  ok: boolean
}

export interface SettingsPayload {
  vault_path: string
  obsidian_cli_path: string
  gemini_model: string
  write_mode: "cli_only" | "filesystem_only" | "cli_fallback"
}

export interface GeminiApiKeyStatus {
  configured: boolean
  source: "os_keychain" | "environment" | "missing"
}

export interface PreviewNoteResponse {
  markdown: string
}

export interface PublishNoteResponse {
  note_path: string
  method: string
}
