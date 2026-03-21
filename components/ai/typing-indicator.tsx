export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      <div className="rounded-2xl border border-border bg-card px-4 py-3 -sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
