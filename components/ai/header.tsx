"use client"

import { Settings, Volume2, VolumeX, Menu, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface HeaderProps {
  voiceEnabled: boolean
  onToggleVoice: () => void
  onOpenSettings: () => void
  onToggleSidebar: () => void
}

export function Header({ voiceEnabled, onToggleVoice, onOpenSettings, onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-15 z-30 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="text-foreground hover:bg-secondary">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-foreground md:text-lg">
                <span className="text-blue-600">Horo</span>House
                <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
                  Assistant Immobilier IA
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleVoice}
                  className="text-foreground hover:bg-secondary"
                >
                  {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  <span className="sr-only">{voiceEnabled ? "Désactiver la voix" : "Activer la voix"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{voiceEnabled ? "Désactiver la voix" : "Activer la voix"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenSettings}
                  className="text-foreground hover:bg-secondary"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Paramètres</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Paramètres</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
