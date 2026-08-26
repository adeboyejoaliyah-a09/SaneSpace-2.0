'use client'

import { useEffect, useRef, useState } from 'react'
import type { ElementType } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageCircle, Globe, Shield, Brain, Layers, Zap, Sparkles, CheckCircle, ArrowLeft,
} from 'lucide-react'
import { assessCrisis, type CrisisAssessment, type CrisisTier } from '@/lib/crisisDetection'
import type { Message } from '@/lib/types'

// ─── Types & constants ─────────────────────────────────────────────────────

type ChatApiResponse = {
  message: string
  detectedMode?: string
  reasoning?: Message['reasoning']
  crisisAssessment?: CrisisAssessment
  hardStop?: boolean
}

const MODE_EMOJI: Record<string, string> = {
  listening: '👂 Listening',
  coach: '🎯 Coach',
  explorer: '🔭 Explorer',
  companion: '🤝 Companion',
  care: '❤️ Care',
}

const CRISIS_LABEL: Record<CrisisTier, string> = {
  safe: 'Safe ✓',
  monitor: 'Monitor ⚠',
  escalate: 'Escalate 🚨',
  stop: 'Hard stop 🛑',
}

const CRISIS_ICON_BG: Record<CrisisTier, string> = {
  safe: 'bg-green-100 text-green-600',
  monitor: 'bg-amber-100 text-amber-600',
  escalate: 'bg-orange-100 text-orange-600',
  stop: 'bg-red-100 text-red-600',
}

const STAGE_DELAYS = [0, 300, 600, 900, 1200, 1500, 1800, 2100]

