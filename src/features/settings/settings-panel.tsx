import { FolderOpen, KeyRound, Link2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SettingsState } from "@/lib/types"

export function SettingsPanel({ settings }: { settings: SettingsState }) {
  return (
    <Card className="border-border bg-card/70">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between text-sm tracking-[0.12em] uppercase">
          Runtime Settings
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            local-first
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="vault" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Vault Path
          </Label>
          <div className="flex gap-2">
            <Input id="vault" readOnly value={settings.vaultPath} className="font-mono text-xs" />
            <Button variant="outline" size="icon">
              <FolderOpen className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="obsidian-cli" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Obsidian CLI
          </Label>
          <div className="flex gap-2">
            <Input id="obsidian-cli" readOnly value={settings.obsidianCliPath} className="font-mono text-xs" />
            <Button variant="outline" size="icon">
              <Link2 className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-model" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Gemini Model
          </Label>
          <div className="flex gap-2">
            <Input id="gemini-model" readOnly value={settings.geminiModel} className="font-mono text-xs" />
            <Button variant="outline" size="icon">
              <Sparkles className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-key" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Gemini API Key
          </Label>
          <div className="flex gap-2">
            <Input id="gemini-key" readOnly value="••••••••••••••••••••••••••••" className="font-mono text-xs" />
            <Button variant="outline" size="icon">
              <KeyRound className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
