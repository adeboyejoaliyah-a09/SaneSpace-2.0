'use client'

import { FormEvent, KeyboardEvent, RefObject } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUp,
  Brain,
  Compass,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Mic,
  Pause,
  Sparkles,
  Volume2,
  WifiOff,
} from 'lucide-react'
import type { Message } from '@/lib/types'
import ModeTag from './ModeTag'
import HumanHandoffCard from './HumanHandoffCard'

export type CompanionState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'processing'
  | 'muted'
  | 'offline'
  | 'error'

const stateCopy: Record<CompanionState, { label: string; detail: string }> = {
  idle: { label: 'Idle', detail: 'Ready when you are' },
  listening: { label: 'Listening', detail: 'Taking in your words' },
  thinking: { label: 'Thinking', detail: 'Making sense of the thread' },
  speaking: { label: 'Speaking', detail: 'Responding out loud' },
  processing: { label: 'Processing', detail: 'Preparing the next step' },
  muted: { label: 'Muted', detail: 'Microphone paused' },
  offline: { label: 'Offline', detail: 'Connection needs attention' },
  error: { label: 'Needs attention', detail: 'Something did not connect' },
}

const stateIcon: Record<CompanionState, typeof Sparkles> = {
  idle: Sparkles,
  listening: Mic,
  thinking: Brain,
  speaking: Volume2,
  processing: Loader2,
  muted: Pause,
  offline: WifiOff,
  error: WifiOff,
}

type CompanionAvatarProps = {
  state?: CompanionState
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarSize = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-36 w-36 md:h-44 md:w-44',
}

const iconSize = {
  sm: 15,
  md: 18,
  lg: 28,
  xl: 44,
}

export function CompanionAvatar({ state = 'idle', size = 'md', className = '' }: CompanionAvatarProps) {
  const reduceMotion = useReducedMotion()
  const Icon = stateIcon[state]
  const active = state === 'listening' || state === 'thinking' || state === 'speaking' || state === 'processing'

  return (
    <div className={`relative inline-flex items-center justify-center ${avatarSize[size]} ${className}`}>
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/15"
        animate={!reduceMotion && active ? { scale: [1, 1.12, 1], opacity: [0.45, 0.82, 0.45] } : undefined}
        transition={{ duration: state === 'listening' ? 1.2 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative flex h-[72%] w-[72%] items-center justify-center rounded-full border border-primary/20 bg-primary text-white shadow-[0_18px_48px_rgb(var(--tw-primary)/0.22)]"
        animate={!reduceMotion && active ? { scale: [1, 1.03, 1] } : undefined}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon size={iconSize[size]} aria-hidden="true" />
      </motion.div>
      <span className="sr-only">SaneSpace companion is {stateCopy[state].label.toLowerCase()}</span>
    </div>
  )
}

export function CompanionStatus({ state = 'idle', compact = false }: { state?: CompanionState; compact?: boolean }) {
  const copy = stateCopy[state]

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-[#111118] px-3 py-1.5 text-xs text-[#A7A7B3]">
      <span className={`h-2 w-2 rounded-full ${state === 'error' || state === 'offline' ? 'bg-red-500' : state === 'muted' ? 'bg-[#B8FF3D]' : 'bg-violet-500'}`} />
      <span className="font-semibold text-[#F5F5F7]">{copy.label}</span>
      {!compact && <span>{copy.detail}</span>}
    </div>
  )
}

export function CompanionIndicator({ state = 'idle', label }: { state?: CompanionState; label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#A7A7B3]">
      <CompanionAvatar state={state} size="sm" />
      <span>{label ?? stateCopy[state].detail}</span>
    </div>
  )
}

export function ThinkingIndicator({ label = 'SaneSpace is thinking' }: { label?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex items-center gap-3 rounded-full border border-violet-500/30 bg-[#111118] px-4 py-2 text-sm text-[#A7A7B3]" role="status" aria-live="polite">
      <CompanionAvatar state="thinking" size="sm" />
      <span>{label}</span>
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-violet-400"
            animate={!reduceMotion ? { opacity: [0.35, 1, 0.35] } : undefined}
            transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
          />
        ))}
      </span>
    </div>
  )
}

