"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Send, Mic, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChatMessage } from "./chat-message"
import { TypingIndicator } from "./typing-indicator"
import { VoiceModal } from "./voice-modal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/ai"
import { motion, AnimatePresence } from "framer-motion"

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

  const suggestions = [
    "Luxury villas in Cocody",
    "Modern studios with 24/7 power",
    "3-bedroom family homes in Yaoundé",
    "Apartments near University campus"
  ]

  return (
    <div className="flex flex-col h-full relative bg-white overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-50/40 blur-[120px] pointer-events-none" />

      {/* Chat Messages Container - Scrollable */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-6 scrollbar-hide no-scrollbar">
        <div className="mx-auto max-w-3xl space-y-8 py-10 pb-32">
          <AnimatePresence mode="popLayout">
            {messages.length <= 1 && !isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-20 h-20 rounded-3xl bg-[#222222] flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-[28px] font-semibold text-[#222222] mb-3 tracking-tight">How can I assist you today?</h2>
                <p className="text-[16px] text-[#717171] text-center max-w-sm mb-10 leading-relaxed font-medium">
                  Search by location, amenities, or simply describe your dream home in your own words.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      onClick={() => onSendMessage(suggestion)}
                      className="px-5 py-3 rounded-2xl text-[14px] font-bold bg-[#F7F7F7] text-[#222222] hover:bg-[#222222] hover:text-white transition-all border border-[#EBEBEB] hover:border-transparent active:scale-95"
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
            
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || index}
                message={message}
                isSpeaking={isSpeaking && index === messages.length - 1 && message.role === "assistant"}
              />
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="bg-gradient-to-t from-white via-white/95 to-transparent pt-20 pb-6">
          <div className="mx-auto max-w-3xl px-6 pointer-events-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <div className="flex items-center gap-3 bg-white border border-[#DDDDDD] p-2 rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] focus-within:border-[#222222] focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-300">
                <div className="flex-1 flex items-center px-4">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about properties, neighborhoods..."
                    className="h-12 border-none bg-transparent p-0 text-[16px] text-[#222222] placeholder:text-[#717171] focus-visible:ring-0 shadow-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={handleOpenVoiceModal}
                          className="h-11 w-11 rounded-full text-[#717171] hover:bg-[#F7F7F7] hover:text-[#222222] transition-all"
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="rounded-xl font-bold bg-[#222222] text-white py-2">Voice Search</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputValue.trim()}
                    className={cn(
                      "h-11 w-11 rounded-full transition-all duration-300",
                      inputValue.trim() 
                        ? "bg-[#222222] text-white hover:scale-105 shadow-md" 
                        : "bg-[#F7F7F7] text-[#DDDDDD] cursor-not-allowed"
                    )}
                  >
                    <Send className={cn("h-5 w-5 transition-transform", inputValue.trim() && "translate-x-0.5 -translate-y-0.5")} />
                  </Button>
                </div>
              </div>
            </form>
            <div className="flex items-center justify-center gap-2 mt-4">
              <AlertCircle className="w-3.5 h-3.5 text-[#717171]" />
              <p className="text-center text-[12px] font-medium text-[#717171]">
                AI-generated results can sometimes be inaccurate. Please verify critical details.
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoiceModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} onSendMessage={handleVoiceSend} />
    </div>
  )
}
