'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { MessageCircle, Heart } from 'lucide-react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Button from '@/components/ui/Button'
import CrisisStatusIndicator from '@/components/ui/CrisisStatusIndicator'
import { staggerContainer, fadeUp, scaleIn, fadeIn } from '@/lib/animations'
import { Mood } from '@/lib/types'
import type { Conversation } from '@/lib/types'
import type { CrisisTier } from '@/lib/crisisDetection'
import type { StoredUserMemory } from '@/lib/memoryExtraction'
import MoodCheckIn, { type DailyMood } from '@/components/dashboard/MoodCheckIn'
import LifeNavigation from '@/components/dashboard/LifeNavigation'

// ─── Constants ───────────────────────────────────────────────────────────────

const MOOD_VALUE: Record<string, number> = {
  // Mood enum values (mock data)
  [Mood.Happy]: 6, [Mood.Calm]: 5, [Mood.Sad]: 3,
  [Mood.Anxious]: 2, [Mood.Angry]: 2, [Mood.Overwhelmed]: 1,
  // Mood check-in label strings (real data)
  Happy: 6, Good: 5, Neutral: 4, Sad: 3, Stressed: 2, Anxious: 1,
}

const MOOD_EMOJI_MAP: Record<string, string> = {
  // Mood enum values (mock data)
  [Mood.Happy]: '😀', [Mood.Calm]: '🙂', [Mood.Sad]: '😔',
  [Mood.Anxious]: '😣', [Mood.Angry]: '😠', [Mood.Overwhelmed]: '😟',
  // Mood check-in label strings (real data)
  Happy: '😀', Good: '🙂', Neutral: '😐', Sad: '😔', Stressed: '😣', Anxious: '😟',
}

const SUBTEXT_BY_SPEC: Record<string, string> = {
  'Therapy Support': 'I’m here with you.',
  'Life Coaching': "Let's build something today.",
  'Student Support': 'One step at a time.',
  'Just to Talk': "I'm here whenever you need me.",
  'Chill / Play': 'Good vibes only today ✨',
  'Work & Career': "Let's make today count.",
}

const AREA_PROMPTS: Record<string, string> = {
  School: 'I want to think through something related to school.',
  Career: 'I want to think through something related to my career.',
  Relationships: 'I want to think through something related to my relationships.',
  Finances: 'I want to think through a financial decision.',
  'Personal life': 'I want help navigating something in my personal life.',
}

const LANG_EMOJI: Record<string, string> = {
  'Nigerian Pidgin': '🇳🇬',
  'Lagos English': '🗣️',
  'Student English': '🎓',
  'Nigerian Home English': '🏠',
  'Neutral / International': '🌍',
}

type Tip = { id: string; icon: string; text: string; category: string }

const GENERIC_TIPS: Tip[] = [
  { id: 'tip-1', icon: '🧘', text: 'Try a 5-minute body scan tonight before bed — it can calm a racing mind.', category: 'mindfulness' },
  { id: 'tip-2', icon: '📝', text: 'Write down three things that went okay today, no matter how small.', category: 'self-care' },
  { id: 'tip-3', icon: '🚶', text: 'A 15-minute walk without your phone can lower stress and clear your head.', category: 'physical' },
]

const PATTERN_COLOR: Record<string, string> = {
  academic: '#0A7C6E',
  financial: '#6C63FF',
  relationship: '#F59E0B',
  work: '#3B82F6',
  selfworth: '#EC4899',
}

type MemoryConfidence = Record<string, { label: string; score: number; lastSeen: string }>

function isRecentlyUpdated(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDayAbbr(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

// ─── Mood data helpers (real entries) ────────────────────────────────────────

type AnyEntry = { id: string; mood: string | null; date: string }

function buildChartDays(entries: { mood: string; date: string }[]): AnyEntry[] {
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toDateString()
    const found = entries.find((e) => new Date(e.date).toDateString() === dateStr)
    return { id: `chart-${i}`, mood: found?.mood ?? null, date: d.toISOString() }
  })
}

function calcRealStreak(entries: { date: string }[]): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const s = d.toDateString()
    if (entries.some((e) => new Date(e.date).toDateString() === s)) streak++
    else break
  }
  return streak
}

