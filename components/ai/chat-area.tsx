"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Send, Mic, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { VoiceModal } from "./voice-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/ai"

interface ChatAreaProps {
  messages: Message[]
  isTyping: boolean
  isListening: boolean
  isSpeaking: boolean
  onSendMessage: (content: string) => void
  onVoiceInput: () => void
}

export function ChatArea({ messages, isTyping, isSpeaking, onSendMessage }: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim())
      setInputValue("")
    }
  }

  const handleOpenVoiceModal = () => {
    setVoiceModalOpen(true)
  }

  const handleVoiceSend = (message: string) => {
    onSendMessage(message)
  }

  const suggestions = ["Appartements à Cocody", "Villas avec piscine", "Studios meublés", "Maisons à louer"]

  return (
    <div className="flex flex-col pt-13 h-full relative">
      {/* Chat Messages Container - Scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl space-y-6 py-4">
          {messages.length === 1 && (
            <div className="flex flex-col items-center justify-center py-8 animate-in fade-in-0 duration-500">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Comment puis-je vous aider ?</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                Décrivez le bien que vous recherchez ou posez une question sur l&apos;immobilier
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => onSendMessage(suggestion)}
                    className="px-4 py-2 rounded-full text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isSpeaking={isSpeaking && index === messages.length - 1 && message.role === "assistant"}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input Area - Fixed at bottom */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Décrivez votre bien idéal..."
                className="h-12 rounded-full border-border bg-card pr-12 text-card-foreground shadow-sm transition-shadow focus:shadow-md"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim()}
                className="absolute right-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-blue-600 text-primary-foreground hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Envoyer</span>
              </Button>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    onClick={handleOpenVoiceModal}
                    className={cn(
                      "relative h-12 w-12 rounded-full shadow-lg transition-all duration-300",
                      "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105",
                    )}
                  >
                    <Mic className="h-5 w-5" />
                    <span className="sr-only">Cliquez pour parler</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Cliquez pour parler</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-3">
            HoroHouse peut faire des erreurs. Vérifiez les informations importantes.
          </p>
        </div>
      </div>

      <VoiceModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onSendMessage={handleVoiceSend} />
    </div>
  )
}