export function CompanionGreeting({
  name,
  suggestions,
  onSuggestion,
}: {
  name?: string | null
  suggestions: string[]
  onSuggestion: (text: string) => void
}) {
  return (
    <section className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <CompanionAvatar state="idle" size="lg" className="mb-5" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">SaneSpace companion</p>
      <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-[#F5F5F7] md:text-5xl">
        What are you figuring out{name ? `, ${name}` : ''}?
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-[#A7A7B3]">
        Talk to SaneSpace about whatever you&apos;re figuring out.
      </p>
      <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="min-h-20 rounded-2xl border border-border bg-[#111118] px-4 py-3 text-left text-sm font-medium text-[#F5F5F7] shadow-[0_8px_20px_rgba(124,58,237,0.08)] transition hover:border-violet-500/40 hover:bg-[#17171F] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#070708]"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </section>
  )
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatMessage({ message, isLatest = false }: { message: Message; isLatest?: boolean }) {
  const isUser = message.sender === 'user'
  const shouldShowHandoff =
    !isUser &&
    message.showHumanHandoff &&
    (message.riskLevel === 'high' || message.riskLevel === 'critical')

  if (!isUser && isLatest && !message.content) {
    return (
      <div className="flex justify-start">
        <ThinkingIndicator />
      </div>
    )
  }

  return (
    <article className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <CompanionAvatar state="idle" size="sm" className="mt-1 shrink-0" />}
      <div className={`min-w-0 ${isUser ? 'max-w-[86%] sm:max-w-[72%]' : 'max-w-[92%] sm:max-w-[76%]'}`}>
        <div
          className={
            isUser
              ? 'rounded-2xl bg-violet-600 px-4 py-3 text-sm leading-relaxed text-white shadow-[0_12px_30px_rgba(124,58,237,0.18)]'
              : 'rounded-2xl border border-border bg-[#111118] px-4 py-3 text-sm leading-7 text-[#F5F5F7]'
          }
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`mt-1 flex items-center gap-2 text-[11px] text-[#A7A7B3] ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && <ModeTag mode={message.adaptiveMode} size="small" />}
          <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
        </div>

        {!isUser && message.reasoning && (
          <details className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-gray-text">
            <summary className="cursor-pointer font-medium text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              How SaneSpace read the moment
            </summary>
            <div className="mt-3 grid gap-2">
              <p><span className="font-semibold text-dark">Intensity:</span> {message.reasoning.emotionalIntensity}</p>
              <p><span className="font-semibold text-dark">Pattern:</span> {message.reasoning.moodPattern}</p>
              <p><span className="font-semibold text-dark">Mode:</span> {message.reasoning.modeSelected}</p>
              <p><span className="font-semibold text-dark">Context:</span> {message.reasoning.memoryUsed}</p>
              {typeof message.riskScore === 'number' && (
                <p><span className="font-semibold text-dark">Safety check:</span> {message.riskLevel} ({message.riskScore.toFixed(2)})</p>
              )}
            </div>
          </details>
        )}

        {shouldShowHandoff && (
          <HumanHandoffCard riskLevel={message.riskLevel as 'high' | 'critical'} />
        )}
      </div>
    </article>
  )
}

export function ChatComposer({
  input,
  setInput,
  onSubmit,
  onVoice,
  disabled,
  isLoading,
  textareaRef,
}: {
  input: string
  setInput: (value: string) => void
  onSubmit: () => void
  onVoice: () => void
  disabled?: boolean
  isLoading?: boolean
  textareaRef?: RefObject<HTMLTextAreaElement>
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-border bg-[#111118] p-2 shadow-[0_12px_40px_rgba(124,58,237,0.08)]">
      <button
        type="button"
        onClick={onVoice}
        disabled={disabled}
        aria-label="Open voice mode"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[#17171F] text-[#A7A7B3] transition hover:border-violet-500/40 hover:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Mic size={19} />
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'Conversation paused for your safety.' : "What's on your mind?"}
        rows={1}
        disabled={disabled}
        aria-label="Message SaneSpace"
        className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm leading-relaxed text-[#F5F5F7] placeholder:text-[#A7A7B3] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!input.trim() || isLoading || disabled}
        aria-label={isLoading ? 'Sending message' : 'Send message'}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#111118] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
      </button>
    </form>
  )
}

export const companionModeOptions = [
  { id: 'listening', label: 'Listen', icon: HeartHandshake },
  { id: 'coach', label: 'Plan', icon: Compass },
  { id: 'explorer', label: 'Explore', icon: Sparkles },
  { id: 'companion', label: 'Talk', icon: MessageCircle },
] as const
