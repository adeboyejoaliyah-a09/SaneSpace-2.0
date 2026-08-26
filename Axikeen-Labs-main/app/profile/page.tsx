'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Pencil, Lock, Trash2 } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import Button from '@/components/ui/Button'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { fadeUp } from '@/lib/animations'
import type { StoredUserMemory } from '@/lib/memoryExtraction'

// ─── Constants ───────────────────────────────────────────────────────────────

const SPEC_MODES = [
  { key: 'therapy', emoji: '🛋️', title: 'Therapy Support', desc: 'CBT & DBT techniques' },
  { key: 'coaching', emoji: '🎯', title: 'Life Coaching', desc: 'Goals & accountability' },
  { key: 'talk', emoji: '💬', title: 'Just to Talk', desc: 'No agenda, listening ear' },
  { key: 'student', emoji: '📚', title: 'Student Support', desc: 'Campus life & stress' },
  { key: 'chill', emoji: '🎮', title: 'Chill / Play', desc: 'Low-pressure, fun' },
  { key: 'work', emoji: '💼', title: 'Work & Career', desc: 'Burnout & ambition' },
]

const LANG_PROFILES = [
  { key: 'pidgin', emoji: '🇳🇬', title: 'Nigerian Pidgin', desc: "Dey, abeg, wahala — I get you" },
  { key: 'lagos', emoji: '🗣️', title: 'Lagos English', desc: 'Fast, real, code-switching' },
  { key: 'student', emoji: '🎓', title: 'Student English', desc: 'Campus life mixed' },
  { key: 'home', emoji: '🏠', title: 'Nigerian Home English', desc: 'Formal, family-oriented' },
  { key: 'neutral', emoji: '🌍', title: 'Neutral / International', desc: 'Standard English' },
]

const SPEC_LABEL_TO_KEY: Record<string, string> = {
  'Therapy Support': 'therapy', 'Life Coaching': 'coaching',
  'Just to Talk': 'talk', 'Student Support': 'student',
  'Chill / Play': 'chill', 'Work & Career': 'work',
}
const SPEC_KEY_TO_LABEL: Record<string, string> = {
  therapy: 'Therapy Support', coaching: 'Life Coaching',
  talk: 'Just to Talk', student: 'Student Support',
  chill: 'Chill / Play', work: 'Work & Career',
}
const LANG_LABEL_TO_KEY: Record<string, string> = {
  'Nigerian Pidgin': 'pidgin', 'Lagos English': 'lagos',
  'Student English': 'student', 'Nigerian Home English': 'home',
  'Neutral / International': 'neutral',
}
const LANG_KEY_TO_LABEL: Record<string, string> = {
  pidgin: 'Nigerian Pidgin', lagos: 'Lagos English',
  student: 'Student English', home: 'Nigerian Home English',
  neutral: 'Neutral / International',
}

const REMINDER_TIMES = ['8:00 AM', '9:00 AM', '12:00 PM', '6:00 PM', '9:00 PM']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function calcStreak(entries: { date: string }[]): number {
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (entries.some((e) => new Date(e.date).toDateString() === d.toDateString())) streak++
    else break
  }
  return streak
}

// ─── useCountUp ───────────────────────────────────────────────────────────────

function useCountUp(target: number) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    if (target === 0) { setCount(0); return }
    const increment = Math.max(1, Math.ceil(target / 20))
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, target)
      setCount(current)
      if (current >= target) clearInterval(timer)
    }, 50)
    return () => clearInterval(timer)
  }, [inView, target])

  return { count, ref }
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onChange}
      className={`relative flex items-center rounded-full shrink-0 transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        ${checked ? 'bg-primary' : 'bg-gray-200'}`}
      style={{ width: 44, height: 24 }}
      aria-pressed={checked}
    >
      <motion.div
        className="bg-white rounded-full shadow-sm"
        style={{ width: 18, height: 18 }}
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ emoji, label, target }: { emoji: string; label: string; target: number }) {
  const { count, ref } = useCountUp(target)
  return (
    <div ref={ref} className="bg-primary-light rounded-xl p-4 text-center">
      <div className="text-2xl leading-none mb-2">{emoji}</div>
      <div className="font-bold text-2xl text-dark leading-tight">{count}</div>
      <div className="text-xs text-gray-text mt-1 leading-snug">{label}</div>
    </div>
  )
}

// ─── SelectionCard ────────────────────────────────────────────────────────────