const STATS = [
  { label: 'Pipeline Steps', value: '8' },
  { label: 'Avg Response', value: '~400ms' },
  { label: 'Language Profiles', value: '5' },
  { label: 'Crisis Tiers', value: '4' },
]

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ArchitecturePage() {
  const router = useRouter()

  const [demoInput, setDemoInput] = useState('')
  const [activeNode, setActiveNode] = useState(-1)
  const [running, setRunning] = useState(false)
  const [liveCrisis, setLiveCrisis] = useState<CrisisAssessment | null>(null)
  const [response, setResponse] = useState<ChatApiResponse | null>(null)
  const [responseTime, setResponseTime] = useState<number | null>(null)
  const [langProfile, setLangProfile] = useState('Neutral / International')
  const [patternCount, setPatternCount] = useState(3)

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      if (prefs.languageProfile) setLangProfile(prefs.languageProfile)
    } catch {}
    try {
      const stored = JSON.parse(localStorage.getItem('sane_memory_confidence') ?? '{}')
      const count = Object.keys(stored).length
      if (count > 0) setPatternCount(count)
    } catch {}

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const runPipeline = async () => {
    const text = demoInput.trim()
    if (!text || running) return

    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    setRunning(true)
    setResponse(null)
    setResponseTime(null)
    setActiveNode(-1)
    setLiveCrisis(assessCrisis(text, []))

    STAGE_DELAYS.forEach((delay, i) => {
      const t = setTimeout(() => {
        setActiveNode(i)
        if (i === STAGE_DELAYS.length - 1) setRunning(false)
      }, delay)
      timeoutsRef.current.push(t)
    })

    let prefs: { specialisation?: string; languageProfile?: string; firstName?: string } = {}
    try {
      prefs = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
    } catch {}

    const demoMessage: Message = {
      id: 'demo-msg',
      conversationId: 'demo',
      sender: 'user',
      content: text,
      adaptiveMode: 'listening',
      timestamp: new Date().toISOString(),
    }

    const start = performance.now()
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [demoMessage],
          specialisation: prefs.specialisation ?? 'Just to Talk',
          languageProfile: prefs.languageProfile ?? 'Neutral / International',
          activeMode: 'listening',
          userName: prefs.firstName ?? 'there',
        }),
      })
      const data = (await res.json()) as ChatApiResponse
      setResponse(data)
    } catch {
      setResponse({
        message: 'Unable to reach the AI service right now. Please try again.',
        detectedMode: 'listening',
      })
    } finally {
      setResponseTime(Math.round(performance.now() - start))
    }
  }

  // ── Pipeline node definitions ──────────────────────────────────────────────
  const crisisTier = liveCrisis?.tier ?? null
  const detectedMode = response?.detectedMode

  const nodes: { title: string; icon: ElementType; output: string; iconBg: string; pulse?: boolean }[] = [
    {
      title: 'USER INPUT',
      icon: MessageCircle,
      iconBg: 'bg-gray-100 text-gray-500',
      output: demoInput ? truncate(demoInput, 40) : 'Waiting for input…',
    },
    {
      title: 'LANGUAGE DETECTION',
      icon: Globe,
      iconBg: 'bg-primary-light text-primary',
      output: langProfile,
    },
    {
      title: 'CRISIS CHECK',
      icon: Shield,
      iconBg: crisisTier ? CRISIS_ICON_BG[crisisTier] : 'bg-gray-100 text-gray-400',
      output: crisisTier ? CRISIS_LABEL[crisisTier] : 'Awaiting input…',
    },
    {
      title: 'MEMORY RETRIEVAL',
      icon: Brain,
      iconBg: 'bg-purple-100 text-purple-600',
      output: `Top patterns loaded (${patternCount})`,
    },
    {
      title: 'PROMPT ASSEMBLY',
      icon: Layers,
      iconBg: 'bg-primary-light text-primary',
      output: '4 blocks assembled',
    },
    {
      title: 'GROQ LLM',
      icon: Zap,
      iconBg: 'bg-amber-100 text-amber-600',
      output: `llama-3.3-70b-versatile · ${responseTime !== null ? `${responseTime}ms` : '~400ms'}`,
      pulse: true,
    },
    {
      title: 'MODE DETECTION',
      icon: Sparkles,
      iconBg: 'bg-primary-light text-primary',
      output: detectedMode ? (MODE_EMOJI[detectedMode] ?? detectedMode) : 'Detecting…',
    },
    {
      title: 'RESPONSE + MEMORY UPDATE',
      icon: CheckCircle,
      iconBg: 'bg-green-100 text-green-600',
      output: response ? 'Response delivered · Memory updated' : 'Processing…',
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center">
            <span className="font-heading font-bold text-xl text-dark">Sane</span>
            <span className="font-heading font-bold text-xl text-primary">Space</span>
          </Link>
          <span className="hidden sm:inline text-sm text-gray-400 font-medium border-l border-gray-200 pl-3">
            AI Architecture
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-primary-light text-primary text-xs font-semibold rounded-full px-3 py-1.5">
            Demo Mode
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-gray-text hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to App</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark">
            How SaneSpace Thinks
          </h1>
          <p className="text-gray-text mt-2">A real-time view of the AI reasoning pipeline</p>
        </div>

        {/* Live demo input */}
        <div className="flex gap-2 max-w-2xl mx-auto mb-12">
          <input
            value={demoInput}
            onChange={(e) => setDemoInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runPipeline()
            }}
            placeholder="Type a message to see the pipeline activate..."
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <button
            onClick={runPipeline}
            disabled={!demoInput.trim() || running}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-medium shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all"
          >
            Run Pipeline
          </button>
        </div>

        {/* Pipeline */}
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-center gap-1 mb-10">
          {nodes.map((node, i) => (
            <div key={node.title} className="flex flex-col md:flex-row md:items-center">
              <PipelineNode {...node} active={activeNode >= i} />
              {i < nodes.length - 1 && <Connector active={activeNode > i} />}
            </div>
          ))}
        </div>

        {/* Real output panel */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 max-w-2xl mx-auto mb-6">
          <p className="text-primary font-medium text-sm mb-2">Groq Response:</p>
          {response ? (
            <>
              <p className="text-sm text-dark leading-relaxed whitespace-pre-line">{response.message}</p>
              {responseTime !== null && (
                <p className="text-xs text-gray-400 mt-3">Response time: {responseTime}ms</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {running ? 'Waiting for response…' : 'Run the pipeline to see a real response here.'}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
              <p className="font-heading text-xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-gray-text mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PipelineNode ───────────────────────────────────────────────────────────

function PipelineNode({
  icon: Icon,
  title,
  output,
  iconBg,
  active,
  pulse,
}: {
  icon: ElementType
  title: string
  output: string
  iconBg: string
  active: boolean
  pulse?: boolean
}) {
  return (
    <motion.div
      animate={active ? { scale: 1.03 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`bg-white rounded-2xl p-4 flex flex-col items-center text-center w-full md:w-[140px] shrink-0 transition-all duration-300
        ${active ? 'border-2 border-primary opacity-100' : 'border border-gray-100 opacity-40'}`}
      style={active ? { boxShadow: '0 0 0 4px rgba(10,124,110,0.1)' } : undefined}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${iconBg} ${
          active && pulse ? 'animate-pulse' : ''
        }`}
      >
        <Icon size={18} />
      </div>
      <p className="font-semibold text-xs text-dark leading-snug">{title}</p>
      <p className="text-[11px] text-gray-400 mt-1 leading-snug break-words">{output}</p>
    </motion.div>
  )
}

// ─── Connector ──────────────────────────────────────────────────────────────

function Connector({ active }: { active: boolean }) {
  return (
    <>
      {/* Horizontal connector (desktop) */}
      <div className="hidden md:flex items-center justify-center w-6 shrink-0">
        <svg width="24" height="16" className="overflow-visible">
          <line x1="0" y1="8" x2="24" y2="8" stroke="#E5E7EB" strokeWidth="2" />
          {active && (
            <motion.circle
              cy={8}
              r={3}
              fill="#0A7C6E"
              initial={{ cx: 0 }}
              animate={{ cx: 24 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>

      {/* Vertical connector (mobile) */}
      <div className="md:hidden flex items-center justify-center h-6">
        <svg width="16" height="24" className="overflow-visible">
          <line x1="8" y1="0" x2="8" y2="24" stroke="#E5E7EB" strokeWidth="2" />
          {active && (
            <motion.circle
              cx={8}
              r={3}
              fill="#0A7C6E"
              initial={{ cy: 0 }}
              animate={{ cy: 24 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </div>
    </>
  )
}
