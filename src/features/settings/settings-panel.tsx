import { useEffect, useState } from "react"
import { KeyRound, Link2, Save, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SettingsPayload } from "@/lib/tauri-contracts"

interface SettingsPanelProps {
  settings: SettingsPayload
  isSaving: boolean
  geminiApiKeyConfigured: boolean
  geminiApiKeySource: "os_keychain" | "environment" | "missing"
  isSavingGeminiKey: boolean
  isClearingGeminiKey: boolean
  onSave: (payload: SettingsPayload) => void
  onSaveGeminiKey: (apiKey: string) => void
  onClearGeminiKey: () => void
}

const geminiSourceLabel: Record<SettingsPanelProps["geminiApiKeySource"], string> = {
  os_keychain: "Stored securely in OS keychain",
  environment: "Using GEMINI_API_KEY environment variable",
  missing: "No Gemini API key configured",
}

export function SettingsPanel({
  settings,
  isSaving,
  geminiApiKeyConfigured,
  geminiApiKeySource,
  isSavingGeminiKey,
  isClearingGeminiKey,
  onSave,
  onSaveGeminiKey,
  onClearGeminiKey,
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<SettingsPayload>(settings)
  const [geminiApiKeyDraft, setGeminiApiKeyDraft] = useState("")

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  useEffect(() => {
    if (geminiApiKeyConfigured && geminiApiKeySource === "os_keychain") {
      setGeminiApiKeyDraft("")
    }
  }, [geminiApiKeyConfigured, geminiApiKeySource])

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
          <Input
            id="vault"
            value={draft.vault_path}
            onChange={(event) => setDraft((previous) => ({ ...previous, vault_path: event.target.value }))}
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="obsidian-cli" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Obsidian CLI
          </Label>
          <div className="flex gap-2">
            <Input
              id="obsidian-cli"
              value={draft.obsidian_cli_path}
              onChange={(event) =>
                setDraft((previous) => ({ ...previous, obsidian_cli_path: event.target.value }))
              }
              className="font-mono text-xs"
            />
            <Button variant="outline" size="icon" disabled>
              <Link2 className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-model" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Gemini Model
          </Label>
          <div className="flex gap-2">
            <Input
              id="gemini-model"
              value={draft.gemini_model}
              onChange={(event) => setDraft((previous) => ({ ...previous, gemini_model: event.target.value }))}
              className="font-mono text-xs"
            />
            <Button variant="outline" size="icon" disabled>
              <Sparkles className="size-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="write-mode" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Write Mode
          </Label>
          <Select
            value={draft.write_mode}
            onValueChange={(value: SettingsPayload["write_mode"]) =>
              setDraft((previous) => ({ ...previous, write_mode: value }))
            }
          >
            <SelectTrigger id="write-mode" className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cli_fallback">cli_fallback</SelectItem>
              <SelectItem value="cli_only">cli_only</SelectItem>
              <SelectItem value="filesystem_only">filesystem_only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-key" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Gemini API Key
          </Label>
          <div className="space-y-2">
            <Input
              id="gemini-key"
              type="password"
              value={geminiApiKeyDraft}
              onChange={(event) => setGeminiApiKeyDraft(event.target.value)}
              placeholder="Paste key and click Save Key"
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => onSaveGeminiKey(geminiApiKeyDraft.trim())}
                disabled={isSavingGeminiKey || geminiApiKeyDraft.trim().length === 0}
              >
                <KeyRound className="size-4" />
                {isSavingGeminiKey ? "Saving Key..." : "Save Key"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClearGeminiKey}
                disabled={isClearingGeminiKey || !geminiApiKeyConfigured}
              >
                {isClearingGeminiKey ? "Clearing..." : "Clear Key"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">{geminiSourceLabel[geminiApiKeySource]}</p>
          </div>
        </div>
        <Button
          className="w-full gap-2 bg-primary/90 hover:bg-primary"
          onClick={() =>
            onSave({
              ...draft,
              vault_path: draft.vault_path.trim(),
              obsidian_cli_path: draft.obsidian_cli_path.trim(),
              gemini_model: draft.gemini_model.trim(),
            })
          }
          disabled={isSaving}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  )
}
