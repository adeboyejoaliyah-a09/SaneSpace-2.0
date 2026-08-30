'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Keyboard, Mic, MicOff, Phone, Settings, Volume2, VolumeX, X } from 'lucide-react'
import { CompanionAvatar, CompanionState, CompanionStatus } from '@/components/ui/Companion'
import { useSaneUser } from '@/hooks/useSaneUser'
import type { Conversation, Message } from '@/lib/types'

type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'muted' | 'error'
type AnySpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: unknown) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort?: () => void
}
type VoiceOption = { id: string; label: string; sub: string; provider: 'browser' | 'elevenlabs' }

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'browser', label: 'Default', sub: 'On-device browser voice', provider: 'browser' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel', sub: 'Calm and warm', provider: 'elevenlabs' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella', sub: 'Soft and steady', provider: 'elevenlabs' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni', sub: 'Grounded and clear', provider: 'elevenlabs' },
]

const VOICE_PREF_KEY = 'sane_voice_preference'
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10EAAAAAEAAQBAHwAAQB8AAAEACABkYXRhAAAAAA=='

const statusText: Record<VoiceStatus, { title: string; detail: string; companionState: CompanionState }> = {
  idle: {
    title: 'Talk to your SaneSpace companion.',
    detail: 'Start when you are ready. You can pause or switch back to text anytime.',
    companionState: 'idle',
  },
  listening: {
    title: 'I am listening.',
    detail: 'Speak naturally. SaneSpace will wait for a finished thought.',
    companionState: 'listening',
  },
  thinking: {
    title: 'Let me think that through.',
    detail: 'SaneSpace is connecting your words with the conversation context.',
    companionState: 'thinking',
  },
  speaking: {
    title: 'SaneSpace is speaking.',
    detail: 'You can mute or end the session at any time.',
    companionState: 'speaking',
  },
  muted: {
    title: 'Microphone paused.',
    detail: 'Unmute when you want to continue.',
    companionState: 'muted',
  },
  error: {
    title: 'Voice needs attention.',
    detail: 'Check microphone permission or connection, then try again.',
    companionState: 'error',
  },
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as { SpeechRecognition?: new () => AnySpeechRecognition }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => AnySpeechRecognition }).webkitSpeechRecognition ||
    null
  )
}

function buildVoiceTitle(messages: Message[]) {
  const firstUserMsg = messages.find((message) => message.sender === 'user')
  const rawTitle = firstUserMsg?.content.trim() || 'Voice conversation'
  return rawTitle.length > 48 ? `${rawTitle.slice(0, 48)}...` : rawTitle
}

function VoiceWaveform({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex h-14 items-center justify-center gap-1.5" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          className="w-1.5 rounded-full bg-primary/70"
          initial={{ height: 10 }}
          animate={!reduceMotion && active ? { height: [10, 26 + (index % 5) * 6, 12] } : { height: 10 + (index % 4) * 4 }}
          transition={{ duration: 0.9 + (index % 4) * 0.1, repeat: active ? Infinity : 0, ease: 'easeInOut', delay: index * 0.03 }}
        />
      ))}
    </div>
  )
}

