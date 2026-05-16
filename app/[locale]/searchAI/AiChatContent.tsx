"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/ai/header"
import { Sidebar } from "@/components/ai/sidebar"
import { ChatArea } from "@/components/ai/chat-area"
import { SettingsModal } from "@/components/ai/settings-modal"
import { useAiChat } from "@/hooks/useAiChat"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Settings, Conversation } from "@/types/ai"

export default function AiChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlSessionId = searchParams.get('session')
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    voiceOutput: false,
    language: "fr",
    responseMode: "detailed",
  })
  const [speechInitialized, setSpeechInitialized] = useState(false)

  const previousMessagesLengthRef = useRef(0)
  const speechQueueRef = useRef<string[]>([])
  const isSpeakingRef = useRef(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Accès refusé", {
        description: "Vous devez vous connecter pour accéder au chat IA",
      })
      router.push("/auth/login")
    }
  }, [authLoading, isAuthenticated, router])

  const {
    messages,
    isLoading,
    isTyping,
    error,
    sessionId,
    currentFilters,
    sendMessage,
    clearMessages,
    resetChat,
    loadSession,
  } = useAiChat({
    autoSave: true,
    sessionId: urlSessionId || undefined,
    onError: (err) => {
      toast.error("Erreur", {
        description: err.message || "Une erreur s'est produite",
      })
    },
  })

  const initializeSpeechSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window) || speechInitialized) return
    try {
      const utterance = new SpeechSynthesisUtterance('')
      utterance.volume = 0
      window.speechSynthesis.speak(utterance)
      setSpeechInitialized(true)
    } catch (error) {
      console.error('Failed to initialize speech synthesis:', error)
    }
  }, [speechInitialized])

  const speakMessage = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text || !voiceEnabled || !speechInitialized) return

    window.speechSynthesis.cancel()
    
    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = settings.language === "fr" ? "fr-FR" : "en-US"
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 1.0

        utterance.onstart = () => { isSpeakingRef.current = true }
        utterance.onend = () => {
          isSpeakingRef.current = false
          if (speechQueueRef.current.length > 0) {
            const nextText = speechQueueRef.current.shift()
            if (nextText) speakMessage(nextText)
          }
        }
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error || 'Unknown error')
          isSpeakingRef.current = false
          speechQueueRef.current = []
          if (event.error === 'not-allowed') {
            setVoiceEnabled(false)
            setSettings(prev => ({ ...prev, voiceOutput: false }))
            toast.error("Voix désactivée", {
              description: "Le navigateur a bloqué la synthèse vocale. Veuillez réactiver manuellement.",
            })
          }
        }

        if (isSpeakingRef.current) {
          speechQueueRef.current.push(text)
        } else {
          window.speechSynthesis.speak(utterance)
        }
      } catch (error) {
        console.error('Failed to speak message:', error)
        isSpeakingRef.current = false
        speechQueueRef.current = []
      }
    }, 100)
  }, [settings.language, voiceEnabled, speechInitialized])

  useEffect(() => {
    if (isAuthenticated) loadConversationsFromStorage()
  }, [isAuthenticated])

  useEffect(() => {
    if (conversations.length > 0 && isAuthenticated) {
      localStorage.setItem("ai-conversations", JSON.stringify(conversations))
    }
  }, [conversations, isAuthenticated])

  useEffect(() => {
    if (messages.length > 1) {
      setConversations(prev => {
        const currentConv = prev.find(c => c.id === sessionId)
        if (!currentConv) {
          const userMessage = messages.find(m => m.role === "user")
          const newConversation: Conversation = {
            id: sessionId,
            title: userMessage?.content.slice(0, 50) || "Nouvelle conversation",
            timestamp: new Date(),
            preview: userMessage?.content.slice(0, 100) || "",
            messageCount: messages.length,
          }
          return [newConversation, ...prev]
        }
        return prev.map(c =>
          c.id === sessionId ? { ...c, messageCount: messages.length, timestamp: new Date() } : c
        )
      })
    }
  }, [messages, sessionId])

  useEffect(() => {
    if (!settings.voiceOutput || !('speechSynthesis' in window) || !speechInitialized) {
      previousMessagesLengthRef.current = messages.length
      return
    }
    if (messages.length > previousMessagesLengthRef.current) {
      const newMessages = messages.slice(previousMessagesLengthRef.current)
      const newAssistantMessages = newMessages.filter(msg => msg.role === 'assistant')
      if (newAssistantMessages.length > 0) {
        const latest = newAssistantMessages[newAssistantMessages.length - 1]
        if (latest.content?.trim()) speakMessage(latest.content)
      }
    }
    previousMessagesLengthRef.current = messages.length
  }, [messages, settings.voiceOutput, speakMessage, speechInitialized])

  useEffect(() => {
    if (error) toast.error("Erreur", { description: error.message })
  }, [error])

  const loadConversationsFromStorage = () => {
    const saved = localStorage.getItem("ai-conversations")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConversations(parsed.map((conv: any) => ({ ...conv, timestamp: new Date(conv.timestamp) })))
      } catch (e) {
        console.error("Failed to load conversations:", e)
      }
    }
  }

  const handleSendMessage = useCallback(async (content: string) => {
    if (!isAuthenticated) {
      toast.error("Non authentifié", { description: "Vous devez vous connecter pour envoyer des messages" })
      return
    }
    try {
      if (!speechInitialized) initializeSpeechSynthesis()
      await sendMessage(content)
    } catch (err) {
      console.error("Failed to send message:", err)
      toast.error("Échec de l'envoi", { description: "Impossible d'envoyer le message. Veuillez réessayer." })
    }
  }, [sendMessage, speechInitialized, initializeSpeechSynthesis, isAuthenticated])

  const handleNewChat = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    isSpeakingRef.current = false
    speechQueueRef.current = []
    resetChat()
    setSidebarOpen(false)
    toast.success("Nouvelle conversation", { description: "Une nouvelle conversation a été créée" })
  }, [resetChat])

  const handleSelectConversation = useCallback((id: string) => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    isSpeakingRef.current = false
    speechQueueRef.current = []
    loadSession(id)
    setSidebarOpen(false)
    toast.success("Conversation chargée", { description: "La conversation a été chargée avec succès" })
  }, [loadSession])

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    localStorage.removeItem(`chat-session-${id}`)
    if (sessionId === id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      isSpeakingRef.current = false
      speechQueueRef.current = []
      resetChat()
    }
    toast.success("Conversation supprimée", { description: "La conversation a été supprimée avec succès" })
  }, [sessionId, resetChat])

  const handleVoiceInput = useCallback(() => {
    if (!speechInitialized) initializeSpeechSynthesis()
  }, [speechInitialized, initializeSpeechSynthesis])

  const handleToggleVoice = useCallback(() => {
    if (!voiceEnabled && !speechInitialized) initializeSpeechSynthesis()
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    setSettings(prev => ({ ...prev, voiceOutput: newValue }))
    if (!newValue && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      isSpeakingRef.current = false
      speechQueueRef.current = []
    }
    toast.success(newValue ? "Voix activée" : "Voix désactivée", {
      description: newValue ? "Les réponses seront lues à haute voix" : "Les réponses ne seront plus lues à haute voix",
    })
  }, [voiceEnabled, speechInitialized, initializeSpeechSynthesis])

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={sessionId}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          onOpenSettings={() => setSettingsOpen(true)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-hidden">
          <ChatArea
            messages={messages}
            isTyping={isTyping}
            isListening={false}
            isSpeaking={isSpeakingRef.current}
            onSendMessage={handleSendMessage}
            onVoiceInput={handleVoiceInput}
          />
        </main>
      </div>
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  )
}