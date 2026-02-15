import { invoke } from "@tauri-apps/api/core"

import type {
  EnqueueIngestionRequest,
  EnqueueIngestionResponse,
  JobDetails,
  JobSummary,
  PreviewNoteResponse,
  PublishNoteResponse,
  SettingsPayload,
  UpdateJobResponse,
} from "@/lib/tauri-contracts"

const invokeCommand = <T>(command: string, payload?: Record<string, unknown>) =>
  invoke<T>(command, payload)

export const enqueueIngestion = (payload: EnqueueIngestionRequest) =>
  invokeCommand<EnqueueIngestionResponse>("enqueue_ingestion", { request: payload })

export const listJobs = () => invokeCommand<JobSummary[]>("list_jobs")

export const getJob = (jobId: string) => invokeCommand<JobDetails | null>("get_job", { job_id: jobId })

export const retryJob = (jobId: string) =>
  invokeCommand<UpdateJobResponse>("retry_job", { job_id: jobId })

export const cancelJob = (jobId: string) =>
  invokeCommand<UpdateJobResponse>("cancel_job", { job_id: jobId })

export const getSettings = () => invokeCommand<SettingsPayload>("get_settings")

export const saveSettings = (payload: SettingsPayload) =>
  invokeCommand<SettingsPayload>("save_settings", { payload })

export const previewNote = (jobId: string) =>
  invokeCommand<PreviewNoteResponse>("preview_note", { job_id: jobId })

export const publishNote = (jobId: string) =>
  invokeCommand<PublishNoteResponse>("publish_note", { job_id: jobId })
