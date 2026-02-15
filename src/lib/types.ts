export type MediaKind = "audio" | "video" | "image"

export interface MediaAsset {
  id: string
  name: string
  type: MediaKind
  durationLabel: string
  status: "queued" | "processing" | "completed" | "failed"
}

export interface InsightCard {
  id: string
  title: string
  category: string
  points: string[]
  color: "violet" | "magenta" | "teal" | "lime" | "blue"
}

export interface TimelineEvent {
  id: string
  at: string
  title: string
  description: string
}

export interface SettingsState {
  vaultPath: string
  obsidianCliPath: string
  geminiModel: string
  writeMode: "cli_fallback"
}
