"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { X, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface VoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSendMessage: (message: string) => void
}

export function VoiceModal({ isOpen, onClose, onSendMessage }: VoiceModalProps) {
  const { isAuthenticated, user } = useAuth()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [interimText, setInterimText] = useState("")

  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef("")
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Play sound feedback
  const playSound = useCallback((frequency: number, duration: number) => {
    if (!soundEnabled) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }, [soundEnabled])

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      toast.error("Accès refusé", {
        description: "Vous devez vous connecter pour utiliser la saisie vocale",
      })
      onClose()
    }
  }, [isOpen, isAuthenticated, onClose])

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (!isAuthenticated) return

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("La reconnaissance vocale n'est pas supportée par votre navigateur")
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'fr-FR'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      playSound(800, 0.1) // Start sound
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
          playSound(600, 0.05) // Word recognized sound
        } else {
          interimTranscript += transcript
        }
      }

      finalTranscriptRef.current = finalTranscript
      setTranscript(finalTranscript)
      setInterimText(interimTranscript)

      // Reset silence timer whenever speech is detected
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
      setAutoSendCountdown(null)

      // Start new silence timer (3 seconds)
      if (finalTranscript.trim()) {
        silenceTimerRef.current = setTimeout(() => {
          startAutoSendCountdown()
        }, 3000)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)

      // Don't show error for no-speech if we already have transcript
      if (event.error === 'no-speech' && finalTranscriptRef.current.trim()) {
        return
      }

      // Ignore these errors silently
      if (['aborted', 'no-speech'].includes(event.error) && finalTranscriptRef.current.trim()) {
        return
      }

      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError("Permission microphone refusée. Veuillez autoriser l'accès au microphone.")
          playSound(300, 0.2) // Error sound
          break
        case 'network':
          setError("Erreur réseau lors de la reconnaissance vocale")
          playSound(300, 0.2)
          break
        case 'no-speech':
          // Only show if no transcript exists
          if (!finalTranscriptRef.current.trim()) {
            setError("Aucune parole détectée. Veuillez parler plus fort.")
          }
          break
        case 'aborted':
          // Ignore aborted errors
          break
        default:
          // Ignore other non-critical errors if we have transcript
          if (!finalTranscriptRef.current.trim()) {
            setError(`Erreur: ${event.error}`)
            playSound(300, 0.2)
          }
      }

      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)

      // Auto-restart if we were listening and no error occurred
      if (isListening && !error && isOpen && !isProcessing) {
        try {
          recognition.start()
        } catch (e) {
          // Ignore restart errors
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore stop errors
        }
      }
    }
  }, [isAuthenticated, playSound, isOpen, isProcessing])

  // Start auto-send countdown
  const startAutoSendCountdown = useCallback(() => {
    setAutoSendCountdown(3)
    playSound(700, 0.1) // Countdown start sound

    let count = 3
    countdownIntervalRef.current = setInterval(() => {
      count--
      setAutoSendCountdown(count)

      if (count > 0) {
        playSound(700, 0.05) // Tick sound
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
        }
        handleAutoSend()
      }
    }, 1000)
  }, [])

  // Handle auto-send
  const handleAutoSend = useCallback(() => {
    const finalText = finalTranscriptRef.current.trim()
    if (finalText) {
      setIsProcessing(true)
      stopListening()
      playSound(1000, 0.15) // Success sound

      setTimeout(() => {
        onSendMessage(finalText)
        onClose()
      }, 300)
    }
  }, [onSendMessage, onClose])

  // Start listening when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      const timer = setTimeout(() => {
        startListening()
      }, 300)
      return () => clearTimeout(timer)
    } else {
      stopListening()
      setTranscript("")
      setInterimText("")
      setIsProcessing(false)
      setError(null)
      setAutoSendCountdown(null)
      finalTranscriptRef.current = ""

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [isOpen, isAuthenticated])

  const startListening = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Non authentifié", {
        description: "Vous devez être connecté pour utiliser cette fonctionnalité",
      })
      return
    }

    if (recognitionRef.current && !isListening) {
      try {
        finalTranscriptRef.current = ""
        setTranscript("")
        setInterimText("")
        setError(null)
        setAutoSendCountdown(null)
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setError("Impossible de démarrer la reconnaissance vocale")
      }
    }
  }, [isListening, isAuthenticated])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error('Error stopping speech recognition:', error)
      }
    }
    setIsListening(false)

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setAutoSendCountdown(null)
  }, [isListening])

  const handleManualSend = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Non authentifié", {
        description: "Vous devez être connecté pour envoyer des messages",
      })
      return
    }

    const finalText = finalTranscriptRef.current.trim()
    if (finalText) {
      setIsProcessing(true)
      stopListening()
      playSound(1000, 0.15) // Success sound

      setTimeout(() => {
        onSendMessage(finalText)
        onClose()
      }, 300)
    }
  }, [onSendMessage, onClose, stopListening, isAuthenticated, playSound])

  const handleCancel = useCallback(() => {
    stopListening()
    setTranscript("")
    setInterimText("")
    setError(null)
    finalTranscriptRef.current = ""
    playSound(400, 0.1) // Cancel sound
    onClose()
  }, [onClose, stopListening, playSound])

  const toggleListening = useCallback(() => {
    if (!isAuthenticated) {
      toast.error("Non authentifié", {
        description: "Veuillez vous connecter pour utiliser cette fonctionnalité",
      })
      onClose()
      return
    }

    if (isListening) {
      stopListening()
      playSound(600, 0.1) // Stop sound
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening, isAuthenticated, onClose, playSound])

  const cancelAutoSend = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    setAutoSendCountdown(null)
    playSound(500, 0.1) // Cancel countdown sound
  }, [playSound])

  // Don't render if not authenticated
  if (!isAuthenticated || !isOpen) return null

  const displayText = transcript + (interimText ? ` ${interimText}` : '')

  return (
    <div className={cn("fixed inset-0 z-50 flex flex-col", "animate-in fade-in-0 duration-300")}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/95 to-primary/90">
        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full",
              "bg-gradient-radial from-accent/30 via-accent/10 to-transparent blur-3xl",
              "transition-all duration-1000 ease-out",
              isListening ? "scale-110 opacity-100" : "scale-90 opacity-60",
            )}
          />
          <div
            className={cn(
              "absolute left-1/2 top-1/3 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full",
              "bg-gradient-radial from-accent/20 via-transparent to-transparent blur-2xl",
              "transition-all duration-700 ease-out",
              isListening ? "scale-125 opacity-100" : "scale-100 opacity-40",
            )}
          />
        </div>
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex-1">
          {user && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden ring-2 ring-primary-foreground/20">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-primary-foreground">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-primary-foreground/90">
                  {user.name}
                </span>
                <p className="text-xs text-primary-foreground/60">Mode vocal</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-primary-foreground/80">
            {isProcessing
              ? "Envoi en cours..."
              : autoSendCountdown !== null
                ? `Envoi dans ${autoSendCountdown}s...`
                : isListening
                  ? "Écoute en cours..."
                  : "Prêt à écouter"}
          </span>
          {error && (
            <span className="text-xs text-red-300 mt-1 max-w-xs text-center">
              {error}
            </span>
          )}
        </div>
        <div className="flex flex-1 justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-10 w-10 rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            <span className="sr-only">{soundEnabled ? "Désactiver le son" : "Activer le son"}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-10 w-10 rounded-full text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        {/* Voice visualization */}
        <div className="relative mb-12">
          {/* Countdown ring */}
          {autoSendCountdown !== null && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <svg className="h-40 w-40 -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-primary-foreground/20"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - autoSendCountdown / 3)}`}
                  className="text-accent transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Outer rings */}
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "border-1 border-primary-foreground/10 transition-all duration-500",
              isListening && "animate-[ping_2s_ease-out_infinite] opacity-30",
            )}
          />
          <div
            className={cn(
              "absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "border-1 border-primary-foreground/20 transition-all duration-500",
              isListening && "animate-[ping_2s_ease-out_0.5s_infinite] opacity-40",
            )}
          />

          {/* Waveform circle */}
          <div
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full",
              "bg-gradient-to-br from-accent to-accent/80 -2xl",
              "transition-all duration-300 ring-4 ring-primary-foreground/10",
              isListening ? "scale-100" : "scale-95",
              error && "bg-destructive/80",
              autoSendCountdown !== null && "ring-accent/50 ring-8",
            )}
          >
            {autoSendCountdown !== null ? (
              <span className="text-4xl font-bold text-accent-foreground animate-pulse">
                {autoSendCountdown}
              </span>
            ) : isListening ? (
              <WaveformBars className="h-12 w-12" />
            ) : error ? (
              <MicOff className="h-10 w-10 text-accent-foreground" />
            ) : (
              <Mic className="h-10 w-10 text-accent-foreground" />
            )}
          </div>
        </div>

        {/* Transcript display */}
        <div className="min-h-[120px] w-full max-w-2xl px-4">
          {displayText ? (
            <div className="space-y-2">
              <p
                className={cn(
                  "text-xl font-medium text-primary-foreground sm:text-2xl text-center",
                  "animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                )}
              >
                {transcript}
                {interimText && (
                  <span className="text-primary-foreground/60 italic"> {interimText}</span>
                )}
              </p>
              {transcript.trim() && (
                <p className="text-sm text-primary-foreground/60 text-center">
                  {transcript.trim().split(' ').length} mot{transcript.trim().split(' ').length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : error ? (
            <p className="text-lg text-red-300 text-center">
              {error}
            </p>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-lg text-primary-foreground/60">
                Dites quelque chose comme :
              </p>
              <p className="text-base text-primary-foreground/80 italic">
                &ldquo;Je cherche une villa avec piscine à Yaoundé&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <footer className="relative px-6 pb-10 pt-6">
        <div className="flex items-center justify-center gap-6">
          {/* Cancel button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className={cn(
              "h-14 w-14 rounded-full",
              "bg-primary-foreground/10 text-primary-foreground",
              "hover:bg-primary-foreground/20 transition-all duration-200",
              "hover:scale-105 active:scale-95",
            )}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Annuler</span>
          </Button>

          {/* Main mic toggle button */}
          <Button
            size="icon"
            onClick={autoSendCountdown !== null ? cancelAutoSend : toggleListening}
            disabled={isProcessing || !!error}
            className={cn(
              "h-20 w-20 rounded-full -xl transition-all duration-300",
              "hover:scale-105 active:scale-95",
              autoSendCountdown !== null
                ? "bg-amber-500 text-amber-50 hover:bg-amber-600"
                : isListening
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-105"
                  : error
                    ? "bg-destructive/80 text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary-foreground text-primary hover:bg-primary-foreground/90",
            )}
          >
            {autoSendCountdown !== null ? (
              <X className="h-8 w-8" />
            ) : isListening ? (
              <MicOff className="h-8 w-8" />
            ) : error ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
            <span className="sr-only">
              {autoSendCountdown !== null
                ? "Annuler l'envoi automatique"
                : isListening
                  ? "Arrêter l'écoute"
                  : error
                    ? "Microphone désactivé"
                    : "Commencer l'écoute"}
            </span>
          </Button>

          {/* Send button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleManualSend}
            disabled={!transcript.trim() || isProcessing || !!error || autoSendCountdown !== null}
            className={cn(
              "h-14 w-14 rounded-full transition-all duration-200",
              "hover:scale-105 active:scale-95",
              transcript.trim() && !error && autoSendCountdown === null
                ? "bg-muted text-accent-foreground hover:bg-muted/90 -lg"
                : "bg-primary-foreground/10 text-primary-foreground/40",
            )}
          >
            <Send className="h-6 w-6" />
            <span className="sr-only">Envoyer maintenant</span>
          </Button>
        </div>

        {/* Hint text */}
        <p className="mt-6 text-center text-sm text-primary-foreground/50">
          {error
            ? "Vérifiez les permissions du microphone"
            : autoSendCountdown !== null
              ? "Appuyez sur le micro pour annuler l'envoi automatique"
              : isListening
                ? "Parlez maintenant... (envoi auto après 3s de silence)"
                : "Appuyez sur le micro pour commencer"
          }
        </p>
      </footer>
    </div>
  )
}

function WaveformBars({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-muted-foreground animate-voice-bar"
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}