function SelectionCard({
  selected,
  onClick,
  emoji,
  title,
  desc,
}: {
  selected: boolean
  onClick: () => void
  emoji: string
  title: string
  desc: string
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer
        transition-colors duration-150
        ${selected
          ? 'border-2 border-primary bg-primary-light'
          : 'border border-border hover:border-primary-mid'
        }`}
    >
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary
              flex items-center justify-center"
          >
            <span className="text-white text-[8px] font-bold leading-none">✓</span>
          </motion.div>
        )}
      </AnimatePresence>
      <span className="text-2xl leading-none shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="font-medium text-sm text-dark leading-tight">{title}</p>
        <p className="text-xs text-gray-text mt-0.5 leading-snug">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [preferences, setPreferences] = useState({
    specialisation: 'talk',
    languageProfile: 'neutral',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [memoryEntries, setMemoryEntries] = useState<StoredUserMemory[]>([])
  const [memoryEnabled, setMemoryEnabled] = useState(true)

  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [editName, setEditName] = useState('')
  const [wellnessGoal, setWellnessGoal] = useState('')
  const [displayWellnessGoal, setDisplayWellnessGoal] = useState('Not set')

  const [dailyReminder, setDailyReminder] = useState(false)
  const [reminderTime, setReminderTime] = useState('9:00 AM')

  const [stats, setStats] = useState({
    checkIns: 0, streak: 0, conversations: 0, daysSince: 1,
  })

  // ── Mount: load prefs + stats ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('sane_user_preferences') ?? '{}',
      ) as Record<string, string>
      const specKey =
        SPEC_LABEL_TO_KEY[saved.specialisation] ?? saved.specialisation ?? 'talk'
      const langKey =
        LANG_LABEL_TO_KEY[saved.languageProfile] ?? saved.languageProfile ?? 'neutral'
      setPreferences({ specialisation: specKey, languageProfile: langKey })
      setWellnessGoal(saved.wellnessGoal ?? '')
      setDisplayWellnessGoal(saved.wellnessGoal || 'Not set')
    } catch {}

    try {
      const moodE = JSON.parse(
        localStorage.getItem('sane_mood_entries') ?? '[]',
      ) as { date: string }[]
      const convs = JSON.parse(localStorage.getItem('sane_conversations') ?? '[]') as unknown[]
      setStats((prev) => ({
        ...prev,
        checkIns: moodE.length,
        streak: calcStreak(moodE),
        conversations: convs.length,
      }))
    } catch {}

    try {
      const storedMemory = JSON.parse(localStorage.getItem('sane_user_memory') ?? '[]') as StoredUserMemory[]
      setMemoryEntries(storedMemory)
      const disabled = localStorage.getItem('sane_memory_disabled') === 'true'
      setMemoryEnabled(!disabled)
    } catch {}
  }, [])

  // ── Sync session user ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    setEditName(`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
    const created = user.createdAt ? new Date(user.createdAt) : null
    const days = created
      ? Math.max(1, Math.floor((Date.now() - created.getTime()) / 86400000))
      : 1
    setStats((prev) => ({ ...prev, daysSince: days }))
  }, [user])

  // ── Derived ───────────────────────────────────────────────────────────────
  const firstName = user?.firstName ?? 'User'
  const fullName = user?.fullName || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User'
  const email = user?.email ?? ''
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long', year: 'numeric',
      })
    : 'Recently'

  // ── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (section: string) => {
    setSavedSection(section)
    setTimeout(() => setSavedSection(null), 2500)
  }

  // ── Save personal ─────────────────────────────────────────────────────────
  const handleSavePersonal = async () => {
    setIsSaving(true)
    try {
      const [fn, ...lnParts] = editName.trim().split(/\s+/)
      const nextFirstName = fn || user?.firstName || 'User'
      const nextLastName = lnParts.join(' ')

      if (user && editName && editName !== fullName) {
        const saved = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
        saved.firstName = nextFirstName
        saved.lastName = nextLastName
        localStorage.setItem('sane_user_preferences', JSON.stringify(saved))
      }

      const saved = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      saved.wellnessGoal = wellnessGoal
      localStorage.setItem('sane_user_preferences', JSON.stringify(saved))
      setDisplayWellnessGoal(wellnessGoal || 'Not set')
    } catch (err) { console.error(err) }
    setTimeout(() => {
      setIsSaving(false)
      setIsEditingPersonal(false)
      showToast('personal')
    }, 800)
  }

  // ── Save preferences ──────────────────────────────────────────────────────
  const handleSavePreferences = () => {
    setIsSaving(true)
    try {
      const saved = JSON.parse(localStorage.getItem('sane_user_preferences') ?? '{}')
      saved.specialisation =
        SPEC_KEY_TO_LABEL[preferences.specialisation] ?? preferences.specialisation
      saved.languageProfile =
        LANG_KEY_TO_LABEL[preferences.languageProfile] ?? preferences.languageProfile
      localStorage.setItem('sane_user_preferences', JSON.stringify(saved))
    } catch {}
    setTimeout(() => {
      setIsSaving(false)
      showToast('preferences')
    }, 600)
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sane_'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {}
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const handleDeleteMemory = (memoryId: string) => {
    const next = memoryEntries.filter((memory) => memory.id !== memoryId)
    setMemoryEntries(next)
    try {
      localStorage.setItem('sane_user_memory', JSON.stringify(next))
    } catch {}
  }

  const handleClearMemory = () => {
    setMemoryEntries([])
    try {
      localStorage.setItem('sane_user_memory', JSON.stringify([]))
    } catch {}
  }

  const handleToggleMemory = () => {
    const next = !memoryEnabled
    setMemoryEnabled(next)
    try {
      localStorage.setItem('sane_memory_disabled', String(!next))
    } catch {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen mesh-light">
      <Sidebar userName={firstName} />

      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-8">
        <div className="max-w-3xl mx-auto px-6 py-10">

          {/* Page header */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <h1 className="font-heading text-3xl font-bold text-dark">Your Profile</h1>
            <p className="text-gray-text text-sm mt-1">Manage your SaneSpace experience</p>
          </motion.div>

          {/* ══════════════════════════════════════════
              SECTION 1 — PERSONAL INFO
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" className="mb-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-dark text-lg">Personal Info</h2>
                {!isEditingPersonal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingPersonal(true)}
                  >
                    <Pencil size={13} className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Avatar + name + email */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center
                  text-white text-2xl font-bold shrink-0 ring-4 ring-primary/20">
                  {getInitials(fullName)}
                </div>
                <div>
                  <p className="font-semibold text-xl text-dark">{fullName}</p>
                  <p className="text-sm text-gray-text">{email}</p>
                </div>
              </div>

              {/* View mode */}
              {!isEditingPersonal ? (
                <div className="border-t border-border">
                  {[
                    { label: 'Full Name', value: fullName },
                    { label: 'Email', value: email || '—' },
                    { label: 'Member Since', value: memberSince },
                    { label: 'Wellness Goal', value: displayWellnessGoal },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      className={`flex justify-between items-center py-3 ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-text">{row.label}</span>
                      <span className="text-sm text-dark font-medium text-right max-w-[60%] truncate">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Edit mode */
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-border pt-4 space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-dark mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm text-dark bg-surface
                        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm
                        text-gray-text bg-surface/50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1 ml-1">
                      Managed by your Google account — update in Google settings
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-dark mb-1.5 block">
                      Wellness Goal
                    </label>
                    <input
                      type="text"
                      value={wellnessGoal}
                      onChange={(e) => setWellnessGoal(e.target.value)}
                      placeholder="e.g. Reduce anxiety, sleep better..."
                      className="w-full border border-border rounded-full px-4 py-2.5 text-sm text-dark bg-surface
                        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                        placeholder-gray-400"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      loading={isSaving}
                      onClick={handleSavePersonal}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      onClick={() => setIsEditingPersonal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollReveal>

          {/* ══════════════════════════════════════════
              SECTION 2 — MY SANESPACE
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" delay={0.1} className="mb-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold text-dark text-lg">My SaneSpace</h2>
              <p className="text-sm text-gray-text mt-0.5 mb-6">
                Change how SaneSpace shows up for you
              </p>

              {/* Companion Mode */}
              <p className="text-sm font-medium text-dark mb-3">Companion Mode</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-7">
                {SPEC_MODES.map((mode) => (
                  <SelectionCard
                    key={mode.key}
                    emoji={mode.emoji}
                    title={mode.title}
                    desc={mode.desc}
                    selected={preferences.specialisation === mode.key}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, specialisation: mode.key }))
                    }
                  />
                ))}
              </div>

              {/* Language Profile */}
              <p className="text-sm font-medium text-dark mb-1">Language Profile</p>
              <p className="text-xs text-gray-text mb-3">
                How SaneSpace understands and responds to you
              </p>
              <div className="flex flex-col gap-2 mb-6">
                {LANG_PROFILES.map((lang) => (
                  <SelectionCard
                    key={lang.key}
                    emoji={lang.emoji}
                    title={lang.title}
                    desc={lang.desc}
                    selected={preferences.languageProfile === lang.key}
                    onClick={() =>
                      setPreferences((prev) => ({ ...prev, languageProfile: lang.key }))
                    }
                  />
                ))}
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="primary"
                  size="md"
                  loading={isSaving}
                  onClick={handleSavePreferences}
                  className="w-full"
                >
                  Save Preferences
                </Button>
              </motion.div>
            </div>
          </ScrollReveal>

          {/* ══════════════════════════════════════════
              SECTION 3 — MEMORY & CONTEXT
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" delay={0.2} className="mb-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-semibold text-dark text-lg">Memory & Context</h2>
                  <p className="text-sm text-gray-text mt-0.5">
                    Your personal context, controlled by you
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${memoryEnabled ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-500'}`}>
                    {memoryEnabled ? 'Memory on' : 'Memory off'}
                  </span>
                  <ToggleSwitch checked={memoryEnabled} onChange={handleToggleMemory} />
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {memoryEntries.length > 0 ? (
                  memoryEntries.slice(0, 4).map((memory) => (
                    <div key={memory.id} className="rounded-xl border border-border bg-surface p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center rounded-full bg-primary-light text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-1">
                          {memory.memoryType}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-sm text-dark leading-relaxed">{memory.content}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-text">
                        <span>{memory.category}</span>
                        <span>{Math.round(memory.confidenceScore * 100)}% confidence</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-gray-text">
                    SaneSpace hasn&apos;t stored any personal memories yet. Start chatting or logging your mood to build a memory profile.
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" size="sm" onClick={handleClearMemory} disabled={memoryEntries.length === 0}>
                  Clear memories
                </Button>
                <Button variant="ghost" size="sm" onClick={handleToggleMemory}>
                  {memoryEnabled ? 'Disable memory' : 'Enable memory'}
                </Button>
              </div>
            </div>
          </ScrollReveal>

          {/* ══════════════════════════════════════════
              SECTION 4 — NOTIFICATIONS
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" delay={0.3} className="mb-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold text-dark text-lg mb-5">Notifications</h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-dark">Daily Check-In Reminder</p>
                  <p className="text-xs text-gray-text mt-0.5">
                    Get a gentle nudge to log your mood each day
                  </p>
                </div>
                <ToggleSwitch
                  checked={dailyReminder}
                  onChange={() => setDailyReminder((v) => !v)}
                />
              </div>

              <AnimatePresence>
                {dailyReminder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm text-dark font-medium">Reminder Time</span>
                      <select
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="border border-border rounded-xl px-3 py-1.5 text-sm bg-surface
                          focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                      >
                        {REMINDER_TIMES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>

          {/* ══════════════════════════════════════════
              SECTION 5 — STATS
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" delay={0.4} className="mb-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold text-dark text-lg mb-5">Your Journey So Far</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard emoji="📅" label="Total Check-ins" target={stats.checkIns} />
                <StatCard emoji="🔥" label="Current Streak" target={stats.streak} />
                <StatCard emoji="💬" label="Conversations" target={stats.conversations} />
                <StatCard emoji="🌿" label="Days Since Joining" target={stats.daysSince} />
              </div>
            </div>
          </ScrollReveal>

          {/* ══════════════════════════════════════════
              SECTION 6 — ACCOUNT
          ══════════════════════════════════════════ */}
          <ScrollReveal variant="fadeUp" delay={0.5} className="mb-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-semibold text-dark text-lg mb-5">Account</h2>

              {/* Change Password */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <Lock size={18} className="text-gray-400 shrink-0" />
                  <span className="font-medium text-sm text-dark">Change Password</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open('https://myaccount.google.com/security', '_blank')}
                >
                  Update →
                </Button>
              </div>

              {/* Delete Account */}
              <div className="flex items-start justify-between pt-4">
                <div className="flex items-start gap-2.5">
                  <Trash2 size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-red-400">Delete Account</p>
                    <p className="text-xs text-gray-text mt-0.5">
                      This will permanently delete all your data
                    </p>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete →
                </Button>
              </div>
            </div>
          </ScrollReveal>

        </div>
      </main>

      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass rounded-2xl p-6 max-w-sm w-full mx-4"
            >
              <p className="text-4xl text-center mb-3">⚠️</p>
              <h3 className="font-semibold text-xl text-dark text-center">Are you sure?</h3>
              <p className="text-sm text-gray-text text-center mt-2 leading-relaxed">
                This will permanently delete your account and all your SaneSpace data.
                This cannot be undone.
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleDeleteAccount}
                  className="w-full"
                >
                  Yes, delete my account
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          SUCCESS TOAST
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {savedSection && (
          <motion.div
            key={savedSection}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3, ease: 'easeOut' as const }}
            className="fixed bottom-6 right-6 z-50 glass border-l-4 border-green-400
              rounded-xl shadow-lg px-4 py-3 flex items-center gap-2"
          >
            <span className="text-green-500 font-bold text-sm">✓</span>
            <span className="text-sm text-dark font-medium">Changes saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
