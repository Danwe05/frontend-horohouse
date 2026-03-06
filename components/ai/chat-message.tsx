"use client"

import { cn } from "@/lib/utils"
import { VoiceIndicator } from "./voice-indicator"
import { PropertyCardInline } from "./property-card-inline"
import { Bot, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import type { Message } from "@/types/ai"

interface ChatMessageProps {
  message: Message
  isSpeaking?: boolean
}

export function ChatMessage({ message, isSpeaking }: ChatMessageProps) {
  const { user } = useAuth()
  const isUser = message.role === "user"

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const hasProperties = message.properties && message.properties.length > 0

  // Get user's initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "U"
    return user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div
      className={cn(
        "flex animate-in fade-in-0 slide-in-from-bottom-2 duration-300 gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn("group relative max-w-[85%] md:max-w-[75%]", isUser && "order-first")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card text-card-foreground border border-border rounded-bl-md",
          )}
        >
          <div className="flex items-start gap-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            {!isUser && isSpeaking && <VoiceIndicator className="ml-2 shrink-0" />}
          </div>
          <span className={cn("mt-1 block text-xs opacity-60", isUser ? "text-right" : "text-left")}>
            {formatTime(message.timestamp)}
          </span>
        </div>

        {!isUser && hasProperties && (
          <PropertyCardInline properties={message.properties!} />
        )}
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md overflow-hidden">
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.name || "User"} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-primary-foreground">
              {getUserInitials()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}