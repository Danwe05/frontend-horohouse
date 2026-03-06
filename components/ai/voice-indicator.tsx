import { cn } from "@/lib/utils"

interface VoiceIndicatorProps {
  className?: string
}

export function VoiceIndicator({ className }: VoiceIndicatorProps) {
  return (
    <div className={cn("flex items-end gap-0.5", className)}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-accent animate-equalizer"
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  )
}
