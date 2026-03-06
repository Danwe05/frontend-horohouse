"use client"

import { Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface MicrophoneButtonProps {
  isListening: boolean
  onClick: () => void
}

export function MicrophoneButton({ isListening, onClick }: MicrophoneButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {/* Pulse ring animation when listening */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full bg-accent animate-pulse-ring [animation-delay:0.5s]" />
              </>
            )}
            <Button
              type="button"
              size="icon"
              onClick={onClick}
              disabled={isListening}
              className={cn(
                "relative h-12 w-12 rounded-full shadow-lg transition-all duration-300",
                isListening
                  ? "bg-accent text-accent-foreground scale-110"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105",
              )}
            >
              {isListening ? <WaveformIcon className="h-6 w-6" /> : <Mic className="h-5 w-5" />}
              <span className="sr-only">{isListening ? "Écoute en cours..." : "Cliquez pour parler"}</span>
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">{isListening ? "Écoute en cours..." : "Cliquez pour parler"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function WaveformIcon({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-current animate-wave"
          style={{
            height: "16px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}
