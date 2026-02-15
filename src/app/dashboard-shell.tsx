import { motion } from "framer-motion"
import {
  Bot,
  BrainCircuit,
  Database,
  GitBranch,
  Sparkles,
  Telescope,
  Waves,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngestionQueue } from "@/features/ingestion/ingestion-queue"
import { InsightGrid } from "@/features/jobs/insight-grid"
import { NotePreview } from "@/features/notes/note-preview"
import { SettingsPanel } from "@/features/settings/settings-panel"
import { defaultSettings, insightCards, mediaAssets, notePreview, timelineEvents } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { label: "Capture", icon: Waves },
  { label: "Insights", icon: BrainCircuit },
  { label: "Notes", icon: GitBranch },
  { label: "Storage", icon: Database },
  { label: "Agent", icon: Bot },
]

export function DashboardShell() {
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
                <Button className="gap-2 bg-primary/90 hover:bg-primary">
                  <Sparkles className="size-4" />
                  Start New Capture
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Queued assets", value: "12", hint: "2 long audio memos in progress" },
                  { label: "Notes published", value: "37", hint: "Last note synced 5 minutes ago" },
                  { label: "Keyword nodes", value: "214", hint: "Graph density +14% this week" },
                ].map((metric) => (
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
              <IngestionQueue assets={mediaAssets} />
            </TabsContent>
            <TabsContent value="insights" className="space-y-3">
              <InsightGrid items={insightCards} />
            </TabsContent>
            <TabsContent value="publish" className="space-y-3">
              <NotePreview markdown={notePreview} />
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
                    83%
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Insight confidence aggregated from multimodal extraction.
              </p>
            </CardContent>
          </Card>

          <SettingsPanel settings={defaultSettings} />

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
