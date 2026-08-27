'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, ArrowUp, MessageCircle, Plus, ChevronLeft } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import ChatBubble from '@/components/ui/ChatBubble'
import ModeTag from '@/components/ui/ModeTag'
import CrisisStatusIndicator from '@/components/ui/CrisisStatusIndicator'
import type { Conversation, Message } from '@/lib/types'
import type { CrisisTier, CrisisAssessment } from '@/lib/crisisDetection'
import type { MemoryExtractionResult } from '@/lib/memoryExtraction'
import type { RiskLevel, RiskResult } from '@/lib/riskClassifier'

// ─── Constants ───────────────────────────────────────────────────────────────

const MODE_PILLS = [
  { id: 'listening', label: '🫂 Listening' },
  { id: 'coach', label: '🎯 Coach Me' },
  { id: 'explorer', label: "🔍 Let's Explore" },
  { id: 'companion', label: '☀️ Just Chat' },
] as const

const SUGGESTIONS = [
  "I've been feeling overwhelmed lately",
  'I need help managing my stress',
  'Just want to talk',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AdaptiveMode = 'listening' | 'coach' | 'explorer' | 'companion' | 'care'

type CrisisEventMetadata = {
  eventType: string
  riskLevel: RiskLevel
  riskScore: number
  matchedSignals: string[]
  hashedExcerpt: string
  createdAt: string
}

function toAdaptiveMode(s: string): AdaptiveMode {
  const valid: AdaptiveMode[] = ['listening', 'coach', 'explorer', 'companion', 'care']
  return (valid as string[]).includes(s) ? (s as AdaptiveMode) : 'listening'
}

function getDateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatConvDate(iso: string): string {
  const d = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupByDate(msgs: Message[]) {
  const groups: { label: string; messages: Message[] }[] = []
  let currentKey = ''
  for (const m of msgs) {
    const key = new Date(m.timestamp).toDateString()
    if (key !== currentKey) {
      currentKey = key
      groups.push({ label: getDateLabel(m.timestamp), messages: [m] })
    } else {
      groups[groups.length - 1].messages.push(m)
    }
  }
  return groups
}

function generateTitle(msgs: Message[]): string {
  const first = msgs.find((m) => m.sender === 'user')
  if (!first) return 'New conversation'
  const c = first.content.trim()
  return c.length > 40 ? c.slice(0, 40) + '…' : c
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeMode, setActiveMode] = useState<string>('listening')
  const [showMobileConvs, setShowMobileConvs] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('New conversation')
  const [emptySubtext, setEmptySubtext] = useState('Talk to me about anything on your mind.')
  const [crisisTier, setCrisisTier] = useState<CrisisTier>('safe')
  const [hardStop, setHardStop] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // ── Mount: load conversations + prefs ────────────────────────────────────
  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      const spec = prefs.specialisation as string | undefined
      if (spec === 'Therapy Support') setEmptySubtext("I'm here to listen and support you.")
      else if (spec === 'Student Support') setEmptySubtext('CGPA stress? Hostel wahala? Talk to me.')
    } catch {}

    try {
      const storedTier = localStorage.getItem('sane_crisis_tier')
      if (storedTier === 'safe' || storedTier === 'monitor' || storedTier === 'escalate' || storedTier === 'stop') {
        setCrisisTier(storedTier)
      }
    } catch {}

    try {
      const stored = localStorage.getItem('sane_conversations')
      if (stored) {
        const convs = JSON.parse(stored) as Conversation[]
        if (convs.length > 0) {
          setConversations(convs)
          setActiveConvId(convs[0].id)
          setMessages(convs[0].messages)
          setTitleValue(convs[0].title)
          return
        }
      }
    } catch {}
    createDefaultConversation()

    // Read pre-filled message from mood page
    try {
      const prefilled = localStorage.getItem('sane_prefilled_message')
      if (prefilled) {
        setInput(prefilled)
        localStorage.removeItem('sane_prefilled_message')
      }
    } catch {}
  }, [])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Auto-grow textarea ───────────────────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // ── Focus title input when editing ──────────────────────────────────────
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus()
  }, [isEditingTitle])

  // ── Sync title when active conv changes ─────────────────────────────────
  useEffect(() => {
    const conv = conversations.find((c) => c.id === activeConvId)
    if (conv) setTitleValue(conv.title)
  }, [activeConvId, conversations])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const createDefaultConversation = () => {
    const id = crypto.randomUUID()
    const conv: Conversation = {
      id,
      userId: 'local',
      title: 'New conversation',
      mode: 'text',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    try {
      localStorage.setItem('sane_conversations', JSON.stringify([conv]))
    } catch {}
    setConversations([conv])
    setActiveConvId(id)
    setTitleValue('New conversation')
  }

  const saveConversation = (msgs: Message[], convId = activeConvId) => {
    try {
      const stored: Conversation[] = JSON.parse(
        localStorage.getItem('sane_conversations') ?? '[]',
      )
      const idx = stored.findIndex((c) => c.id === convId)
      const updated: Conversation = {
        id: convId,
        userId: 'local',
        title: generateTitle(msgs),
        mode: 'text',
        createdAt: stored[idx]?.createdAt ?? new Date().toISOString(),
        messages: msgs,
      }
      if (idx >= 0) stored[idx] = updated
      else stored.unshift(updated)
      localStorage.setItem('sane_conversations', JSON.stringify(stored))
      setConversations([...stored])
    } catch {}
  }

  const newConversation = () => {
    const id = crypto.randomUUID()
    const conv: Conversation = {
      id,
      userId: 'local',
      title: 'New conversation',
      mode: 'text',
      createdAt: new Date().toISOString(),
      messages: [],
    }
    try {
      const stored: Conversation[] = JSON.parse(
        localStorage.getItem('sane_conversations') ?? '[]',
      )
      stored.unshift(conv)
      localStorage.setItem('sane_conversations', JSON.stringify(stored))
      setConversations(stored)
    } catch {}
    setActiveConvId(id)
    setMessages([])
    setTitleValue('New conversation')
    setShowMobileConvs(false)
  }

  const loadConversation = (conv: Conversation) => {
    setActiveConvId(conv.id)
    setMessages(conv.messages)
    setTitleValue(conv.title)
    setShowMobileConvs(false)
  }

  const handleTitleSave = () => {
    setIsEditingTitle(false)
    const title = titleValue.trim() || 'New conversation'
    setTitleValue(title)
    try {
      const stored: Conversation[] = JSON.parse(
        localStorage.getItem('sane_conversations') ?? '[]',
      )
      const updated = stored.map((c) => (c.id === activeConvId ? { ...c, title } : c))
      localStorage.setItem('sane_conversations', JSON.stringify(updated))
      setConversations(updated)
    } catch {}
  }

  // ── Memory confidence tracking ───────────────────────────────────────────

  const updateMemoryConfidence = (userMessage: string) => {
    const patterns = [
      { key: 'academic',
        label: 'Academic stress',
        keywords: ['exam', 'cgpa', 'assignment', 'lecture',
                   'carry-over', 'school', 'test'] },
      { key: 'financial',
        label: 'Financial pressure',
        keywords: ['money', 'broke', 'fees', 'allowance',
                   'feeding', 'cash'] },
      { key: 'relationship',
        label: 'Relationship stress',
        keywords: ['boyfriend', 'girlfriend', 'family',
                   'friend', 'mum', 'dad'] },
      { key: 'work',
        label: 'Work pressure',
        keywords: ['work', 'boss', 'job', 'office',
                   'deadline', 'career'] },
      { key: 'selfworth',
        label: 'Self-worth',
        keywords: ['not good enough', 'failure', 'useless',
                   'why am i', 'hate myself'] },
    ]

    const msg = userMessage.toLowerCase()

    try {
      const existing = JSON.parse(
        localStorage.getItem('sane_memory_confidence') || '{}',
      )

      patterns.forEach((p) => {
        const hit = p.keywords.some((k) => msg.includes(k))
        if (hit) {
          existing[p.key] = {
            label: p.label,
            score: Math.min((existing[p.key]?.score || 30) + 8, 95),
            lastSeen: new Date().toISOString(),
          }
        }
      })

      localStorage.setItem('sane_memory_confidence', JSON.stringify(existing))
    } catch {}
  }

  // ── Send message ─────────────────────────────────────────────────────────

  const saveCrisisEvent = (event?: CrisisEventMetadata | null) => {
    if (!event) return
    try {
      const existing = JSON.parse(
        localStorage.getItem('sane_crisis_events') ?? '[]',
      ) as CrisisEventMetadata[]
      localStorage.setItem(
        'sane_crisis_events',
        JSON.stringify([event, ...existing].slice(0, 20)),
      )
    } catch {}
  }

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isLoading || hardStop) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId: activeConvId,
      sender: 'user',
      content: text,
      adaptiveMode: toAdaptiveMode(activeMode),
      timestamp: new Date().toISOString(),
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    updateMemoryConfidence(text)
    setInput('')
    setIsLoading(true)

    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated,
          specialisation: prefs.specialisation ?? '',
          languageProfile: prefs.languageProfile ?? 'Neutral / International',
          activeMode,
          userName: prefs.firstName ?? user?.firstName ?? 'there',
        }),
      })

      const data = await res.json() as {
        message: string
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
        showHumanHandoff:
          data.showHumanHandoff ?? (data.riskLevel === 'high' || data.riskLevel === 'critical'),
        responseType: data.responseType,
        memoryExtraction: data.memoryExtraction,
      }

      const final = [...updated, aiMsg]
      setMessages(final)
      if (data.detectedMode && data.detectedMode !== activeMode) {
        setActiveMode(data.detectedMode)
      }
      saveConversation(final)
      saveCrisisEvent(data.crisisEvent)

      const tier = (data.crisisAssessment?.tier || 'safe') as CrisisTier
      setCrisisTier(tier)
      try {
        localStorage.setItem('sane_crisis_tier', tier)
      } catch {}
      if (data.hardStop) setHardStop(true)
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        conversationId: activeConvId,
        sender: 'ai',
        content: "I'm having trouble connecting right now. Please try again.",
        adaptiveMode: toAdaptiveMode(activeMode),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const firstName = user?.firstName || null
  const messageGroups = groupByDate(messages)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden mesh-light">
      <Sidebar userName={firstName || user?.fullName || 'User'} />

      {/* ── Mobile conversation drawer ── */}
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
              className="w-72 bg-surface h-full shadow-2xl flex flex-col"
            >
              <ConversationPanel
                conversations={conversations}
                activeConvId={activeConvId}
                onLoad={loadConversation}
                onNew={newConversation}
              />
            </motion.div>
            <div className="flex-1 bg-black/30" onClick={() => setShowMobileConvs(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main: offset for sidebar ── */}
      <div className="flex flex-1 md:ml-64 h-full overflow-hidden">

        {/* ── Desktop conversation panel ── */}
        <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-surface h-full">
          <ConversationPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onLoad={loadConversation}
            onNew={newConversation}
          />
        </div>

        {/* ── Active chat panel ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full">

          {/* Top bar */}
          <div className="shrink-0 bg-surface border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Mobile back button */}
              <button
                className="md:hidden mr-1 text-gray-400 hover:text-primary transition-colors"
                onClick={() => setShowMobileConvs(true)}
              >
                <ChevronLeft size={20} />
              </button>

              {/* Editable title */}
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave()
                    if (e.key === 'Escape') setIsEditingTitle(false)
                  }}
                  className="flex-1 text-sm font-medium text-dark bg-surface border border-primary-mid
                    rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary min-w-0"
                />
              ) : (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="flex-1 text-sm font-medium text-dark text-left truncate hover:text-primary transition-colors min-w-0"
                >
                  {titleValue}
                </button>
              )}

              {/* Mode controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block">
                  <CrisisStatusIndicator tier={crisisTier} />
                </div>
                <ModeTag mode={toAdaptiveMode(activeMode)} />
                <div className="hidden sm:flex items-center gap-1.5">
                  {MODE_PILLS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveMode(p.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all
                        ${activeMode === p.id
                          ? 'bg-primary text-white'
                          : 'border border-border text-gray-text hover:border-primary-mid'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Voice mode button */}
                <button
                  onClick={() => router.push('/chat/voice')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary
                    text-primary text-xs font-medium hover:bg-primary-light transition-colors shrink-0"
                >
                  <Mic size={13} />
                  Voice
                </button>
              </div>
            </div>

            {/* Mobile mode pills */}
            <div className="sm:hidden flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-hide">
              {MODE_PILLS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveMode(p.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0
                    ${activeMode === p.id
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 text-gray-text'
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
            {messages.length === 0 ? (
              /* ── Empty state ── */
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
                  <MessageCircle size={28} className="text-white" />
                </div>
                <h2 className="font-heading text-xl font-bold text-dark mb-2">
                  Start a conversation
                </h2>
                <p className="text-gray-text text-sm mb-7 max-w-xs">{emptySubtext}</p>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-sm text-primary border border-primary-mid bg-primary-light
                        rounded-full px-4 py-2.5 hover:bg-primary hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Messages with date separators ── */
              <div className="space-y-1">
                {messageGroups.map((group) => (
                  <div key={group.label}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-gray-400 font-medium">{group.label}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <AnimatePresence initial={false}>
                      {group.messages.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' as const }}
                          className="mb-2"
                        >
                          <ChatBubble
                            message={msg}
                            isLatest={
                              i === group.messages.length - 1 &&
                              !isLoading
                            }
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-2"
                  >
                    <ChatBubble
                      message={{
                        id: '__loading__',
                        conversationId: activeConvId,
                        sender: 'ai',
                        content: '',
                        adaptiveMode: toAdaptiveMode(activeMode),
                        timestamp: new Date().toISOString(),
                      }}
                      isLatest={true}
                    />
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border bg-surface px-4 py-3">
            {/* Hard stop safety banner */}
            <AnimatePresence>
              {hardStop && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-red-500 text-white text-sm rounded-xl px-4 py-3 mb-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>
                      SaneSpace has paused to prioritize your safety. Please contact a crisis counsellor before continuing.
                    </p>
                    <button
                      onClick={() => {
                        setHardStop(false)
                        setCrisisTier('monitor')
                        try {
                          localStorage.setItem('sane_crisis_tier', 'monitor')
                        } catch {}
                      }}
                      className="shrink-0 bg-white text-red-500 font-medium px-3 py-1.5 rounded-full text-xs whitespace-nowrap hover:bg-red-50 transition-colors"
                    >
                      I&apos;m safe, continue
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-2">
              {/* Mic button — opens the dedicated Voice Mode experience */}
              <button
                onClick={() => router.push('/chat/voice')}
                disabled={hardStop}
                title="Switch to voice mode"
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all
                  ${hardStop ? 'opacity-40 cursor-not-allowed bg-surface' : 'bg-surface hover:bg-primary-light'}`}
              >
                <Mic size={17} className="text-gray-text" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={hardStop ? 'Chat paused for your safety...' : 'Talk to me...'}
                rows={1}
                disabled={hardStop}
                className={`flex-1 resize-none rounded-2xl border border-border px-4 py-2.5
                  text-sm text-dark placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  transition-all duration-200
                  ${hardStop ? 'bg-surface/50 opacity-60 cursor-not-allowed' : 'bg-surface'}`}
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading || hardStop}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                  bg-primary text-white transition-all
                  ${!input.trim() || isLoading || hardStop ? 'opacity-40 cursor-not-allowed' : 'hover:bg-opacity-90 active:scale-95'}`}
              >
                <ArrowUp size={17} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── ConversationPanel ────────────────────────────────────────────────────────

function ConversationPanel({
  conversations,
  activeConvId,
  onLoad,
  onNew,
}: {
  conversations: Conversation[]
  activeConvId: string
  onLoad: (c: Conversation) => void
  onNew: () => void
}) {
  return (
    <>
      <div className="px-4 pt-4 pb-2">
        <p className="font-medium text-dark text-sm mb-3">Conversations</p>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full
            border border-primary text-primary text-xs font-medium
            hover:bg-primary-light transition-colors"
        >
          <Plus size={13} />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-0.5">
        {conversations.map((conv) => {
          const isActive = conv.id === activeConvId
          return (
            <button
              key={conv.id}
              onClick={() => onLoad(conv)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition-all
                ${isActive
                  ? 'bg-primary-light border-l-2 border-primary'
                  : 'hover:bg-primary-light/40 border-l-2 border-transparent'
                }`}
            >
              <p className={`text-sm truncate leading-snug ${isActive ? 'font-semibold text-primary' : 'font-medium text-dark'}`}>
                {conv.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatConvDate(conv.createdAt)}</p>
            </button>
          )
        })}
      </div>
    </>
  )
}
