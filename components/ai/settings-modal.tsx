"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Settings } from "@/types/ai"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

export function SettingsModal({ open, onOpenChange, settings, onSettingsChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Paramètres</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Voice Output Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-output" className="text-sm font-medium text-card-foreground">
                Réponse vocale
              </Label>
              <p className="text-xs text-muted-foreground">L'assistant lit les réponses à voix haute</p>
            </div>
            <Switch
              id="voice-output"
              checked={settings.voiceOutput}
              onCheckedChange={(checked) => onSettingsChange({ ...settings, voiceOutput: checked })}
              className="data-[state=checked]:bg-muted"
            />
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <Label htmlFor="language" className="text-sm font-medium text-card-foreground">
              Langue
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value: "fr" | "en") => onSettingsChange({ ...settings, language: value })}
            >
              <SelectTrigger id="language" className="bg-background border-border text-foreground">
                <SelectValue placeholder="Sélectionner une langue" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="fr" className="text-card-foreground">
                  Français
                </SelectItem>
                <SelectItem value="en" className="text-card-foreground">
                  English
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Response Mode Select */}
          <div className="space-y-2">
            <Label htmlFor="response-mode" className="text-sm font-medium text-card-foreground">
              Mode de réponse
            </Label>
            <Select
              value={settings.responseMode}
              onValueChange={(value: "short" | "detailed") => onSettingsChange({ ...settings, responseMode: value })}
            >
              <SelectTrigger id="response-mode" className="bg-background border-border text-foreground">
                <SelectValue placeholder="Sélectionner un mode" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="short" className="text-card-foreground">
                  Réponses courtes
                </SelectItem>
                <SelectItem value="detailed" className="text-card-foreground">
                  Réponses détaillées
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.responseMode === "short"
                ? "Réponses concises et directes"
                : "Réponses complètes avec plus de détails"}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