export default function VoicePage() {
  const router = useRouter()
  const { user } = useSaneUser()
  const reduceMotion = useReducedMotion()

  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [micError, setMicError] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [aiText, setAiText] = useState('')
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [firstName, setFirstName] = useState('there')
  const [voiceId, setVoiceId] = useState('browser')
  const [voicePickerOpen, setVoicePickerOpen] = useState(false)
  const [volumeEnabled, setVolumeEnabled] = useState(true)
  const [level, setLevel] = useState(0)

  const recognitionRef = useRef<AnySpeechRecognition | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const isMutedRef = useRef(false)
  const isProcessingRef = useRef(false)
  const messagesRef = useRef<Message[]>([])
  const voiceIdRef = useRef('browser')
  const conversationIdRef = useRef('')
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    try {
      recognition.stop()
    } catch {}
    try {
      recognition.abort?.()
    } catch {}
    recognitionRef.current = null
  }, [])

  const stopAudioPlayback = useCallback(() => {
    window.speechSynthesis?.cancel()
    const audio = audioPlayerRef.current
    if (audio) {
      audio.pause()
      audio.removeAttribute('src')
      audio.onended = null
      audio.onerror = null
      audio.load()
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setAiText('')
  }, [])

  const stopMicResources = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    mediaStreamRef.current = null
    void audioContextRef.current?.close().catch(() => undefined)
    audioContextRef.current = null
    setLevel(0)
  }, [])

  const cleanupVoiceSession = useCallback(() => {
    isMutedRef.current = true
    isProcessingRef.current = false
    stopRecognition()
    stopAudioPlayback()
    stopMicResources()
  }, [stopAudioPlayback, stopMicResources, stopRecognition])

  useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognition()) && Boolean(navigator.mediaDevices?.getUserMedia))
    return cleanupVoiceSession
  }, [cleanupVoiceSession])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY)
      if (saved && VOICE_OPTIONS.some((voice) => voice.id === saved)) setVoiceId(saved)
    } catch {}
  }, [])

  useEffect(() => {
    voiceIdRef.current = voiceId
  }, [voiceId])

  useEffect(() => {
    messagesRef.current = conversationMessages
  }, [conversationMessages])

  useEffect(() => {
    if (user?.firstName) {
      setFirstName(user.firstName)
      return
    }

    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      if (typeof prefs.firstName === 'string' && prefs.firstName.trim()) setFirstName(prefs.firstName.trim())
    } catch {}
  }, [user?.firstName])

  const startAmplitudeDetection = async () => {
    stopMicResources()
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream
    const ctx = new AudioContext()
    audioContextRef.current = ctx
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    ctx.createMediaStreamSource(stream).connect(analyser)
    if (ctx.state === 'suspended') await ctx.resume()

    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((sum, value) => sum + value, 0) / data.length
      setLevel(avg)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const unlockAudioOutput = () => {
    try {
      const unlock = new SpeechSynthesisUtterance(' ')
      unlock.volume = 1
      window.speechSynthesis.speak(unlock)
      window.speechSynthesis.cancel()
    } catch {}

    try {
      if (!audioPlayerRef.current) audioPlayerRef.current = new Audio()
      const audio = audioPlayerRef.current
      audio.muted = true
      audio.src = SILENT_WAV
      void audio.play().then(() => {
        audio.pause()
        audio.muted = false
      }).catch(() => {
        audio.muted = false
      })
    } catch {}
  }

  const saveConversation = (messages: Message[]) => {
    if (messages.length === 0) return

    try {
      const stored: Conversation[] = JSON.parse(localStorage.getItem('sane_conversations') ?? '[]')
      const id = conversationIdRef.current
      const idx = stored.findIndex((conversation) => conversation.id === id)
      const updated: Conversation = {
        id,
        userId: 'local',
        title: buildVoiceTitle(messages),
        mode: 'voice',
        createdAt: stored[idx]?.createdAt ?? new Date().toISOString(),
        messages,
      }
      if (idx >= 0) stored[idx] = updated
      else stored.unshift(updated)
      localStorage.setItem('sane_conversations', JSON.stringify(stored))
    } catch {}
  }

  const speakResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!volumeEnabled) {
        resolve()
        return
      }

      stopAudioPlayback()
      setStatus('speaking')
      setAiText(text)

      const synth = window.speechSynthesis
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1
      utterance.volume = 1

      const pickVoice = (voices: SpeechSynthesisVoice[]) =>
        voices.find((voice) => voice.lang.startsWith('en') && voice.name.includes('Female')) ||
        voices.find((voice) => voice.lang.startsWith('en')) ||
        voices[0]

      const voices = synth.getVoices()
      if (voices.length > 0) {
        const preferred = pickVoice(voices)
        if (preferred) utterance.voice = preferred
      } else {
        synth.addEventListener('voiceschanged', () => {
          const preferred = pickVoice(synth.getVoices())
          if (preferred) utterance.voice = preferred
        }, { once: true })
      }

      let keepAlive: ReturnType<typeof setInterval> | null = setInterval(() => {
        if (!synth.speaking && keepAlive) {
          clearInterval(keepAlive)
          keepAlive = null
        } else {
          synth.pause()
          synth.resume()
        }
      }, 10000)

      const finish = () => {
        if (keepAlive) clearInterval(keepAlive)
        setAiText('')
        resolve()
      }

      utterance.onend = finish
      utterance.onerror = finish
      synth.speak(utterance)
    })
  }

  const speakWithElevenLabs = async (text: string, id: string): Promise<void> => {
    if (!volumeEnabled) return

    stopAudioPlayback()
    setStatus('speaking')
    setAiText(text)

    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: id }),
      })
      if (!response.ok) throw new Error('TTS unavailable')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url
      if (!audioPlayerRef.current) audioPlayerRef.current = new Audio()
      const audio = audioPlayerRef.current
      audio.muted = false
      audio.src = url

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
    } catch {
      await speakResponse(text)
    } finally {
      stopAudioPlayback()
    }
  }

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      setStatus('speaking')
    }
  }, [setStatus])

  const sendToAI = useCallback(async (inputText: string) => {
    const text = inputText.trim()
    if (!text) return

    setStatus('thinking')
    setError(null)
    setMicError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to send your message.')
      }

      if (payload?.reply) {
        await speak(payload.reply)
      }

      setStatus('idle')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      setMicError(message)
      setStatus('error')
    }
  }, [speak])

  const startRecognition = useCallback(() => {
    const Recognition = getSpeechRecognition()
    if (!Recognition) {
      setMicError('Speech recognition is not available in this browser.')
      setStatus('error')
      return
    }

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: unknown) => {
      const resultEvent = event as {
        results?: ArrayLike<ArrayLike<{ transcript?: string }>>
      }

      if (!resultEvent.results || resultEvent.results.length === 0) return

      const latest = resultEvent.results[resultEvent.results.length - 1]
      const text = latest?.[0]?.transcript ?? ''
      if (text.trim()) {
        setTranscript(text.trim())
      }
    }

    recognition.onerror = (event: { error?: string }) => {
      const message =
        event?.error === 'not-allowed'
          ? 'Microphone permission was denied.'
          : 'Speech recognition is unavailable right now.'

      setMicError(message)
      setError(message)
      setStatus('error')
    }

    recognition.onend = () => {
      if (!isMutedRef.current && isMountedRef.current && !isProcessingRef.current) {
        startRecognition()
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setMicError('The microphone is already in use. Please try again.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!isMountedRef.current) return
    if (status === 'idle' || status === 'error') return
  }, [status])

  const beginSession = async () => {
    if (starting || started) return

    unlockAudioOutput()
    setStarting(true)
    setMicError('')
    isMutedRef.current = false
    setIsMuted(false)

    try {
      await startAmplitudeDetection()
      conversationIdRef.current = crypto.randomUUID()
      setConversationMessages([])
      setStarted(true)
      setStatus('listening')
      startRecognition()
    } catch {
      cleanupVoiceSession()
      setMicError('We could not access your microphone. Allow microphone access for this site, then try again.')
      setStatus('error')
    } finally {
      setStarting(false)
    }
  }

  const toggleMute = () => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    isMutedRef.current = nextMuted

    if (nextMuted) {
      stopRecognition()
      stopAudioPlayback()
      setStatus('muted')
    } else {
      setMicError('')
      setStatus('listening')
      startRecognition()
    }
  }

  const toggleVolume = () => {
    const next = !volumeEnabled
    setVolumeEnabled(next)
    if (!next) stopAudioPlayback()
  }

  const selectVoice = (id: string) => {
    setVoiceId(id)
    try {
      localStorage.setItem(VOICE_PREF_KEY, id)
    } catch {}
    unlockAudioOutput()
  }

  const handleExit = () => {
    cleanupVoiceSession()
    router.push('/chat')
  }

  const current = statusText[status]
  const selectedVoice = VOICE_OPTIONS.find((voice) => voice.id === voiceId)?.label ?? 'Default'
  const visualActive = status === 'listening' ? level > 12 : status === 'speaking' || status === 'thinking'

  if (!isSupported) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-6 text-center text-dark">
        <CompanionAvatar state="offline" size="lg" className="mb-5" />
        <h1 className="font-heading text-3xl font-bold">Voice is not supported here.</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-text">
          Your browser does not support the microphone and speech recognition features SaneSpace needs for voice mode.
        </p>
        <button
          type="button"
          onClick={() => router.push('/chat')}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Keyboard size={16} />
          Switch to text chat
        </button>
      </main>
    )
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col overflow-hidden bg-bg-base text-dark"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur md:px-8">
        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-text transition hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">Back to chat</span>
        </button>

        <div className="flex items-center gap-2">
          <CompanionStatus state={current.companionState} compact />
          <button
            type="button"
            onClick={() => setVoicePickerOpen((open) => !open)}
            aria-expanded={voicePickerOpen}
            className="hidden items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-gray-text transition hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary sm:inline-flex"
          >
            <Settings size={15} />
            {selectedVoice}
          </button>
        </div>

        <button
          type="button"
          onClick={handleExit}
          aria-label="End voice mode"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-primary transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <X size={18} />
        </button>
      </header>

      <AnimatePresence>
        {voicePickerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-3 grid w-[calc(100%-2rem)] max-w-2xl grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-2 shadow-lg sm:grid-cols-4"
          >
            {VOICE_OPTIONS.map((voice) => {
              const selected = voice.id === voiceId
              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => selectVoice(voice.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${
                    selected ? 'border-primary bg-primary-light text-primary' : 'border-border text-gray-text hover:bg-bg-base'
                  }`}
                  aria-pressed={selected}
                >
                  <span className="block text-sm font-semibold">{voice.label}</span>
                  <span className="block text-xs">{voice.sub}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center" aria-live="polite">
        <motion.div
          className="relative mb-8 flex h-60 w-60 items-center justify-center md:h-72 md:w-72"
          animate={!reduceMotion && visualActive ? { scale: [1, 1.02, 1] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-full border border-primary/15" />
          <div className="absolute inset-8 rounded-full border border-accent/15" />
          <CompanionAvatar state={current.companionState} size="xl" />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Voice companion
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold leading-tight md:text-5xl">
              {status === 'listening' && firstName !== 'there' ? `${firstName}, ${current.title.toLowerCase()}` : current.title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-text md:text-base">
              {micError || current.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        <VoiceWaveform active={visualActive} />

        <div className="mt-2 flex min-h-12 max-w-xl items-center justify-center px-4">
          {(transcript || aiText) && (
            <p className="line-clamp-2 text-sm italic leading-relaxed text-gray-text">
              {aiText ? aiText : transcript}
            </p>
          )}
        </div>

        {!started ? (
          <button
            type="button"
            onClick={beginSession}
            disabled={starting}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_36px_rgb(var(--tw-primary)/0.22)] transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {starting ? <Mic size={17} className="animate-pulse" /> : <Mic size={17} />}
            {starting ? 'Requesting microphone' : 'Start voice session'}
          </button>
        ) : (
          <div className="mt-6 flex w-full max-w-sm items-center justify-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              className={`flex h-14 w-14 items-center justify-center rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-primary ${
                isMuted ? 'border-primary/30 bg-primary-light text-primary' : 'border-primary bg-primary text-white'
              }`}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
              type="button"
              onClick={toggleVolume}
              aria-label={volumeEnabled ? 'Mute voice output' : 'Unmute voice output'}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface text-gray-text transition hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {volumeEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
            <button
              type="button"
              onClick={handleExit}
              aria-label="End voice session"
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-600 transition hover:bg-red-500/15 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <Phone size={22} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleExit}
          className="mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-gray-text transition hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <Keyboard size={16} />
          Switch to text
        </button>
      </section>
    </motion.main>
  )
}
