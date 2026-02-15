import { Check, FilePenLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function NotePreview({ markdown }: { markdown: string }) {
  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between text-sm tracking-[0.12em] uppercase">
          Obsidian Note Preview
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <FilePenLine className="size-4" />
              Edit Prompt
            </Button>
            <Button size="sm" className="gap-2 bg-primary/90 hover:bg-primary">
              <Check className="size-4" />
              Publish
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[320px]">
          <div className="space-y-5 p-5 font-mono text-xs leading-6 text-foreground/90">
            {markdown.split("\n").map((line, index) => (
              <div key={`${line}-${index}`} className={line.startsWith("##") ? "text-primary" : ""}>
                {line || <Separator className="my-2 bg-transparent" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
