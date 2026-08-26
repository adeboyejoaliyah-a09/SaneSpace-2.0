'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Keyboard, X } from 'lucide-react'
import { useSaneUser } from '@/hooks/useSaneUser'
import type { Message, Conversation } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = 'idle' | 'listening' | 'processing' | 'speaking'

// Web Speech API — cast to any since TS DOM types vary by tsconfig
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

type VoiceOption = { id: string; label: string; sub: string; provider: 'browser' | 'elevenlabs' }

// Curated calm/reassuring premade ElevenLabs voices. Kept small since the
// free tier is character-limited per month — only used when a user
// explicitly picks one; default stays the free on-device browser voice.
const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'browser', label: 'Default', sub: 'Free, on-device', provider: 'browser' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel', sub: 'Calm & warm', provider: 'elevenlabs' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella', sub: 'Soft & soothing', provider: 'elevenlabs' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni', sub: 'Gentle & reassuring', provider: 'elevenlabs' },
]

const VOICE_PREF_KEY = 'sane_voice_preference'

// Tiny silent WAV — used to unlock <audio> playback on iOS/mobile the same
// way the speechSynthesis primer unlocks browser TTS.
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10EAAAAAEAAQBAHwAAQB8AAAEACABkYXRhAAAAAA=='

// ─── Orb animation variants per status ───────────────────────────────────────

function useOrbAnimations(isUserSpeaking: boolean, isAISpeaking: boolean) {
  const glowAnimate = isUserSpeaking
    ? { scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }
    : isAISpeaking
    ? { scale: [1, 1.2, 0.95, 1.2, 1], opacity: [0.6, 0.95, 0.6] }
    : { scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }

  const glowTransition = isUserSpeaking
    ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const }
    : isAISpeaking
    ? { duration: 2, repeat: Infinity, ease: 'easeInOut' as const }
    : { duration: 3, repeat: Infinity, ease: 'easeInOut' as const }

  const orbAnimate = isUserSpeaking
    ? { scale: [1, 1.08, 1.02, 1.08, 1] }
    : isAISpeaking
    ? { scale: [1, 1.06, 0.97, 1.06, 1] }
    : { scale: [1, 1.03, 1] }

  const orbTransition = isUserSpeaking
    ? { duration: 0.8, repeat: Infinity }
    : isAISpeaking
    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const }
    : { duration: 4, repeat: Infinity, ease: 'easeInOut' as const }

  return { glowAnimate, glowTransition, orbAnimate, orbTransition }
}

// ─── Status copy ─────────────────────────────────────────────────────────────

const TITLE_COPY: Record<Status, string> = {
  idle: "I'm listening, {name}.",
  listening: "I'm listening, {name}.",
  processing: 'Let me think about that...',
  speaking: "Here's what I think...",
}

const SUBTITLE_COPY: Record<Status, string> = {
  idle: 'Take your time. This is your space to speak freely.',
  listening: 'Take your time. This is your space to speak freely.',
  processing: 'Processing your message...',
  speaking: 'Tap mic to interrupt anytime.',
}

// ─── Meditation figure ────────────────────────────────────────────────────────