function buildNarrative(entries: { mood: string }[]): string {
  if (entries.length === 0) {
    return "Your journey starts with your first check-in. Tap below to log how you're feeling today."
  }
  const last7 = entries.slice(0, 7)
  const low = last7.filter((e) =>
    ['Sad', 'Stressed', 'Anxious', 'sad', 'anxious', 'overwhelmed', 'angry'].includes(e.mood),
  ).length
  const good = last7.filter((e) =>
    ['Happy', 'Good', 'happy', 'calm'].includes(e.mood),
  ).length
  if (good >= low && good > 1) {
    return "It's been a good week 🌿 Your check-ins show real stability. Keep going."
  }
  if (low > good + 1) {
    return "It's been a heavy week. But you showed up every day. That matters more than you know."
  }
  return "A mixed week — some heavy days, some lighter ones. The fact you kept checking in says a lot."
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-xl ${className}`}
      style={{
        background:
          'linear-gradient(90deg, rgb(var(--tw-surface)) 25%, rgb(var(--tw-border)) 50%, rgb(var(--tw-surface)) 75%)',
        backgroundSize: '200% 100%',
      }}
      animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' as const }}
    />
  )
}

function DashboardSkeleton() {
  return (
    <motion.div
      key="skeleton"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Shimmer className="h-9 w-52" />
          <Shimmer className="h-4 w-36" />
        </div>
        <div className="flex gap-3">
          <Shimmer className="h-20 w-36" />
          <Shimmer className="h-8 w-28" />
        </div>
      </div>
      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Shimmer className="h-36" />
        <Shimmer className="h-36" />
      </div>
      {/* Story panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Shimmer className="h-52" />
        <Shimmer className="h-52" />
        <Shimmer className="h-52" />
      </div>
      {/* Chart */}
      <Shimmer className="h-48" />
      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Shimmer className="h-64" />
        <Shimmer className="h-64" />
      </div>
    </motion.div>
  )
}

// ─── PatternBar ──────────────────────────────────────────────────────────────

function PatternBar({
  label,
  percent,
  color,
  updatedRecently = false,
}: {
  label: string
  percent: number
  color: string
  updatedRecently?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-text">{label}</span>
        <span className="font-semibold text-dark text-xs">{percent}%</span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: inView ? `${percent}%` : 0 }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' as const }}
        />
      </div>
      {updatedRecently && (
        <p className="text-[10px] text-primary italic">Updated just now</p>
      )}
    </div>
  )
}

// ─── MoodChart ───────────────────────────────────────────────────────────────

const CHART_H = 100

function MoodChart({ entries }: { entries: AnyEntry[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <div ref={ref} className="flex items-end justify-between gap-1.5">
      {entries.map((entry, i) => {
        // Empty day (no check-in)
        if (!entry.mood) {
          return (
            <div key={entry.id} className="flex flex-col items-center flex-1">
              <span className="text-sm mb-1.5 leading-none opacity-30">➖</span>
              <div className="w-full flex items-end justify-center" style={{ height: CHART_H }}>
                <div className="w-full max-w-[28px] rounded-t-sm bg-gray-200" style={{ height: 8 }} />
              </div>
              <span className="text-[10px] text-gray-400 mt-1.5 leading-none">
                {getDayAbbr(entry.date)}
              </span>
            </div>
          )
        }

        const val = MOOD_VALUE[entry.mood] ?? 3
        const barH = Math.max(6, (val / 6) * CHART_H)
        const color = val >= 5 ? '#0A7C6E' : val >= 3 ? '#F59E0B' : '#F87171'
        const emoji = MOOD_EMOJI_MAP[entry.mood] ?? '😐'
        const isLast = i === entries.length - 1

        return (
          <div key={entry.id} className="flex flex-col items-center flex-1">
            <span className="text-sm mb-1.5 leading-none">{emoji}</span>
            <div className="w-full flex items-end justify-center" style={{ height: CHART_H }}>
              <motion.div
                className={`w-full max-w-[28px] rounded-t-md ${isLast ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                style={{ backgroundColor: color }}
                initial={{ height: 0 }}
                animate={{ height: inView ? barH : 0 }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' as const }}
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-1.5 leading-none">
              {getDayAbbr(entry.date)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── ConvCard ────────────────────────────────────────────────────────────────

function ConvCard({
  conv,
  onClick,
  isLast,
}: {
  conv: Conversation
  onClick: () => void
  isLast: boolean
}) {
  const preview = conv.messages[0]?.content ?? ''
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(10,124,110,0.1)' }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left bg-surface rounded-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-primary ${
        !isLast ? 'border-b border-border' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
        <MessageCircle size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-dark text-sm truncate">{conv.title}</p>
        <p className="text-xs text-gray-text mt-0.5 truncate">
          {truncate(preview, 60)}
        </p>
      </div>
      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
        {formatDate(conv.createdAt)}
      </span>
    </motion.button>
  )
}

// ─── RecoCard ────────────────────────────────────────────────────────────────

function RecoCard({ rec }: { rec: Tip }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="group flex items-center gap-3 p-4 bg-surface rounded-xl
        border-l-4 border-transparent hover:border-primary transition-all duration-200 cursor-default"
    >
      <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
        <span className="text-lg leading-none">{rec.icon}</span>
      </div>
      <div className="min-w-0">
        <p className="font-medium text-dark text-sm leading-snug">{rec.text}</p>
        <span className="inline-block mt-1 text-[10px] text-gray-text bg-surface border border-border rounded-full px-2 py-0.5 capitalize">
          {rec.category}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type Prefs = {
  specialisation?: string
  languageProfile?: string
  currentMood?: string
  onboardingComplete?: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [loading, setLoading] = useState(true)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [realEntries, setRealEntries] = useState<{ mood: string; date: string; id: string }[]>([])
  const [realStreak, setRealStreak] = useState(0)
  const [journeyNarrative, setJourneyNarrative] = useState('')
  const [crisisTier, setCrisisTier] = useState<CrisisTier>('safe')
  const [memoryConfidence, setMemoryConfidence] = useState<MemoryConfidence | null>(null)
  const [userMemory, setUserMemory] = useState<StoredUserMemory[]>([])
  const [realConversations, setRealConversations] = useState<Conversation[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sane_user_preferences')
      if (saved) setPrefs(JSON.parse(saved))
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem('sane_mood_entries') ?? '[]') as {
        id: string; mood: string; date: string
      }[]
      if (stored.length > 0) {
        setRealEntries(stored)
        setRealStreak(calcRealStreak(stored))
        setJourneyNarrative(buildNarrative(stored))
      }
    } catch {}
    try {
      const storedTier = localStorage.getItem('sane_crisis_tier')
      if (storedTier === 'safe' || storedTier === 'monitor' || storedTier === 'escalate' || storedTier === 'stop') {
        setCrisisTier(storedTier)
      }
    } catch {}
    try {
      const storedMemory = JSON.parse(localStorage.getItem('sane_memory_confidence') ?? '{}') as MemoryConfidence
      if (Object.keys(storedMemory).length > 0) setMemoryConfidence(storedMemory)
    } catch {}
    try {
      const storedConvs = JSON.parse(localStorage.getItem('sane_conversations') ?? '[]') as Conversation[]
      setRealConversations(storedConvs.filter((c) => c.messages.length > 0))
    } catch {}
    void fetch('/api/memory', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ memories: StoredUserMemory[] }> : null)
      .then((data) => { if (data) setUserMemory(data.memories) })
      .catch(() => {})
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const firstName = user?.firstName || null
  const greeting = firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'
  const subtext = prefs?.specialisation
    ? (SUBTEXT_BY_SPEC[prefs.specialisation] ?? "What's up?")
    : "What's up?"

  const langLabel = prefs?.languageProfile
    ? `${LANG_EMOJI[prefs.languageProfile] ?? ''} ${prefs.languageProfile}`
    : null

  const structuredTriggerEntries = userMemory
    .filter((memory) => memory.memoryType === 'trigger')
    .slice(0, 5)
    .map((memory) => ({
      key: memory.category,
      label: memory.content
        .replace(/^User often reports /, '')
        .replace(/^User reports /, '')
        .replace(/\.$/, ''),
      percent: Math.round(memory.confidenceScore * 100),
      color: PATTERN_COLOR[memory.category] ?? '#0A7C6E',
      updatedRecently: isRecentlyUpdated(memory.lastUpdated),
    }))

  // Pattern bars: structured memory first, old confidence map next, else empty (no fake data for new users)
  const patternEntries = structuredTriggerEntries.length > 0
    ? structuredTriggerEntries
    : memoryConfidence
    ? Object.entries(memoryConfidence).map(([key, val]) => ({
        key,
        label: val.label,
        percent: val.score,
        color: PATTERN_COLOR[key] ?? '#0A7C6E',
        updatedRecently: isRecentlyUpdated(val.lastSeen),
      }))
    : []

  const resiliencePills = userMemory
    .filter((memory) => memory.memoryType === 'resilience')
    .slice(0, 6)
    .map((memory) => memory.content.replace(/\.$/, ''))

  // Chart data: real entries only — empty days render as "—" for new users
  const hasRealEntries = realEntries.length > 0
  const chartEntries: AnyEntry[] = buildChartDays(realEntries)
  const timelineEntries: AnyEntry[] = chartEntries

  const displayStreak = hasRealEntries ? realStreak : 0

  const narrative = hasRealEntries ? journeyNarrative : buildNarrative([])

  // Chart date range
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)
  const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  const conversations = realConversations
  const recommendations = GENERIC_TIPS

  const openContextualChat = (context: string) => {
    try { localStorage.setItem('sane_prefilled_message', context) } catch {}
    router.push('/chat')
  }

  // Real week-over-week trend — only shown when there's enough data to compute it honestly
  const loggedDays = chartEntries.filter((e) => e.mood)
  let moodTrendLabel: string | null = null
  if (loggedDays.length >= 2) {
    const mid = Math.ceil(loggedDays.length / 2)
    const firstHalf = loggedDays.slice(0, mid)
    const secondHalf = loggedDays.slice(mid)
    const avg = (entries: AnyEntry[]) =>
      entries.reduce((sum, e) => sum + (MOOD_VALUE[e.mood as string] ?? 3), 0) / entries.length
    if (secondHalf.length > 0) {
      const delta = avg(secondHalf) - avg(firstHalf)
      if (delta > 0.3) moodTrendLabel = '📈 Mood improving this week'
      else if (delta < -0.3) moodTrendLabel = '📉 A tougher week than usual'
      else moodTrendLabel = '➡️ Mood holding steady'
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen mesh-light">
      {/* Sidebar handles desktop fixed rail + mobile bottom nav */}
      <Sidebar userName={firstName || user?.fullName || 'User'} />

      {/* Main scroll area — offset for desktop sidebar */}
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-8">
        <div className="px-6 py-8 md:px-10 max-w-5xl mx-auto">

          <AnimatePresence mode="wait">
            {loading ? (
              <DashboardSkeleton key="skeleton" />
            ) : (
              <motion.div
                key="content"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="space-y-10"
              >

                {/* ══════════════════════════════════════════
                    SECTION 1 — WELCOME HEADER
                ══════════════════════════════════════════ */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                  {/* Left: greeting */}
                  <ScrollReveal variant="fadeUp">
                    <h1 className="font-heading text-3xl font-bold text-dark leading-tight">
                      {greeting}
                    </h1>
                    <p className="text-gray-text mt-1">{subtext}</p>
                  </ScrollReveal>

                  {/* Right: streak card + lang pill */}
                  <ScrollReveal variant="fadeUp" delay={0.1} className="flex items-center gap-3 flex-wrap">
                    <div className="glass rounded-2xl border-l-4 border-primary px-5 py-3 shrink-0">
                      <p className="font-heading text-2xl font-bold text-primary leading-none">
                        🔥 Day {displayStreak}
                      </p>
                      <p className="text-xs text-gray-text mt-0.5">of checking in</p>
                    </div>
                    {langLabel && (
                      <span className="bg-primary text-white text-xs font-semibold rounded-full px-3 py-1.5 whitespace-nowrap">
                        {langLabel}
                      </span>
                    )}
                    <CrisisStatusIndicator tier={crisisTier} />
                  </ScrollReveal>
                </div>

                {/* ══════════════════════════════════════════
                    SECTION 2 — COMPANION HERO
                ══════════════════════════════════════════ */}
                <motion.section
                  variants={fadeUp}
                  className="relative overflow-hidden rounded-2xl p-7 sm:p-9 text-white"
                  style={{ background: 'linear-gradient(135deg, #0A7C6E, #116b75 55%, #354a83)' }}
                  aria-labelledby="companion-heading"
                >
                  <div className="relative z-10 max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">Your personal AI companion</p>
                    <h2 id="companion-heading" className="font-heading text-3xl sm:text-4xl font-bold leading-tight mt-3">What&apos;s on your mind?</h2>
                    <p className="text-white/80 mt-3 max-w-lg">Talk through a decision, make a plan, untangle a situation, or simply start wherever you are.</p>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <Button variant="outline" size="md" onClick={() => openContextualChat('I want to talk through what is on my mind today.')} className="!bg-white !text-primary !border-white"><MessageCircle size={16} /> Start a conversation</Button>
                      <Button variant="ghost" size="md" onClick={() => router.push('/chat/voice')} className="!text-white hover:!bg-white/10">🎙️ Use voice</Button>
                    </div>
                  </div>
                  <div className="absolute -right-8 -bottom-16 w-56 h-56 rounded-full border border-white/20" aria-hidden="true" />
                  <div className="absolute right-12 top-10 w-20 h-20 rounded-full border border-white/15" aria-hidden="true" />
                </motion.section>

                <MoodCheckIn onTalk={(mood: DailyMood) => openContextualChat(`I checked in as feeling ${mood} today. I want to talk about it.`)} />

                {/* ══════════════════════════════════════════
                    SECTION 3 — LIFE NAVIGATION
                ══════════════════════════════════════════ */}
                <LifeNavigation onSelect={(area) => openContextualChat(AREA_PROMPTS[area] ?? `I want help with ${area}.`)} />

                {/* ══════════════════════════════════════════
                    SECTION 4 — QUICK ACTIONS
                ══════════════════════════════════════════ */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {/* Card 1 — Start a Conversation */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/chat')}
                    className="relative rounded-2xl p-6 min-h-36 cursor-pointer overflow-hidden flex flex-col justify-between"
                    style={{ background: 'linear-gradient(135deg, #0A7C6E, #0d9e8e)' }}
                  >
                    <MessageCircle size={36} className="text-white opacity-90" />
                    <div>
                      <p className="font-heading text-xl font-bold text-white leading-tight">
                        Talk to SaneSpace
                      </p>
                      <p className="text-white text-sm opacity-80 mt-0.5">
                        Let it sit with your thoughts
                      </p>
                      <p className="text-white text-sm font-medium mt-3 underline-offset-2 hover:underline">
                        Start now →
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 2 — Voice */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/chat/voice')}
                    className="glass rounded-2xl p-6 min-h-36 cursor-pointer border border-primary-mid flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                      <span className="text-xl">🎙️</span>
                    </div>
                    <div>
                      <p className="font-heading text-xl font-bold text-dark leading-tight">
                        Voice Check-In
                      </p>
                      <p className="text-gray-text text-sm mt-0.5">
                        Speak naturally, no pressure
                      </p>
                      <p className="text-primary text-sm font-medium mt-3 underline-offset-2 hover:underline">
                        Talk now →
                      </p>
                    </div>
                  </motion.div>

                  {/* Card 3 — Log Mood */}
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/mood')}
                    className="glass rounded-2xl p-6 min-h-36 cursor-pointer border border-primary-mid flex flex-col justify-between"
                  >
                    <Heart size={36} className="text-primary" />
                    <div>
                      <p className="font-heading text-xl font-bold text-dark leading-tight">
                        Check in with yourself
                      </p>
                      <p className="text-gray-text text-sm mt-0.5">
                        Notice where you are today
                      </p>
                      <p className="text-primary text-sm font-medium mt-3 underline-offset-2 hover:underline">
                        Check in →
                      </p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* ══════════════════════════════════════════
                    SECTION 5 — RECENT CONTEXT
                ══════════════════════════════════════════ */}
                <div>
                  <ScrollReveal variant="fadeUp" className="mb-5">
                    <h2 className="font-heading text-2xl font-bold text-dark">
                      Your Recent Context
                    </h2>
                    <p className="text-gray-text text-sm mt-1">
                      Helpful signals from your conversations and check-ins
                    </p>
                  </ScrollReveal>

                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5"
                  >
                    {/* Panel 1 — Your Patterns */}
                    <motion.div
                      variants={scaleIn}
                      className="glass rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🧠</span>
                        <h3 className="font-heading font-bold text-dark">Your Patterns</h3>
                      </div>
                      <p className="text-xs text-gray-text mb-5">
                        What tends to weigh on you
                      </p>
                      {patternEntries.length > 0 ? (
                        <div className="space-y-4">
                          {patternEntries.map((t) => (
                            <PatternBar
                              key={`${t.key}-${t.percent}`}
                              label={t.label}
                              percent={t.percent}
                              color={t.color}
                              updatedRecently={t.updatedRecently}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-text italic">
                          No patterns yet — they&apos;ll appear here as you chat and check in.
                        </p>
                      )}
                    </motion.div>

                    {/* Panel 2 — What Lifts You */}
                    <motion.div
                      variants={scaleIn}
                      className="glass rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">☀️</span>
                        <h3 className="font-heading font-bold text-dark">What Lifts You</h3>
                      </div>
                      <p className="text-xs text-gray-text mb-4">
                        Your personal resilience anchors
                      </p>

                      {resiliencePills.length > 0 ? (
                        <>
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="flex flex-wrap gap-2"
                          >
                            {resiliencePills.map((pill) => (
                              <motion.span
                                key={pill}
                                variants={scaleIn}
                                className="bg-primary text-white text-sm rounded-full px-3 py-1 font-medium"
                              >
                                {pill}
                              </motion.span>
                            ))}
                          </motion.div>
                          <p className="text-xs text-gray-400 italic mt-4 leading-relaxed">
                            &ldquo;These are the things that have shown up in your good-mood entries.&rdquo;
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-text italic">
                          Log a few good-mood check-ins and SaneSpace will start surfacing what lifts you here.
                        </p>
                      )}
                    </motion.div>

                    {/* Panel 3 — Your Journey */}
                    <motion.div
                      variants={scaleIn}
                      className="glass rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">✨</span>
                        <h3 className="font-heading font-bold text-dark">Your Journey</h3>
                      </div>
                      <p className="text-xs text-gray-text mb-4">The past 7 days</p>

                      <p className="text-sm text-dark italic leading-relaxed mb-5">
                        &ldquo;{narrative}&rdquo;
                      </p>

                      {/* Mini mood timeline */}
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="flex justify-between gap-1"
                      >
                        {timelineEntries.map((entry, i) => {
                          const isToday = i === timelineEntries.length - 1
                          const emoji = entry.mood ? (MOOD_EMOJI_MAP[entry.mood] ?? '😐') : '➖'
                          const day = getDayAbbr(entry.date)
                          return (
                            <motion.div
                              key={entry.id}
                              variants={scaleIn}
                              className="flex flex-col items-center gap-1 flex-1"
                            >
                              <div
                                className={`flex items-center justify-center rounded-full text-sm leading-none
                                  ${isToday ? 'w-9 h-9 ring-2 ring-primary ring-offset-1' : 'w-7 h-7'}
                                  ${entry.mood ? 'bg-primary-light' : 'bg-surface border border-border'}`}
                              >
                                {emoji}
                              </div>
                              <span className="text-[9px] text-gray-400 leading-none">{day}</span>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* ══════════════════════════════════════════
                    RECENT CHECK-INS
                ══════════════════════════════════════════ */}
                <ScrollReveal variant="fadeUp">
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-heading font-bold text-dark text-lg">
                        Your Recent Check-ins
                      </h2>
                      <span className="text-xs text-gray-400 font-medium">{dateRange}</span>
                    </div>

                    <MoodChart entries={chartEntries} />

                    {/* Stat pills */}
                    <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border">
                      {[
                        `📊 ${chartEntries.filter(e => e.mood).length} check-ins this week`,
                        ...(moodTrendLabel ? [moodTrendLabel] : []),
                        `🔥 ${displayStreak} day streak`,
                      ].map((s) => (
                        <span
                          key={s}
                          className="bg-surface border border-border rounded-full px-4 py-2 text-sm text-gray-text font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* ══════════════════════════════════════════
                    SECTION 4 — BOTTOM ROW
                ══════════════════════════════════════════ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* LEFT — Recent Conversations */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <ScrollReveal variant="fadeUp">
                        <h2 className="font-heading font-bold text-dark text-lg">
                          Recent Conversations
                        </h2>
                      </ScrollReveal>
                      <ScrollReveal variant="fadeUp" delay={0.1}>
                        <Link
                          href="/chat"
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View all →
                        </Link>
                      </ScrollReveal>
                    </div>

                    {conversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 glass rounded-2xl">
                        <span className="text-5xl mb-3">💬</span>
                        <p className="font-medium text-dark mb-1">No conversations yet</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/chat')}
                        >
                          Start your first conversation →
                        </Button>
                      </div>
                    ) : (
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="glass rounded-2xl overflow-hidden"
                      >
                        {conversations.map((conv, i) => (
                          <ConvCard
                            key={conv.id}
                            conv={conv}
                            onClick={() => router.push('/chat')}
                            isLast={i === conversations.length - 1}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* RIGHT — AI Recommendations */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <ScrollReveal variant="fadeUp">
                        <h2 className="font-heading font-bold text-dark text-lg">
                          For You Today
                        </h2>
                      </ScrollReveal>
                      <ScrollReveal variant="fadeUp" delay={0.1}>
                        <span className="text-xs text-gray-text bg-surface border border-border rounded-full px-3 py-1">
                          Updated daily
                        </span>
                      </ScrollReveal>
                    </div>

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="glass rounded-2xl overflow-hidden space-y-0.5"
                    >
                      {recommendations.map((rec) => (
                        <RecoCard key={rec.id} rec={rec} />
                      ))}
                    </motion.div>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
