'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Clock3,
  Loader2,
  MessageSquareText,
  Mic,
  MoreHorizontal,
  PanelLeft,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
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
import { resolveLanguagePreference } from '@/lib/languages'
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

function getConversationGroupLabel(iso: string): 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older' {
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return 'Previous 7 days'
  return 'Older'
}

function groupConversationsByDate(conversations: Conversation[]) {
  const buckets = {
    Today: [] as Conversation[],
    Yesterday: [] as Conversation[],
    'Previous 7 days': [] as Conversation[],
    Older: [] as Conversation[],
  }

  conversations.forEach((conversation) => {
    const label = getConversationGroupLabel(conversation.createdAt)
    buckets[label].push(conversation)
  })

  return Object.entries(buckets).filter(([, items]) => items.length > 0) as [keyof typeof buckets, Conversation[]][]
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

  const renameConversation = async (conversationId: string, title: string) => {
    const trimmed = title.trim() || 'New conversation'
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })

    if (!response.ok) {
      setErrorMessage('Unable to rename this conversation.')
      return
    }

    const data = await response.json() as { conversation: Conversation }
    setConversations((current) => current.map((conversation) => conversation.id === conversationId ? data.conversation : conversation))
    if (conversationId === activeConvId) {
      setTitleValue(trimmed)
    }
    setErrorMessage('')
  }

  const deleteConversation = async (conversationId: string) => {
    const response = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' })
    if (!response.ok) {
      setErrorMessage('Unable to delete this conversation.')
      return
    }

    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== conversationId)
      if (!next.length) {
        setMessages([])
        setActiveConvId('')
        setTitleValue('New conversation')
        return next
      }

      if (conversationId === activeConvId) {
        const fallback = next[0]
        setActiveConvId(fallback.id)
        setMessages(fallback.messages)
        setTitleValue(fallback.title)
      }
      return next
    })
    setErrorMessage('')
  }

  const archiveConversation = async (conversationId: string) => {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== conversationId)
      if (!next.length) {
        setMessages([])
        setActiveConvId('')
        setTitleValue('New conversation')
        return next
      }

      if (conversationId === activeConvId) {
        const fallback = next[0]
        setActiveConvId(fallback.id)
        setMessages(fallback.messages)
        setTitleValue(fallback.title)
      }
      return next
    })
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
          languageProfile: resolveLanguagePreference(profile?.languageProfile, 'Neutral / International'),
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
    <div className="flex h-screen overflow-hidden bg-[#070708] text-[#F5F5F7]">
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
              className="flex h-full w-72 flex-col border-r border-border bg-[#0D0D12] shadow-2xl"
            >
              <ConversationPanel
                conversations={conversations}
                activeConvId={activeConvId}
                onLoad={loadConversation}
                onNew={() => createConversation()}
                onRename={renameConversation}
                onDelete={deleteConversation}
                onArchive={archiveConversation}
              />
            </motion.div>
            <button
              type="button"
              aria-label="Close conversations"
              className="flex-1 bg-black/60"
              onClick={() => setShowMobileConvs(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-full min-w-0 flex-1 md:ml-64">
        <aside className="hidden h-full w-72 shrink-0 border-r border-border bg-[#0D0D12] md:flex md:flex-col">
          <ConversationPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onLoad={loadConversation}
            onNew={() => createConversation()}
            onRename={renameConversation}
            onDelete={deleteConversation}
            onArchive={archiveConversation}
          />
        </aside>

        <main className="flex h-full min-w-0 flex-1 flex-col bg-[#070708]">
          <header className="shrink-0 border-b border-border bg-[#0D0D12]/90 px-4 py-3 backdrop-blur-md">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <button
                type="button"
                aria-label="Show conversations"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-[#111118] text-[#A7A7B3] transition hover:border-violet-500/50 hover:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-violet-500 md:hidden"
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
                    className="w-full rounded-xl border border-violet-500/40 bg-[#111118] px-3 py-2 text-sm font-semibold text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="block max-w-full truncate rounded-lg text-left text-sm font-semibold text-[#F5F5F7] transition hover:text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-[#111118] px-3 text-sm font-medium text-violet-300 transition hover:border-violet-500/60 hover:bg-[#17171F] focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      isActive
                        ? 'border-violet-500/60 bg-violet-600 text-white'
                        : 'border-border bg-[#111118] text-[#A7A7B3] hover:border-violet-500/40 hover:text-[#F5F5F7]'
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
                      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#A7A7B3]">{group.label}</span>
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

          <footer className="shrink-0 border-t border-border bg-[#070708]/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:px-6">
            <div className="mx-auto max-w-4xl space-y-3">
              <AnimatePresence>
                {hardStop && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-[#F5F5F7]"
                    role="alert"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[#F5F5F7]">SaneSpace has paused this conversation to prioritize your immediate safety. Please contact a trusted person or crisis support before continuing.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setHardStop(false)
                          setCrisisTier('monitor')
                          try {
                            localStorage.setItem('sane_crisis_tier', 'monitor')
                          } catch {}
                        }}
                        className="shrink-0 rounded-xl border border-red-500/40 bg-[#111118] px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        I am safe, continue
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {errorMessage && (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-500/30 bg-[#111118] px-4 py-3 text-sm text-[#A7A7B3] sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={retryLastMessage}
                    disabled={!lastFailedText || isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-[#17171F] px-3 py-2 text-xs font-semibold text-violet-300 transition hover:border-violet-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    Retry
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <CompanionStatus state={hardStop ? 'muted' : isLoading ? 'thinking' : 'idle'} compact />
                <span className="hidden text-[11px] uppercase tracking-[0.16em] text-[#A7A7B3] sm:inline">Shift + Enter adds a new line</span>
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
  onRename,
  onDelete,
  onArchive,
}: {
  conversations: Conversation[]
  activeConvId: string
  onLoad: (conversation: Conversation) => void
  onNew: () => void
  onRename: (conversationId: string, title: string) => Promise<void>
  onDelete: (conversationId: string) => Promise<void>
  onArchive: (conversationId: string) => Promise<void>
}) {
  const [query, setQuery] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filtered = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(query.toLowerCase()),
  )

  const grouped = groupConversationsByDate(filtered)

  const renameConversation = async (conversation: Conversation) => {
    const title = window.prompt('Rename conversation', conversation.title)?.trim()
    if (!title || title === conversation.title) return
    await onRename(conversation.id, title)
    setMenuOpenId(null)
  }

  const deleteConversation = async (conversation: Conversation) => {
    const confirmed = window.confirm(`Delete "${conversation.title}"? This cannot be undone.`)
    if (!confirmed) return
    await onDelete(conversation.id)
    setMenuOpenId(null)
  }

  return (
    <>
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300">
              <MessageSquareText size={16} />
            </div>
            <p className="text-sm font-semibold text-[#F5F5F7]">Conversations</p>
          </div>
          <button
            type="button"
            onClick={onNew}
            aria-label="Start a new conversation"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-[#111118] text-violet-300 transition hover:border-violet-500/40 hover:bg-[#17171F] focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <Plus size={16} />
          </button>
        </div>

        <label className="flex items-center gap-2 rounded-2xl border border-border bg-[#111118] px-3 py-2 text-[#A7A7B3] focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/20">
          <Search size={14} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full bg-transparent text-sm text-[#F5F5F7] placeholder:text-[#A7A7B3] focus:outline-none"
          />
        </label>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-2 py-3">
        {grouped.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-[#111118] px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-300">
              <Clock3 size={20} />
            </div>
            <p className="text-sm font-semibold text-[#F5F5F7]">No conversations yet</p>
            <p className="mt-1 text-xs text-[#A7A7B3]">Start a new thread to capture plans, ideas, and check-ins.</p>
          </div>
        )}

        {grouped.map(([label, items]) => (
          <div key={label} className="space-y-2">
            <div className="px-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A7A7B3]">{label}</div>
            {items.map((conversation) => {
              const isActive = conversation.id === activeConvId
              return (
                <div key={conversation.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onLoad(conversation)}
                    className={[
                      'w-full rounded-2xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-500',
                      isActive
                        ? 'border-violet-500/40 bg-[#111118] text-[#F5F5F7]'
                        : 'border-transparent bg-transparent text-[#A7A7B3] hover:border-border hover:bg-[#111118] hover:text-[#F5F5F7]',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-600/15 text-violet-300">
                        {conversation.mode === 'voice' ? <Mic size={12} /> : <MessageSquareText size={12} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-current">{conversation.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#A7A7B3]">
                          <span>{formatConvDate(conversation.createdAt)}</span>
                          <span>{conversation.mode === 'voice' ? 'Voice' : 'Text'}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      aria-label={`More actions for ${conversation.title}`}
                      onClick={() => setMenuOpenId(menuOpenId === conversation.id ? null : conversation.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-[#A7A7B3] transition hover:bg-[#17171F] hover:text-[#F5F5F7]"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {menuOpenId === conversation.id && (
                      <div className="absolute right-0 top-10 z-20 w-40 rounded-2xl border border-border bg-[#111118] p-1 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => void renameConversation(conversation)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#F5F5F7] hover:bg-[#17171F]"
                        >
                          <PencilLine size={14} />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteConversation(conversation)}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpenId(null)
                            void onArchive(conversation.id)
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[#A7A7B3] hover:bg-[#17171F]"
                        >
                          <Archive size={14} />
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
