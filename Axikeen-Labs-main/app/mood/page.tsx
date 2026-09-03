'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import Sidebar from '@/components/layout/Sidebar'
import PillChip from '@/components/ui/PillChip'
import Button from '@/components/ui/Button'
import { staggerContainer, scaleIn, fadeUp } from '@/lib/animations'
import { extractEmotionalMemory } from '@/lib/memoryExtraction'

// ─── Constants ───────────────────────────────────────────────────────────────

const MOODS = [
  { emoji: '😔', label: 'Low' },
  { emoji: '😕', label: 'Meh' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
]

const TRIGGERS = [
  'Deadlines', 'Family', 'Money', 'Sleep',
  'Relationships', 'Work', 'Health', 'Just a feeling',
]

const MOOD_EMOJI: Record<string, string> = {
  Low: '😔', Meh: '😕', Okay: '😐', Good: '🙂', Great: '😄',
}

const AI_INSIGHT: Record<string, string> = {
  Low: "A low day is worth noticing. You do not have to figure everything out at once.",
  Meh: "Meh days are data too. A small next step is enough for now.",
  Okay: "You are checking in with yourself, and that is useful context for today.",
  Good: "Something is working today. Notice it, and let SaneSpace help you build from there.",
  Great: "You are in a good place today. What would you like to make space for?",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTriggerHeading(mood: string | null) {
  if (mood === 'Good' || mood === 'Great') return "What's going well? Pick what fits."
  if (mood === 'Okay' || mood === 'Meh') return "What's on your mind today?"
  return "What's taking up space today? Pick what fits."
}

function getJournalPlaceholder(mood: string | null) {
  if (mood === 'Good' || mood === 'Great') return "Today I'm grateful for..."
  if (mood === 'Okay' || mood === 'Meh') return "Today I'm thinking about..."
  return "Today has been hard because..."
}

function calcStreak(entries: { date: string }[]): number {
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

const TODAY_LABEL = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
})

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
  title,
  sub,
}: {
  title: string
  sub?: string
}) {
  return (
    <div className="mb-8">
      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="font-heading text-3xl font-bold text-dark"
      >
        {title}
      </motion.h1>
      {sub && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-text mt-1"
        >
          {sub}
        </motion.p>
      )}
    </div>
  )
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((s) => (
        <motion.div
          key={s}
          animate={{ width: s === step ? 20 : 8 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className={`h-2 rounded-full ${s === step ? 'bg-primary' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

function SummaryCard({
  mood,
  trigger,
  note,
}: {
  mood: string | null
  trigger: string | null
  note: string
}) {
  const rows = [
    { label: 'Mood', value: mood ? `${MOOD_EMOJI[mood] ?? ''} ${mood}` : '—' },
    { label: 'Trigger', value: trigger ?? '—' },
    {
      label: 'Note',
      value: note
        ? note.slice(0, 60) + (note.length > 60 ? '…' : '')
        : '—',
    },
  ]
  return (
    <div className="glass rounded-2xl p-5">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex justify-between items-center py-3 ${
            i < rows.length - 1 ? 'border-b border-border' : ''
          }`}
        >
          <span className="text-xs text-gray-text font-medium uppercase tracking-wide">
            {row.label}
          </span>
          <span className="text-sm text-dark font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

type LocalEntry = {
  id: string
  userId: string
  mood: string
  triggerTag: string | null
  note: string | null
  date: string
}

export default function MoodPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)
  const [journalNote, setJournalNote] = useState('')
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const [todayEntry, setTodayEntry] = useState<LocalEntry | null>(null)
  const [streak, setStreak] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const firstName = user?.firstName || 'there'

  useEffect(() => {
    void fetch('/api/mood', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ entries: LocalEntry[] }> : null)
      .then((data) => {
        if (!data) return
        const entries = data.entries
      const todayStr = new Date().toDateString()
      const found = entries.find((e) => new Date(e.date).toDateString() === todayStr)
      if (found) {
        setAlreadyCheckedIn(true)
        setTodayEntry(found)
      }
      setStreak(calcStreak(entries))
      })
      .catch(() => {})
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMoodSelect = (mood: string) => {
    if (selectedMood) return
    setSelectedMood(mood)
    setTimeout(() => setStep(2), 600)
  }

  const saveMoodEntry = async () => {
    if (isSaving) return false
    setIsSaving(true)
    setSaveError('')
    const entry: LocalEntry = {
      id: crypto.randomUUID(),
      userId: user?.id ?? '',
      mood: selectedMood ?? 'Neutral',
      triggerTag: selectedTrigger,
      note: journalNote || null,
      date: new Date().toISOString(),
    }
    try {
      const response = await fetch('/api/mood', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: entry.mood, triggerTag: entry.triggerTag, note: entry.note, date: entry.date }),
      })
      if (!response.ok) throw new Error('Mood could not be saved')
      const data = await response.json() as { entry: LocalEntry; entries: LocalEntry[] }
      setTodayEntry(data.entry)
      setAlreadyCheckedIn(true)
      setStreak(calcStreak(data.entries))

      const extraction = extractEmotionalMemory({
        userId: 'authenticated-user',
        source: 'mood_log',
        text: journalNote,
        moodEntry: {
          mood: selectedMood,
          triggerTag: selectedTrigger,
          note: journalNote,
        },
      })
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memories: extraction.memoriesExtracted }),
      })
      return true
    } catch {
      setSaveError('Your check-in could not be saved. Please try again.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const buildPrefilledMsg = () => {
    let msg = `I just logged that I'm feeling ${selectedMood}.`
    if (selectedTrigger) msg += ` It's related to ${selectedTrigger}.`
    if (journalNote) msg += ` ${journalNote.slice(0, 60)}`
    return msg
  }

  const goToChat = async () => {
    if (!await saveMoodEntry()) return
    try {
      localStorage.setItem('sane_prefilled_message', buildPrefilledMsg())
    } catch {}
    router.push('/chat')
  }

  const goToDashboard = async () => {
    if (!await saveMoodEntry()) return
    router.push('/dashboard')
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen mesh-light">
      <Sidebar userName={firstName} />

      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">

            {/* ═══════════════════════════════════════════
                ALREADY CHECKED IN STATE
            ═══════════════════════════════════════════ */}
            {alreadyCheckedIn ? (
              <motion.div
                key="already"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' as const }}
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="text-center"
                >
                  <motion.div variants={fadeUp} className="text-7xl mb-4 leading-none">
                    {MOOD_EMOJI[todayEntry?.mood ?? ''] ?? '🌿'}
                  </motion.div>
                  <motion.h1
                    variants={fadeUp}
                    className="font-heading text-2xl font-bold text-dark mb-2"
                  >
                    You&apos;ve already checked in today 🌿
                  </motion.h1>
                  <motion.p variants={fadeUp} className="text-base text-gray-text mb-8">
                    Come back tomorrow to keep your streak going.
                  </motion.p>
                </motion.div>

                {todayEntry && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.25 }}
                    className="mb-6"
                  >
                    <SummaryCard
                      mood={todayEntry.mood}
                      trigger={todayEntry.triggerTag}
                      note={todayEntry.note ?? ''}
                    />
                  </motion.div>
                )}

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3"
                >
                  <motion.div variants={fadeUp}>
                    <Button variant="primary" size="lg" onClick={() => router.push('/chat')}
                      className="w-full">
                      Talk to SaneSpace →
                    </Button>
                  </motion.div>
                  <motion.div variants={fadeUp}>
                    <Button variant="outline" size="lg" onClick={() => router.push('/dashboard')}
                      className="w-full">
                      View Dashboard →
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (

            /* ═══════════════════════════════════════════
               STEP FLOW
            ═══════════════════════════════════════════ */
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.28, ease: 'easeOut' as const }}
              >
                {/* Back + progress */}
                <div className="flex items-center justify-between mb-7">
                  {step > 1 ? (
                    <button
                      onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                      className="text-sm text-gray-text hover:text-dark flex items-center gap-1 transition-colors"
                    >
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <ProgressDots step={step} />
                </div>

                {/* ─── STEP 1: MOOD ─── */}
                {step === 1 && (
                  <div>
                    <SectionHeading title="How are you feeling today?" sub={TODAY_LABEL} />

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-5 gap-2 sm:gap-3"
                    >
                      {MOODS.map((mood) => (
                        <motion.div
                          key={mood.label}
                          variants={scaleIn}
                          className="flex flex-col items-center gap-2.5"
                        >
                          <motion.button
                            type="button"
                            role="radio"
                            aria-checked={selectedMood === mood.label}
                            aria-label={`Feeling ${mood.label}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            animate={
                              selectedMood === mood.label
                                ? { scale: 1.08 }
                                : { scale: 1 }
                            }
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            onClick={() => handleMoodSelect(mood.label)}
                            className={`
                              w-full min-w-0 h-[76px] sm:h-[88px] rounded-xl border-2 flex items-center
                              justify-center text-3xl sm:text-4xl leading-none focus:outline-none
                              focus:ring-2 focus:ring-primary transition-colors duration-200
                              ${selectedMood === mood.label
                                ? 'border-primary bg-primary-light'
                                : 'border-border bg-surface hover:border-primary-mid'
                              }
                            `}
                          >
                            <span aria-hidden="true">{mood.emoji}</span>
                          </motion.button>
                          <span
                            className={`text-sm ${
                              selectedMood === mood.label
                                ? 'text-primary font-semibold'
                                : 'text-gray-text'
                            }`}
                          >
                            {mood.label}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Streak card */}
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5 }}
                      className="mt-8 glass rounded-2xl p-4 flex items-center gap-3"
                    >
                      <span className="text-2xl leading-none">🔥</span>
                      <p className="text-sm text-gray-text">
                        {streak > 0
                          ? `Day ${streak} streak — keep it up!`
                          : 'Start your check-in streak today!'}
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* ─── STEP 2: TRIGGER ─── */}
                {step === 2 && (
                  <div>
                    <SectionHeading
                      title="What's behind it?"
                      sub={getTriggerHeading(selectedMood)}
                    />

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-wrap gap-2 mb-6"
                    >
                      {TRIGGERS.map((t) => (
                        <motion.div key={t} variants={scaleIn}>
                          <PillChip
                            label={t}
                            selected={selectedTrigger === t}
                            onClick={() =>
                              setSelectedTrigger(selectedTrigger === t ? null : t)
                            }
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.3 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                      <Button
                        variant="primary"
                        size="md"
                        disabled={!selectedTrigger}
                        onClick={() => setStep(3)}
                      >
                        Continue →
                      </Button>
                      <button
                        onClick={() => {
                          setSelectedTrigger(null)
                          setStep(3)
                        }}
                        className="text-sm text-gray-text hover:text-dark transition-colors"
                      >
                        Skip this →
                      </button>
                    </motion.div>
                  </div>
                )}

                {/* ─── STEP 3: JOURNAL ─── */}
                {step === 3 && (
                  <div>
                    <SectionHeading
                      title="Want to say more?"
                      sub="Optional — write how you're feeling. Just for you."
                    />

                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="mb-6"
                    >
                      <label htmlFor="journal-note" className="sr-only">Optional check-in note</label>
                      <textarea
                        id="journal-note"
                        value={journalNote}
                        onChange={(e) =>
                          setJournalNote(e.target.value.slice(0, 280))
                        }
                        placeholder={getJournalPlaceholder(selectedMood)}
                        rows={5}
                        className="w-full rounded-2xl border border-border p-4 text-sm text-dark
                          placeholder-gray-400 bg-surface resize-none focus:outline-none
                          focus:ring-2 focus:ring-primary focus:border-primary
                          transition-all min-h-[128px] max-h-[192px]"
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">
                        {journalNote.length} / 280
                      </p>
                    </motion.div>

                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="flex gap-3"
                    >
                      <motion.div variants={fadeUp}>
                        <Button variant="ghost" size="md" onClick={() => setStep(4)}>
                          Skip
                        </Button>
                      </motion.div>
                      <motion.div variants={fadeUp}>
                        <Button variant="primary" size="md" onClick={() => setStep(4)}>
                          Save Note →
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}

                {/* ─── STEP 4: CONFIRMATION ─── */}
                {step === 4 && (
                  <div className="text-center">
                    {/* Animated checkmark */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                      className="w-20 h-20 rounded-full bg-primary flex items-center
                        justify-center mx-auto mb-4"
                    >
                      <Check size={32} className="text-white" />
                    </motion.div>

                    <motion.h2
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.2 }}
                      className="font-heading text-2xl font-bold text-dark mb-6"
                    >
                      Logged ✓
                    </motion.h2>

                    {/* Summary card */}
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.35 }}
                      className="mb-4 text-left"
                    >
                      <SummaryCard
                        mood={selectedMood}
                        trigger={selectedTrigger}
                        note={journalNote}
                      />
                    </motion.div>

                    {/* AI insight */}
                    <motion.div
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.5 }}
                      className="text-left bg-primary-light border-l-4 border-primary
                        rounded-xl p-4 mb-6"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none mt-0.5">🧠</span>
                        <div>
                          <p className="text-xs font-semibold text-primary mb-1">
                            SaneSpace noticed:
                          </p>
                          <p className="text-sm text-gray-text leading-relaxed">
                            {AI_INSIGHT[selectedMood ?? ''] ??
                              "Your check-in has been logged 🌿"}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* CTAs */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: 0.65 }}
                      className="flex flex-col gap-3"
                    >
                      <motion.div variants={fadeUp}>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={goToChat}
                          disabled={isSaving}
                          className="w-full"
                        >
                          Talk to SaneSpace about this →
                        </Button>
                      </motion.div>
                      <motion.div variants={fadeUp}>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={goToDashboard}
                          disabled={isSaving}
                          className="w-full"
                        >
                          Back to Dashboard →
                        </Button>
                      </motion.div>
                      {saveError && <p className="text-sm text-red-600" role="alert">{saveError}</p>}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
