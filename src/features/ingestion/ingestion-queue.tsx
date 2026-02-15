import { motion } from "framer-motion"
import { AudioLines, CheckCircle2, FileStack, ImageIcon, LoaderCircle, Video } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface QueueItem {
  id: string
  label: string
  mediaType: "audio" | "video" | "image" | "mixed"
  detail: string
  status: "queued" | "processing" | "completed" | "failed" | "cancelled"
}

const mediaIcon = {
  audio: AudioLines,
  video: Video,
  image: ImageIcon,
  mixed: FileStack,
} as const

const statusTone = {
  queued: "bg-secondary text-secondary-foreground border-border",
  processing: "bg-primary/15 text-primary border-primary/40",
  completed: "bg-emerald-400/10 text-emerald-200 border-emerald-400/40",
  failed: "bg-rose-500/10 text-rose-200 border-rose-500/40",
  cancelled: "bg-zinc-600/30 text-zinc-200 border-zinc-500/40",
} as const

export function IngestionQueue({ items }: { items: QueueItem[] }) {
  return (
    <Card className="grain border-primary/25 bg-card/70 shadow-[0_0_0_1px_rgba(123,77,255,0.2)]">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between text-sm tracking-[0.14em] uppercase">
          Ingestion Queue
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            {items.length} jobs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {items.map((item, index) => {
          const Icon = mediaIcon[item.mediaType]
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="flex items-center justify-between border border-border/80 bg-background/70 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="border border-primary/40 bg-primary/15 p-2">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn("text-[10px] tracking-[0.12em] uppercase", statusTone[item.status])}
              >
                {item.status === "processing" ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : item.status === "completed" ? (
                  <CheckCircle2 className="size-3" />
                ) : null}
                {item.status}
              </Badge>
            </motion.div>
          )
        })}
      </CardContent>
    </Card>
  )
}
