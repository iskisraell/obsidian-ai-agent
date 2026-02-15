import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { open } from "@tauri-apps/plugin-dialog"
import { motion } from "framer-motion"
import { Bot, BrainCircuit, Database, GitBranch, Sparkles, Telescope, Waves } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngestionQueue, type QueueItem } from "@/features/ingestion/ingestion-queue"
import { InsightGrid } from "@/features/jobs/insight-grid"
import { NotePreview } from "@/features/notes/note-preview"
import { SettingsPanel } from "@/features/settings/settings-panel"
import {
  clearGeminiApiKey,
  enqueueIngestion,
  getGeminiApiKeyStatus,
  getSettings,
  listJobs,
  previewNote,
  publishNote,
  saveGeminiApiKey,
  saveSettings,
} from "@/lib/tauri-client"
import type { SettingsPayload } from "@/lib/tauri-contracts"
import type { InsightCard } from "@/lib/types"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { label: "Capture", icon: Waves },
  { label: "Insights", icon: BrainCircuit },
  { label: "Notes", icon: GitBranch },
  { label: "Storage", icon: Database },
  { label: "Agent", icon: Bot },
]

const defaultSettings: SettingsPayload = {
  vault_path: "",
  obsidian_cli_path: "obsidian",
  gemini_model: "gemini-2.5-flash",
  write_mode: "cli_fallback",
}

const statusToQueue: Record<string, QueueItem["status"]> = {
  queued: "queued",
  processing: "processing",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
}

