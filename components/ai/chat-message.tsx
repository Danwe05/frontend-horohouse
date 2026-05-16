"use client"

import { cn } from "@/lib/utils"
import { VoiceIndicator } from "./voice-indicator"
import { PropertyCardInline } from "./property-card-inline"
import { Bot, User, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import type { Message } from "@/types/ai"
import { motion } from "framer-motion"

interface ChatMessageProps {
  message: Message
  isSpeaking?: boolean
}

export function ChatMessage({ message, isSpeaking }: ChatMessageProps) {
  const { user } = useAuth()
  const isUser = message.role === "user"

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const hasProperties = message.properties && message.properties.length > 0

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
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      className={cn(
        "flex gap-4 group mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-1">
        {!isUser ? (
          <div className="w-10 h-10 rounded-2xl bg-[#222222] flex items-center justify-center shadow-lg relative overflow-hidden">
            <Bot className="h-5 w-5 text-white relative z-10" />
            <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-[#F7F7F7] border border-[#DDDDDD] flex items-center justify-center shadow-sm overflow-hidden">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[14px] font-bold text-[#222222]">
                {getUserInitials()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className={cn(
        "flex flex-col max-w-[85%] md:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message Bubble */}
        <div
          className={cn(
            "relative px-6 py-4 rounded-[24px] transition-all duration-300",
            isUser
              ? "bg-[#222222] text-white rounded-tr-none shadow-xl"
              : "bg-white border border-[#EBEBEB] text-[#222222] rounded-tl-none shadow-sm hover:shadow-md"
          )}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-start gap-3">
              <div className={cn(
                "text-[15px] leading-relaxed font-medium whitespace-pre-wrap",
                isUser ? "text-white/95" : "text-[#222222]"
              )}>
                {message.content}
              </div>
              {!isUser && isSpeaking && (
                <div className="mt-1.5 flex gap-1">
                   <VoiceIndicator className="shrink-0" />
                </div>
              )}
            </div>
            
            <div className={cn(
              "text-[11px] font-bold mt-2 tracking-wide uppercase opacity-40",
              isUser ? "text-white" : "text-[#717171]"
            )}>
              {formatTime(message.timestamp || new Date())}
            </div>
          </div>
        </div>

        {/* Property Recommendations Area */}
        {!isUser && hasProperties && (
          <div className="w-full mt-4 animate-in fade-in-0 slide-in-from-top-2 duration-700">
            <PropertyCardInline properties={message.properties!} />
          </div>
        )}
      </div>
    </motion.div>
  )
}