'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Mic, PanelLeft, Plus, RotateCcw } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import CrisisStatusIndicator from '@/components/ui/CrisisStatusIndicator'
import ModeTag from '@/components/ui/ModeTag'
import {
  ChatComposer,
  ChatMessage,
  CompanionGreeting,
  CompanionIndicator,
  CompanionStatus,
  companionModeOptions,
} from '@/components/ui/Companion'
import { useSaneUser } from '@/hooks/useSaneUser'
import type { Conversation, Message } from '@/lib/types'
import type { CrisisTier, CrisisAssessment } from '@/lib/crisisDetection'
import type { MemoryExtractionResult } from '@/lib/memoryExtraction'
import type { RiskLevel, RiskResult } from '@/lib/riskClassifier'

type AdaptiveMode = 'listening' | 'coach' | 'explorer' | 'companion' | 'care'

type CrisisEventMetadata = {
  eventType: string
  riskLevel: RiskLevel
  riskScore: number
  matchedSignals: string[]
  hashedExcerpt: string
  createdAt: string
}

const SUGGESTIONS = [
  'Help me plan my week',
  'I need to think through a decision',
  'Help me get unstuck',
]

const VALID_MODES: AdaptiveMode[] = ['listening', 'coach', 'explorer', 'companion', 'care']

function toAdaptiveMode(value: string): AdaptiveMode {
  return (VALID_MODES as string[]).includes(value) ? (value as AdaptiveMode) : 'listening'
}

function getDateLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatConvDate(iso: string): string {
  const date = new Date(iso)
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(messages: Message[]) {
  const groups: { label: string; messages: Message[] }[] = []
  let currentKey = ''

  messages.forEach((message) => {
    const key = new Date(message.timestamp).toDateString()
    if (key !== currentKey) {
      currentKey = key
      groups.push({ label: getDateLabel(message.timestamp), messages: [message] })
    } else {
      groups[groups.length - 1].messages.push(message)
    }
  })

  return groups
}

function generateTitle(messages: Message[]): string {
  const first = messages.find((message) => message.sender === 'user')
  if (!first) return 'New conversation'
  const content = first.content.trim()
  return content.length > 48 ? `${content.slice(0, 48)}...` : content
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMode, setActiveMode] = useState<AdaptiveMode>('listening')
  const [showMobileConvs, setShowMobileConvs] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('New conversation')
  const [crisisTier, setCrisisTier] = useState<CrisisTier>('safe')
  const [hardStop, setHardStop] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastFailedText, setLastFailedText] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const storedTier = localStorage.getItem('sane_crisis_tier')
      if (storedTier === 'safe' || storedTier === 'monitor' || storedTier === 'escalate' || storedTier === 'stop') {
        setCrisisTier(storedTier)
      }
    } catch {}

    void (async () => {
      try {
        const response = await fetch('/api/conversations', { cache: 'no-store' })
        if (!response.ok) throw new Error('Unable to load conversations')
        const data = await response.json() as { conversations: Conversation[] }
        if (data.conversations.length > 0) {
          const first = data.conversations[0]
          setConversations(data.conversations)
          setActiveConvId(first.id)
          setMessages(first.messages)
          setTitleValue(first.title)
        } else {
          await createConversation(true)
        }
      } catch {
        setErrorMessage('Unable to load your conversations right now.')
      }

      try {
        const prefilled = localStorage.getItem('sane_prefilled_message')
        if (prefilled) {
          setInput(prefilled)
          localStorage.removeItem('sane_prefilled_message')
        }
      } catch {}
    })()
    // The initial load intentionally runs once for the authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`
  }, [input])

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  useEffect(() => {
    const conv = conversations.find((conversation) => conversation.id === activeConvId)
    if (conv) setTitleValue(conv.title)
  }, [activeConvId, conversations])

  const firstName = user?.firstName || null

  const createConversation = async (replace = false) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'text' }),
      })
      if (!response.ok) throw new Error('Unable to create conversation')
      const data = await response.json() as { conversation: Conversation }
      const next = replace ? [data.conversation] : [data.conversation, ...conversations]
      setConversations(next)
      setActiveConvId(data.conversation.id)
      setMessages([])
      setTitleValue(data.conversation.title)
    } catch {
      setErrorMessage('Unable to start a new conversation right now.')
      return
    }

    setErrorMessage('')
    setLastFailedText('')
    setShowMobileConvs(false)
  }

  const saveConversation = async (nextMessages: Message[], convId = activeConvId) => {
    try {
      const response = await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: generateTitle(nextMessages), messages: nextMessages }),
      })
      if (!response.ok) throw new Error('Unable to save conversation')
      const data = await response.json() as { conversation: Conversation }
      setConversations((current) => current.map((conversation) => conversation.id === convId ? data.conversation : conversation))
    } catch {}
  }

  const loadConversation = (conversation: Conversation) => {
    setActiveConvId(conversation.id)
    setMessages(conversation.messages)
    setTitleValue(conversation.title)
    setErrorMessage('')
    setLastFailedText('')
    setShowMobileConvs(false)
  }

  const handleTitleSave = async () => {
    setIsEditingTitle(false)
    const title = titleValue.trim() || 'New conversation'
    setTitleValue(title)

    try {
      const response = await fetch(`/api/conversations/${activeConvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (!response.ok) throw new Error('Unable to save title')
      const data = await response.json() as { conversation: Conversation }
      setConversations((current) => current.map((conversation) => conversation.id === activeConvId ? data.conversation : conversation))
    } catch {}
  }

  const updateMemoryConfidence = (userMessage: string) => {
    const patterns = [
      { key: 'academic', label: 'Academic stress', keywords: ['exam', 'cgpa', 'assignment', 'lecture', 'carry-over', 'school', 'test'] },
      { key: 'financial', label: 'Financial pressure', keywords: ['money', 'broke', 'fees', 'allowance', 'feeding', 'cash'] },
      { key: 'relationship', label: 'Relationship stress', keywords: ['boyfriend', 'girlfriend', 'family', 'friend', 'mum', 'dad'] },
      { key: 'work', label: 'Work pressure', keywords: ['work', 'boss', 'job', 'office', 'deadline', 'career'] },
      { key: 'selfworth', label: 'Self-worth', keywords: ['not good enough', 'failure', 'useless', 'why am i', 'hate myself'] },
    ]

    const msg = userMessage.toLowerCase()

    try {
      const existing = JSON.parse(localStorage.getItem('sane_memory_confidence') || '{}')
      patterns.forEach((pattern) => {
        if (pattern.keywords.some((keyword) => msg.includes(keyword))) {
          existing[pattern.key] = {
            label: pattern.label,
            score: Math.min((existing[pattern.key]?.score || 30) + 8, 95),
            lastSeen: new Date().toISOString(),
          }
        }
      })
      localStorage.setItem('sane_memory_confidence', JSON.stringify(existing))
    } catch {}
  }

  const saveCrisisEvent = (event?: CrisisEventMetadata | null) => {
    if (!event) return

    try {
      const existing = JSON.parse(localStorage.getItem('sane_crisis_events') ?? '[]') as CrisisEventMetadata[]
      localStorage.setItem('sane_crisis_events', JSON.stringify([event, ...existing].slice(0, 20)))
    } catch {}
  }

  const requestAIResponse = async (nextMessages: Message[], textForRetry: string) => {
    setIsLoading(true)
    setErrorMessage('')
    setLastFailedText('')

    try {
      const profileResponse = await fetch('/api/profile', { cache: 'no-store' })
      const profileData = profileResponse.ok
        ? await profileResponse.json() as { profile?: { specialisation?: string | null; languageProfile?: string | null; firstName?: string | null } }
        : {}
      const profile = profileData.profile
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          specialisation: profile?.specialisation ?? '',
          languageProfile: profile?.languageProfile ?? 'Neutral / International',
          activeMode,
          userName: profile?.firstName ?? user?.firstName ?? 'there',
        }),
      })

      const data = await response.json().catch(() => ({})) as {
        message?: string
        detectedMode?: string
        selectedMode?: string
        reasoning?: Message['reasoning']
        crisisAssessment?: CrisisAssessment
        hardStop?: boolean
        riskResult?: RiskResult
        riskLevel?: RiskLevel
        riskScore?: number
        showHumanHandoff?: boolean
        responseType?: Message['responseType']
        shouldLogCrisisEvent?: boolean
        crisisEvent?: CrisisEventMetadata | null
        memoryExtraction?: MemoryExtractionResult
      }

      if (!response.ok || !data.message) {
        throw new Error(data.message || 'Unable to connect to SaneSpace right now.')
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        conversationId: activeConvId,
        sender: 'ai',
        content: data.message,
        adaptiveMode: toAdaptiveMode(data.detectedMode ?? activeMode),
        timestamp: new Date().toISOString(),
        reasoning: data.reasoning || null,
        riskLevel: data.riskLevel,
        riskScore: data.riskScore,
        showHumanHandoff: data.showHumanHandoff ?? (data.riskLevel === 'high' || data.riskLevel === 'critical'),
        responseType: data.responseType,
        memoryExtraction: data.memoryExtraction,
      }

      const finalMessages = [...nextMessages, aiMsg]
      setMessages(finalMessages)
      void saveConversation(finalMessages)
      saveCrisisEvent(data.crisisEvent)

      if (data.detectedMode && data.detectedMode !== activeMode) {
        setActiveMode(toAdaptiveMode(data.detectedMode))
      }

      const tier = (data.crisisAssessment?.tier || 'safe') as CrisisTier
      setCrisisTier(tier)
      try {
        localStorage.setItem('sane_crisis_tier', tier)
      } catch {}

      if (data.hardStop) setHardStop(true)
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Unable to connect to SaneSpace right now.'
      setErrorMessage(fallback)
      setLastFailedText(textForRetry)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading || hardStop) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId: activeConvId,
      sender: 'user',
      content: text,
      adaptiveMode: activeMode,
      timestamp: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    updateMemoryConfidence(text)
    setInput('')
    await requestAIResponse(nextMessages, text)
  }

  const retryLastMessage = async () => {
    if (!lastFailedText || isLoading || hardStop) return
    await requestAIResponse(messages, lastFailedText)
  }

  const messageGroups = groupByDate(messages)

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base text-dark">
      <Sidebar userName={firstName || user?.fullName || 'User'} />

      <AnimatePresence>
        {showMobileConvs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex md:hidden"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex h-full w-72 flex-col border-r border-border bg-surface shadow-2xl"
            >
              <ConversationPanel
                conversations={conversations}
                activeConvId={activeConvId}
                onLoad={loadConversation}
                onNew={() => createConversation()}
              />
            </motion.div>
            <button
              type="button"
              aria-label="Close conversations"
              className="flex-1 bg-dark/40"
              onClick={() => setShowMobileConvs(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full min-w-0 flex-1 md:ml-64">
        <aside className="hidden h-full w-72 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
          <ConversationPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onLoad={loadConversation}
            onNew={() => createConversation()}
          />
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <button
                type="button"
                aria-label="Show conversations"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-text transition hover:bg-primary-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary md:hidden"
                onClick={() => setShowMobileConvs(true)}
              >
                <PanelLeft size={20} />
              </button>

              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={titleValue}
                    onChange={(event) => setTitleValue(event.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleTitleSave()
                      if (event.key === 'Escape') setIsEditingTitle(false)
                    }}
                    aria-label="Conversation title"
                    className="w-full rounded-lg border border-primary-mid bg-surface px-3 py-2 text-sm font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="block max-w-full truncate rounded-md text-left text-sm font-semibold text-dark transition hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {titleValue}
                  </button>
                )}
                <CompanionIndicator state={isLoading ? 'thinking' : 'idle'} label={messages.length === 0 ? "What's on your mind?" : 'Conversation stays in context'} />
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                <CrisisStatusIndicator tier={crisisTier} />
                <ModeTag mode={activeMode} />
              </div>

              <button
                type="button"
                onClick={() => router.push('/chat/voice')}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-primary transition hover:border-primary/50 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <Mic size={16} />
                <span className="hidden sm:inline">Voice</span>
              </button>
            </div>

            <div className="mx-auto mt-3 flex max-w-5xl gap-2 overflow-x-auto pb-1">
              {companionModeOptions.map((option) => {
                const Icon = option.icon
                const isActive = activeMode === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setActiveMode(option.id)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary ${
                      isActive
                        ? 'border-primary bg-primary text-white'
                        : 'border-border bg-surface text-gray-text hover:border-primary/50 hover:bg-primary-light hover:text-primary'
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-4 py-5 md:px-6" aria-live="polite">
            {messages.length === 0 ? (
              <CompanionGreeting name={firstName} suggestions={SUGGESTIONS} onSuggestion={sendMessage} />
            ) : (
              <div className="mx-auto flex max-w-4xl flex-col gap-6">
                {messageGroups.map((group) => (
                  <div key={group.label} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-gray-text">{group.label}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    {group.messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <ChatMessage message={message} />
                      </motion.div>
                    ))}
                  </div>
                ))}

                {isLoading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <ChatMessage
                      isLatest
                      message={{
                        id: '__loading__',
                        conversationId: activeConvId,
                        sender: 'ai',
                        content: '',
                        adaptiveMode: activeMode,
                        timestamp: new Date().toISOString(),
                      }}
                    />
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </section>

          <footer className="shrink-0 border-t border-border bg-bg-base/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:px-6">
            <div className="mx-auto max-w-4xl space-y-3">
              <AnimatePresence>
                {hardStop && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-dark"
                    role="alert"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p>SaneSpace has paused this conversation to prioritize your immediate safety. Please contact a trusted person or crisis support before continuing.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setHardStop(false)
                          setCrisisTier('monitor')
                          try {
                            localStorage.setItem('sane_crisis_tier', 'monitor')
                          } catch {}
                        }}
                        className="shrink-0 rounded-lg border border-red-500/30 bg-surface px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        I am safe, continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMessage && (
                <div className="flex flex-col gap-3 rounded-lg border border-red-500/25 bg-surface px-4 py-3 text-sm text-gray-text sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={retryLastMessage}
                    disabled={!lastFailedText || isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    Retry
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <CompanionStatus state={hardStop ? 'muted' : isLoading ? 'thinking' : 'idle'} compact />
                <span className="hidden text-xs text-gray-text sm:inline">Shift + Enter adds a new line</span>
              </div>

              <ChatComposer
                input={input}
                setInput={setInput}
                onSubmit={() => sendMessage()}
                onVoice={() => router.push('/chat/voice')}
                disabled={hardStop}
                isLoading={isLoading}
                textareaRef={textareaRef}
              />
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

function ConversationPanel({
  conversations,
  activeConvId,
  onLoad,
  onNew,
}: {
  conversations: Conversation[]
  activeConvId: string
  onLoad: (conversation: Conversation) => void
  onNew: () => void
}) {
  return (
    <>
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-dark">Conversations</p>
          <button
            type="button"
            onClick={onNew}
            aria-label="Start a new conversation"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary transition hover:border-primary/50 hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-xs leading-relaxed text-gray-text">
          Keep separate threads for plans, decisions, ideas, and check-ins.
        </p>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConvId
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onLoad(conversation)}
              className={`w-full rounded-lg border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${
                isActive
                  ? 'border-primary/30 bg-primary-light text-primary'
                  : 'border-transparent text-gray-text hover:border-border hover:bg-bg-base'
              }`}
            >
              <p className={`truncate text-sm ${isActive ? 'font-semibold' : 'font-medium text-dark'}`}>{conversation.title}</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-text">
                <span>{formatConvDate(conversation.createdAt)}</span>
                <span>{conversation.mode === 'voice' ? 'Voice' : 'Text'}</span>
              </div>
            </button>
          )
        })}

        {conversations.length === 0 && (
          <p className="px-3 py-6 text-sm text-gray-text">No conversations yet.</p>
        )}
      </div>
    </>
  )
}