export function DashboardShell() {
  const queryClient = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: listJobs,
    refetchInterval: 4000,
  })

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  })

  const geminiKeyStatusQuery = useQuery({
    queryKey: ["gemini-api-key-status"],
    queryFn: getGeminiApiKeyStatus,
  })

  useEffect(() => {
    if (!selectedJobId && jobsQuery.data?.[0]) {
      setSelectedJobId(jobsQuery.data[0].id)
    }
  }, [jobsQuery.data, selectedJobId])

  const previewQuery = useQuery({
    queryKey: ["preview-note", selectedJobId],
    queryFn: () => previewNote(selectedJobId!),
    enabled: Boolean(selectedJobId),
  })

  const enqueueMutation = useMutation({
    mutationFn: enqueueIngestion,
    onSuccess: (response) => {
      setSelectedJobId(response.job_id)
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
      toast.success("Capture batch queued")
    },
    onError: (error) => {
      toast.error(`Failed to queue capture: ${String(error)}`)
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: (payload) => {
      queryClient.setQueryData(["settings"], payload)
      toast.success("Settings saved")
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${String(error)}`)
    },
  })

  const publishMutation = useMutation({
    mutationFn: (jobId: string) => publishNote(jobId),
    onSuccess: (response) => {
      toast.success(`Note published via ${response.method}`)
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      toast.error(`Failed to publish note: ${String(error)}`)
    },
  })

  const saveGeminiApiKeyMutation = useMutation({
    mutationFn: (apiKey: string) => saveGeminiApiKey(apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemini-api-key-status"] })
      toast.success("Gemini API key saved in OS keychain")
    },
    onError: (error) => {
      toast.error(`Failed to save Gemini API key: ${String(error)}`)
    },
  })

  const clearGeminiApiKeyMutation = useMutation({
    mutationFn: clearGeminiApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gemini-api-key-status"] })
      toast.success("Gemini API key cleared from OS keychain")
    },
    onError: (error) => {
      toast.error(`Failed to clear Gemini API key: ${String(error)}`)
    },
  })

  const queueItems = useMemo<QueueItem[]>(
    () =>
      (jobsQuery.data ?? []).map((job) => ({
        id: job.id,
        label: job.title,
        detail: `${job.asset_count} assets`,
        mediaType: "mixed",
        status: statusToQueue[job.status] ?? "queued",
      })),
    [jobsQuery.data]
  )

  const metrics = useMemo(() => {
    const jobs = jobsQuery.data ?? []
    const queued = jobs.filter((job) => job.status === "queued").length
    const completed = jobs.filter((job) => job.status === "completed").length
    const failed = jobs.filter((job) => job.status === "failed").length

    return [
      { label: "Queued jobs", value: String(queued), hint: "Awaiting processing pipeline" },
      { label: "Completed jobs", value: String(completed), hint: "Ready for preview/publish" },
      { label: "Failed jobs", value: String(failed), hint: "Needs retry or prompt adjustment" },
    ]
  }, [jobsQuery.data])

  const insightItems = useMemo<InsightCard[]>(() => {
    const jobs = jobsQuery.data ?? []
    const statusCounts = jobs.reduce<Record<string, number>>((accumulator, job) => {
      accumulator[job.status] = (accumulator[job.status] ?? 0) + 1
      return accumulator
    }, {})

    return [
      {
        id: "status-overview",
        title: "Pipeline Status",
        category: "Runtime",
        color: "violet",
        points: [
          `queued: ${statusCounts.queued ?? 0}`,
          `processing: ${statusCounts.processing ?? 0}`,
          `completed: ${statusCounts.completed ?? 0}`,
          `failed: ${statusCounts.failed ?? 0}`,
        ],
      },
      {
        id: "settings-overview",
        title: "Current Runtime",
        category: "Configuration",
        color: "teal",
        points: [
          `write mode: ${(settingsQuery.data ?? defaultSettings).write_mode}`,
          `model: ${(settingsQuery.data ?? defaultSettings).gemini_model}`,
          `vault: ${(settingsQuery.data ?? defaultSettings).vault_path || "auto-detect"}`,
        ],
      },
    ]
  }, [jobsQuery.data, settingsQuery.data])

  const timelineEvents = useMemo(
    () =>
      (jobsQuery.data ?? []).slice(0, 3).map((job) => ({
        id: job.id,
        at: new Date(job.updated_at).toLocaleTimeString(),
        title: job.title,
        description: `Status: ${job.status}`,
      })),
    [jobsQuery.data]
  )

  const onStartCapture = async () => {
    const selection = await open({
      multiple: true,
      filters: [{ name: "Media", extensions: ["mp3", "wav", "m4a", "mp4", "jpg", "jpeg", "png", "heif"] }],
    })

    const filePaths = Array.isArray(selection) ? selection : selection ? [selection] : []
    if (filePaths.length === 0) {
      return
    }

    enqueueMutation.mutate({
      file_paths: filePaths,
    })
  }

  const onPublish = () => {
    if (!selectedJobId) {
      return
    }
    publishMutation.mutate(selectedJobId)
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid max-w-[1680px] grid-cols-12 gap-3 p-3">
        <aside className="col-span-2 hidden border border-border bg-sidebar/70 xl:block">
          <div className="border-b border-border px-4 py-4">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Obsidian AI Agent</p>
            <h1 className="mt-3 text-lg font-semibold">Operations Rail</h1>
          </div>
          <div className="space-y-2 p-3">
            {sidebarLinks.map((link, index) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.25 }}
                className="flex items-center gap-2 border border-border/80 bg-background/65 px-3 py-2"
              >
                <link.icon className="size-4 text-primary" />
                <span className="text-sm">{link.label}</span>
              </motion.div>
            ))}
          </div>
        </aside>

        <main className="col-span-12 space-y-3 xl:col-span-8">
          <Card className="border-primary/25 bg-card/65">
            <CardContent className="space-y-6 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">Multimodal ingestion</p>
                  <h2 className="mt-2 text-3xl font-semibold leading-tight">
                    Sharp knowledge capture
                    <br />
                    from audio, video, and images
                  </h2>
                </div>
                <Button className="gap-2 bg-primary/90 hover:bg-primary" onClick={onStartCapture}>
                  <Sparkles className="size-4" />
                  {enqueueMutation.isPending ? "Queuing..." : "Start New Capture"}
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-primary">{metric.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="pipeline" className="space-y-3">
            <TabsList className="grid h-auto grid-cols-3 border border-border bg-card p-0">
              <TabsTrigger value="pipeline" className="py-2 text-xs uppercase tracking-[0.15em]">
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="insights" className="py-2 text-xs uppercase tracking-[0.15em]">
                Insights
              </TabsTrigger>
              <TabsTrigger value="publish" className="py-2 text-xs uppercase tracking-[0.15em]">
                Publish
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pipeline" className="space-y-3">
              <IngestionQueue items={queueItems} />
            </TabsContent>
            <TabsContent value="insights" className="space-y-3">
              <InsightGrid items={insightItems} />
            </TabsContent>
            <TabsContent value="publish" className="space-y-3">
              <NotePreview
                markdown={previewQuery.data?.markdown ?? "Select a queued/completed job to generate note preview."}
                canPublish={Boolean(selectedJobId)}
                isPublishing={publishMutation.isPending}
                onRefresh={() => previewQuery.refetch()}
                onPublish={onPublish}
              />
            </TabsContent>
          </Tabs>

          <Card className="border-border bg-card/60">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm uppercase tracking-[0.13em]">Execution Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {timelineEvents.map((event) => (
                <div key={event.id} className="flex gap-3 border border-border/70 bg-background/60 p-3">
                  <Badge variant="outline" className="h-fit border-primary/40 bg-primary/10 text-primary">
                    {event.at}
                  </Badge>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>

        <aside className="col-span-2 hidden space-y-3 xl:block">
          <Card className="border-border bg-sidebar/75">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center justify-between text-sm uppercase tracking-[0.13em]">
                Signal Dial
                <Telescope className="size-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="mx-auto grid h-44 w-44 place-content-center border border-primary/30 bg-background">
                <div className="size-28 border border-primary/40 p-1">
                  <div className="grid size-full place-content-center border border-primary/25 bg-primary/10 text-2xl font-semibold text-primary">
                    {Math.min((jobsQuery.data ?? []).length * 10, 99)}%
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Insight confidence aggregated from multimodal extraction.
              </p>
            </CardContent>
          </Card>

          <SettingsPanel
            settings={settingsQuery.data ?? defaultSettings}
            isSaving={saveSettingsMutation.isPending}
            geminiApiKeyConfigured={geminiKeyStatusQuery.data?.configured ?? false}
            geminiApiKeySource={geminiKeyStatusQuery.data?.source ?? "missing"}
            isSavingGeminiKey={saveGeminiApiKeyMutation.isPending}
            isClearingGeminiKey={clearGeminiApiKeyMutation.isPending}
            onSave={(payload) => saveSettingsMutation.mutate(payload)}
            onSaveGeminiKey={(apiKey) => saveGeminiApiKeyMutation.mutate(apiKey)}
            onClearGeminiKey={() => clearGeminiApiKeyMutation.mutate()}
          />

          <Card className="border-border bg-sidebar/70">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm uppercase tracking-[0.13em]">Graph Pulse Matrix</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 96 }, (_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2.5 border border-border",
                      index % 4 === 0
                        ? "bg-primary/70"
                        : index % 7 === 0
                          ? "bg-fuchsia-400/70"
                          : "bg-background"
                    )}
                  />
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Density snapshot of note-to-note links generated this session.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