function MeditationFigure() {
  return (
    <div className="fixed bottom-0 left-0 w-44 md:w-52 pointer-events-none select-none opacity-[0.13]">
      <svg viewBox="0 0 100 130" fill="none" style={{ color: '#0A7C6E' }}>
        <circle cx="50" cy="16" r="11" fill="currentColor" />
        <rect x="46" y="26" width="8" height="8" rx="2" fill="currentColor" />
        <path d="M28 48 Q50 36 72 48 L76 88 Q50 98 24 88 Z" fill="currentColor" />
        <path d="M28 58 Q16 68 22 80 Q32 86 40 82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M72 58 Q84 68 78 80 Q68 86 60 82" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M24 88 Q10 102 30 110 Q50 116 70 110 Q90 102 76 88" fill="currentColor" />
        <path d="M35 84 Q50 92 65 84" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VoicePage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [status, setStatus] = useState<Status>('listening')
  const [isMuted, setIsMuted] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [mounted, setMounted] = useState(true)
  const [isSupported, setIsSupported] = useState(true)
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')        // what the user said
  const [aiText, setAiText] = useState('')               // what the AI is saying
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [firstName, setFirstName] = useState('there')
  const [voiceId, setVoiceId] = useState('browser')

  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const recognitionRef = useRef<AnySpeechRecognition>(null)
  const isMutedRef = useRef(false)
  const isProcessingRef = useRef(false)        // prevents overlapping sends
  const messagesRef = useRef<Message[]>([])    // stable ref for async callbacks
  const voiceIdRef = useRef('browser')         // read at call-time, avoids stale closures
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)
  const conversationIdRef = useRef('')         // fresh id per session, set in beginSession

  // ── Load/save voice preference ───────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY)
      if (saved && VOICE_OPTIONS.some((v) => v.id === saved)) setVoiceId(saved)
    } catch {}
  }, [])

  useEffect(() => { voiceIdRef.current = voiceId }, [voiceId])

  // ── Resolve first name ───────────────────────────────────────────────────
  useEffect(() => {
    if (user?.firstName) { setFirstName(user.firstName); return }
    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      if (prefs.firstName) setFirstName(prefs.firstName as string)
    } catch {}
  }, [user?.firstName])

  // Keep messages ref in sync
  useEffect(() => { messagesRef.current = conversationMessages }, [conversationMessages])

  // ── Mount / unmount ──────────────────────────────────────────────────────
  // Feature-detect only here. Mic capture and recognition must start from a
  // direct user tap (see beginSession) — mobile browsers (and several desktop
  // ones) silently block getUserMedia/SpeechRecognition.start() when called
  // from a useEffect with no preceding gesture, which made this page look
  // completely unresponsive.
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) setIsSupported(false)

    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      window.speechSynthesis?.cancel()
      audioPlayerRef.current?.pause()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      audioContextRef.current?.close()
    }
  }, [])

  // ── Mute toggle side-effects ─────────────────────────────────────────────
  useEffect(() => {
    if (!started) return
    isMutedRef.current = isMuted
    if (isMuted) {
      recognitionRef.current?.stop()
      window.speechSynthesis?.cancel()
      audioPlayerRef.current?.pause()
      setIsAISpeaking(false)
      setIsUserSpeaking(false)
      setStatus('idle')
    } else {
      setStatus('listening')
      startRecognition()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted, started])

  // ── Web Audio amplitude (orb animation) ──────────────────────────────────
  // Throws on failure so beginSession can surface a clear error instead of
  // silently doing nothing.
  const startAmplitudeDetection = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    audioContextRef.current = ctx
    const analyser = ctx.createAnalyser()
    ctx.createMediaStreamSource(stream).connect(analyser)
    analyser.fftSize = 256
    const data = new Uint8Array(analyser.frequencyBinCount)
    if (ctx.state === 'suspended') await ctx.resume()
    const tick = () => {
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      if (!isMutedRef.current && !isProcessingRef.current) {
        setIsUserSpeaking(avg > 12)
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  // ── Unlock audio output — must run synchronously inside a click handler ──
  // Mobile browsers (and many desktop ones) require the FIRST speak()/play()
  // call to happen inside a direct user gesture or it's silently dropped.
  // Priming both paths here means later async calls (after a fetch response)
  // actually produce sound, whichever voice is selected.
  const unlockAudioOutput = () => {
    try {
      const synth = window.speechSynthesis
      const unlock = new SpeechSynthesisUtterance(' ')
      unlock.volume = 1
      synth.speak(unlock)
      synth.cancel()
    } catch { /* speechSynthesis unavailable */ }

    try {
      if (!audioPlayerRef.current) audioPlayerRef.current = new Audio()
      const a = audioPlayerRef.current
      a.muted = true
      a.src = SILENT_WAV
      a.play().then(() => { a.pause(); a.muted = false }).catch(() => { a.muted = false })
    } catch { /* HTMLAudioElement unavailable */ }
  }

  // ── Voice selection — itself a click, so safe to re-unlock here too ─────
  const selectVoice = (id: string) => {
    setVoiceId(id)
    try { localStorage.setItem(VOICE_PREF_KEY, id) } catch {}
    unlockAudioOutput()
  }

  // ── Begin session — must run inside a click handler (user gesture) ──────
  const beginSession = async () => {
    if (starting || started) return

    unlockAudioOutput()

    setStarting(true)
    setMicError(null)
    try {
      await startAmplitudeDetection()
      isMutedRef.current = false
      conversationIdRef.current = crypto.randomUUID()
      setConversationMessages([])
      setStatus('listening')
      startRecognition()
      setStarted(true)
    } catch {
      setMicError("We couldn't access your microphone. Check your browser/phone settings and allow microphone access for this site, then try again.")
    } finally {
      setStarting(false)
    }
  }

  // ── SpeechRecognition ────────────────────────────────────────────────────
  const startRecognition = useCallback(() => {
    if (isMutedRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    // Clean up previous instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }

    const recognition = new SR()
    recognition.continuous = false   // one utterance at a time is more reliable
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) final += t
        else interim += t
      }
      if (interim) setTranscript(interim)
      if (final) {
        setTranscript(final)
        sendToAI(final.trim())
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (e: any) => {
      const restartable = ['no-speech', 'aborted', 'network', 'language-not-supported']
      if (restartable.includes(e.error)) {
        if (!isMutedRef.current && !isProcessingRef.current) startRecognition()
      }
    }

    recognition.onend = () => {
      // Auto-restart when we're in listening state
      if (!isMutedRef.current && !isProcessingRef.current) {
        setTimeout(startRecognition, 200)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch { /* already started */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist to localStorage so it shows up in /chat's history ───────────
  const saveConversation = (msgs: Message[]) => {
    if (msgs.length === 0) return
    try {
      const stored: Conversation[] = JSON.parse(localStorage.getItem('sane_conversations') ?? '[]')
      const id = conversationIdRef.current
      const idx = stored.findIndex((c) => c.id === id)
      const firstUserMsg = msgs.find((m) => m.sender === 'user')
      const rawTitle = firstUserMsg?.content.trim() ?? 'Voice conversation'
      const title = '🎙️ ' + (rawTitle.length > 40 ? rawTitle.slice(0, 40) + '…' : rawTitle)
      const updated: Conversation = {
        id,
        userId: 'local',
        title,
        mode: 'voice',
        createdAt: stored[idx]?.createdAt ?? new Date().toISOString(),
        messages: msgs,
      }
      if (idx >= 0) stored[idx] = updated
      else stored.unshift(updated)
      localStorage.setItem('sane_conversations', JSON.stringify(stored))
    } catch {}
  }

  // ── Send transcript to /api/chat ─────────────────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text || isProcessingRef.current) return
    isProcessingRef.current = true

    recognitionRef.current?.stop()
    setIsUserSpeaking(false)
    setTranscript(text)
    setStatus('processing')

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId: conversationIdRef.current,
      sender: 'user',
      content: text,
      adaptiveMode: 'listening',
      timestamp: new Date().toISOString(),
    }

    const updatedMsgs = [...messagesRef.current, userMsg]
    setConversationMessages(updatedMsgs)
    saveConversation(updatedMsgs)

    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMsgs,
          specialisation: (prefs.specialisation as string) ?? '',
          languageProfile: (prefs.languageProfile as string) ?? 'Neutral / International',
          activeMode: 'listening',
          userName: firstName,
        }),
      })

      const data = await res.json() as { message: string }
      const reply = data.message

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversationId: conversationIdRef.current,
        sender: 'ai',
        content: reply,
        adaptiveMode: 'listening',
        timestamp: new Date().toISOString(),
      }
      const finalMsgs = [...updatedMsgs, aiMsg]
      setConversationMessages(finalMsgs)
      saveConversation(finalMsgs)

      await speak(reply)
    } catch (err) {
      console.error('Voice AI error:', err)
      await speak("I'm sorry, I had trouble connecting. Please try again.")
    } finally {
      isProcessingRef.current = false
      setTranscript('')
      if (!isMutedRef.current) {
        setStatus('listening')
        startRecognition()
      }
    }
  }, [firstName, startRecognition]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── SpeechSynthesis ──────────────────────────────────────────────────────
  const speakResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis
      synth.cancel()

      setStatus('speaking')
      setIsAISpeaking(true)
      setAiText(text)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Pick a good voice — getVoices() can return [] before the browser has
      // loaded its voice list, so fall back to whatever loads via the event.
      const pickVoice = (voices: SpeechSynthesisVoice[]) =>
        voices.find((v) => v.lang.startsWith('en') && v.name.includes('Female')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0]

      const initialVoices = synth.getVoices()
      if (initialVoices.length > 0) {
        const preferred = pickVoice(initialVoices)
        if (preferred) utterance.voice = preferred
      } else {
        synth.addEventListener('voiceschanged', () => {
          const preferred = pickVoice(synth.getVoices())
          if (preferred) utterance.voice = preferred
        }, { once: true })
      }

      utterance.onend = () => {
        setIsAISpeaking(false)
        setAiText('')
        resolve()
      }
      utterance.onerror = () => {
        setIsAISpeaking(false)
        setAiText('')
        resolve()
      }

      // Chrome bug: synthesis can stall — keep it alive
      const keepAlive = setInterval(() => {
        if (!synth.speaking) clearInterval(keepAlive)
        else { synth.pause(); synth.resume() }
      }, 10000)

      synth.speak(utterance)
    })
  }

  // ── ElevenLabs playback ──────────────────────────────────────────────────
  const speakWithElevenLabs = async (text: string, id: string): Promise<void> => {
    setStatus('speaking')
    setIsAISpeaking(true)
    setAiText(text)

    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: id }),
      })
      if (!res.ok) throw new Error('tts request failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (!audioPlayerRef.current) audioPlayerRef.current = new Audio()
      const audio = audioPlayerRef.current
      audio.muted = false
      audio.src = url

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve()
        audio.onerror = () => resolve()
        audio.play().catch(() => resolve())
      })
      URL.revokeObjectURL(url)
    } catch {
      // Free-tier quota hit, network issue, etc. — fall back to the
      // on-device voice so the session doesn't just go silent.
      await speakResponse(text)
      return
    } finally {
      setIsAISpeaking(false)
      setAiText('')
    }
  }

  // ── Dispatch to the selected voice provider ──────────────────────────────
  const speak = async (text: string): Promise<void> => {
    const opt = VOICE_OPTIONS.find((v) => v.id === voiceIdRef.current)
    if (opt && opt.provider === 'elevenlabs') {
      await speakWithElevenLabs(text, opt.id)
    } else {
      await speakResponse(text)
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleMute = () => setIsMuted((v) => !v)

  const handleExit = async () => {
    setMounted(false)
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    audioPlayerRef.current?.pause()
    await new Promise((r) => setTimeout(r, 280))
    router.push('/chat')
  }

  const changeVoice = () => {
    recognitionRef.current?.stop()
    window.speechSynthesis?.cancel()
    audioPlayerRef.current?.pause()
    setIsAISpeaking(false)
    setIsUserSpeaking(false)
    setStarted(false)
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const { glowAnimate, glowTransition, orbAnimate, orbTransition } =
    useOrbAnimations(isUserSpeaking && !isMuted, isAISpeaking)

  const titleText = TITLE_COPY[status].replace('{name}', firstName)

  // ── Render ───────────────────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#F5F7F5' }}>
        <span className="text-5xl mb-4">🎙️</span>
        <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: '#0A7C6E' }}>
          Voice not supported
        </h2>
        <p className="text-sm mb-6" style={{ color: '#6B7B7B' }}>
          Your browser doesn&apos;t support the Speech Recognition API.
          Try Chrome or Edge for the best experience.
        </p>
        <button
          onClick={() => router.push('/chat')}
          className="px-6 py-3 rounded-full border font-medium text-sm"
          style={{ borderColor: '#0A7C6E', color: '#0A7C6E' }}
        >
          Switch to Text Chat
        </button>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: '#F5F7F5' }}>
        <motion.div
          className="relative flex items-center justify-center mb-8"
          style={{ width: 180, height: 180 }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 180, height: 180,
              background: 'radial-gradient(circle, rgba(10,124,110,0.2) 0%, rgba(10,124,110,0.08) 50%, transparent 75%)',
            }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 100, height: 100,
              background: 'radial-gradient(circle at 40% 35%, #0D8C7E 0%, #0A7C6E 60%, #085E52 100%)',
              boxShadow: '0 20px 60px rgba(10,124,110,0.3)',
            }}
          />
          <Mic size={32} className="absolute text-white" />
        </motion.div>

        <h2 className="font-heading text-2xl font-bold mb-2" style={{ color: '#0A7C6E' }}>
          Ready when you are
        </h2>
        <p className="text-sm mb-1 max-w-xs" style={{ color: '#6B7B7B' }}>
          Tap below and allow microphone access to start talking with SaneSpace.
        </p>

        {/* Voice picker */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 max-w-sm">
          {VOICE_OPTIONS.map((opt) => {
            const selected = voiceId === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => selectVoice(opt.id)}
                className="px-4 py-2 rounded-full border text-left transition-colors"
                style={{
                  borderColor: selected ? '#0A7C6E' : '#E5E7EB',
                  backgroundColor: selected ? '#E8F5F3' : 'white',
                }}
              >
                <span className="block text-sm font-medium" style={{ color: '#0A7C6E' }}>
                  {opt.label}
                </span>
                <span className="block text-xs" style={{ color: '#6B7B7B' }}>
                  {opt.sub}
                </span>
              </button>
            )
          })}
        </div>

        {micError && (
          <p className="text-sm mt-3 mb-1 max-w-xs text-red-500">{micError}</p>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={beginSession}
          disabled={starting}
          className="mt-6 px-7 py-3.5 rounded-full font-medium text-sm text-white disabled:opacity-60"
          style={{ backgroundColor: '#0A7C6E' }}
        >
          {starting ? 'Requesting microphone…' : 'Tap to start talking'}
        </motion.button>

        <button
          onClick={() => router.push('/chat')}
          className="mt-4 flex items-center gap-2 font-medium text-sm"
          style={{ color: '#6B7B7B' }}
        >
          <Keyboard size={15} />
          Switch to Text Chat instead
        </button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: mounted ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: '#F5F7F5' }}
    >
      <MeditationFigure />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-6 md:px-8 h-16 shrink-0">
        <span className="font-heading font-bold text-2xl" style={{ color: '#0A7C6E' }}>
          SaneSpace
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={changeVoice}
            className="px-3 py-2.5 rounded-full border bg-white font-medium text-xs"
            style={{ borderColor: '#E5E7EB', color: '#6B7B7B' }}
          >
            Voice: {VOICE_OPTIONS.find((v) => v.id === voiceId)?.label ?? 'Default'}
          </button>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(10,124,110,0.15)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border bg-white font-medium text-sm"
            style={{ borderColor: '#0A7C6E', color: '#0A7C6E' }}
          >
            <X size={14} />
            Exit Voice Mode
          </motion.button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-36">

        {/* Title */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={`title-${status}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' as const }}
            className="font-heading font-bold text-3xl md:text-5xl text-center mb-3"
            style={{ color: '#0A7C6E' }}
          >
            {titleText}
          </motion.h1>
        </AnimatePresence>

        {/* Subtitle */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${status}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' as const }}
            className="text-base text-center max-w-xs mb-2"
            style={{ color: '#6B7B7B' }}
          >
            {SUBTITLE_COPY[status]}
          </motion.p>
        </AnimatePresence>

        {/* Transcript — what the user said / AI is saying */}
        <div className="h-8 flex items-center justify-center mb-1">
          <AnimatePresence mode="wait">
            {(transcript || aiText) && (
              <motion.p
                key={transcript || aiText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-sm text-center max-w-sm px-4 italic truncate"
                style={{ color: isAISpeaking ? '#0A7C6E' : '#9CA3AF' }}
              >
                {isAISpeaking ? `"${aiText.slice(0, 80)}${aiText.length > 80 ? '…' : ''}"` : transcript}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Orb ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 300, height: 300 }}
        >
          {/* Glow */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 300,
              height: 300,
              background:
                'radial-gradient(circle, rgba(10,124,110,0.25) 0%, rgba(10,124,110,0.10) 50%, transparent 75%)',
            }}
            animate={glowAnimate}
            transition={glowTransition}
          />

          {/* Small dot */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 8, height: 8,
              backgroundColor: '#0A7C6E',
              top: 28, left: '50%',
              transform: 'translateX(-50%)',
              opacity: 0.7,
            }}
            animate={{ y: [-3, 3, -3], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
          />

          {/* Main orb */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 180, height: 180,
              background:
                'radial-gradient(circle at 40% 35%, #0D8C7E 0%, #0A7C6E 60%, #085E52 100%)',
              boxShadow: '0 20px 60px rgba(10,124,110,0.35)',
            }}
            animate={orbAnimate}
            transition={orbTransition}
          />

          {/* Processing spinner ring */}
          <AnimatePresence>
            {status === 'processing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.3 },
                  rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' as const },
                }}
                className="absolute rounded-full border-2 border-transparent"
                style={{
                  width: 204, height: 204,
                  borderTopColor: 'rgba(10,124,110,0.5)',
                  borderRightColor: 'rgba(10,124,110,0.2)',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Mic button ── */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
          onClick={toggleMute}
          className="mt-8 flex items-center justify-center rounded-full"
          style={{
            width: 56, height: 56,
            backgroundColor: isMuted ? '#E8F5F3' : '#0A7C6E',
          }}
        >
          {isMuted
            ? <MicOff size={22} style={{ color: '#0A7C6E' }} />
            : <Mic size={22} className="text-white" />
          }
        </motion.button>

        <p
          className="mt-3 text-xs font-medium tracking-widest"
          style={{ letterSpacing: '0.15em', color: '#6B7B7B' }}
        >
          {isMuted ? 'TAP TO UNMUTE' : 'TAP TO MUTE'}
        </p>
      </div>

      {/* ── Bottom controls ── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex flex-col items-center pb-10 md:pb-12">
        <motion.button
          whileHover={{ x: 1 }}
          onClick={() => router.push('/chat')}
          className="flex items-center gap-2 font-medium text-base"
          style={{ color: '#0A7C6E' }}
        >
          <Keyboard size={18} />
          Switch to Text
        </motion.button>
        <p className="mt-3 text-sm" style={{ color: '#9CA3AF' }}>
          Encrypted and Private
        </p>
      </div>
    </motion.div>
  )
}
