'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence } from 'framer-motion'
import OnboardingShell from '@/components/layout/OnboardingShell'
import MoodEmoji from '@/components/ui/MoodEmoji'
import PillChip from '@/components/ui/PillChip'
import Button from '@/components/ui/Button'
import TypingIndicator from '@/components/ui/TypingIndicator'
import { LANGUAGE_DEFINITIONS, normalizeLanguageId } from '@/lib/languages'

// ─── Data ────────────────────────────────────────────────────────────────────

const MOODS = [
  { emoji: '😀', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😣', label: 'Stressed' },
  { emoji: '😟', label: 'Anxious' },
]

const CHALLENGES = [
  'Academic stress',
  'Work burnout',
  'Anxiety',
  'Relationships',
  'Financial pressure',
  'Family pressure',
  'Just exploring',
  'Something else',
]

const MODES = [
  { emoji: '🛋️', title: 'Therapy Support', desc: 'CBT & DBT techniques, structured reflection' },
  { emoji: '🎯', title: 'Life Coaching', desc: 'Goals, accountability, action plans' },
  { emoji: '💬', title: 'Just to Talk', desc: 'No agenda, just a listening ear' },
  { emoji: '📚', title: 'Student Support', desc: 'CGPA stress, hostel life, deadlines' },
  { emoji: '🎮', title: 'Chill / Play', desc: 'Low-pressure, fun, mood boosts' },
  { emoji: '💼', title: 'Work & Career', desc: 'Burnout, ambition, workplace stress' },
]

const LANGUAGES = LANGUAGE_DEFINITIONS.map((language) => ({
  id: language.id,
  emoji: language.emoji,
  title: language.label,
  desc: language.culturalContext === 'nigerian' ? 'Nigerian language and cultural context' : 'Language and cultural context for your world',
}))

type ClosingMsg = { line1: string; body: string; disclaimer?: string }

const CLOSING: Record<string, ClosingMsg> = {
  'Therapy Support': {
    line1: "You've taken a brave step 🌿",
    body: "I'll be here with evidence-based support — CBT, reflection techniques, and a steady space to work through what's on your mind.",
    disclaimer:
      "SaneSpace is not a replacement for professional therapy, but it is here whenever you need a thoughtful place to think.",
  },
  'Life Coaching': {
    line1: "Let's build something 🎯",
    body: "I'll help you set goals, stay accountable, and take real action. Your best self isn't far — let's go find it.",
  },
  'Just to Talk': {
    line1: "I'm here 💬",
    body: "No agenda, no pressure. Whenever you need to talk, just open SaneSpace. I'll always listen.",
  },
  'Student Support': {
    line1: "You've got this 📚",
    body: "Carry-over, CGPA stress, hostel wahala — I understand the pressure. Let's figure it out together.",
  },
  'Chill / Play': {
    line1: "Let's vibe ✨",
    body: "Low pressure, good energy. I'm here whenever you need a light moment or just want to talk.",
  },
  'Work & Career': {
    line1: "Your ambition is valid 💼",
    body: "Let's work through the burnout and build toward what you actually want. One step at a time.",
  },
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5

type Selections = {
  currentMood: string | null
  challenges: string[]
  specialisation: string | null
  languageProfile: string | null
}

const INITIAL_SELECTIONS: Selections = {
  currentMood: null,
  challenges: [],
  specialisation: null,
  languageProfile: null,
}

// ─── AIBubble ────────────────────────────────────────────────────────────────

function AIBubble({
  isTyping,
  children,
}: {
  isTyping: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary shrink-0" />
        <span className="text-xs font-semibold text-primary tracking-wide">SaneSpace</span>
      </div>
      <div className="glass rounded-2xl px-5 py-4 text-dark text-sm leading-relaxed min-h-[64px] max-w-[520px]">
        <AnimatePresence mode="wait">
          {isTyping ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TypingIndicator />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── ModeCard ────────────────────────────────────────────────────────────────

function ModeCard({
  emoji,
  title,
  desc,
  selected,
  onClick,
}: {
  emoji: string
  title: string
  desc: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onClick())}
      className={`relative flex items-center gap-3 p-4 rounded-2xl border cursor-pointer
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary
        ${
          selected
            ? 'border-2 border-primary bg-primary-light'
            : 'border border-border bg-surface hover:border-primary-mid hover:bg-primary-light/40'
        }`}
    >
      {/* Checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.18, type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
          >
            <span className="text-white text-[10px] font-bold leading-none">✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      <span className="text-3xl shrink-0 leading-none">{emoji}</span>
      <div className="min-w-0">
        <p className="font-semibold text-dark text-sm leading-tight">{title}</p>
        <p className="text-gray-text text-xs mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </motion.button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [selections, setSelections] = useState<Selections>(INITIAL_SELECTIONS)
  const [isTyping, setIsTyping] = useState(true)
  const [showContent, setShowContent] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // refs to manage timers
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Start typing → reveal content sequence ──────────────────────────────
  const startTyping = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    setIsTyping(true)
    setShowContent(false)
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false)
      setShowContent(true)
    }, 1200)
  }

  // ── Restore progress / redirect if already done (mount only) ───────────
  useEffect(() => {
    try {
      const prefs = localStorage.getItem('sane_user_preferences')
      if (prefs) {
        const parsed = JSON.parse(prefs) as { onboardingComplete?: boolean }
        if (parsed.onboardingComplete) {
          router.push('/dashboard')
          return
        }
      }
      const saved = localStorage.getItem('sane_onboarding_progress')
      if (saved) {
        const { currentStep: s, selections: sel } = JSON.parse(saved) as {
          currentStep: Step
          selections: Selections
        }
        setCurrentStep(s)
        setSelections({
          ...sel,
          languageProfile: sel.languageProfile ? normalizeLanguageId(sel.languageProfile) : null,
        })
      }
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Trigger typing animation whenever the step changes ─────────────────
  useEffect(() => {
    startTyping()
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  // ── Persist progress on every meaningful state change ───────────────────
  useEffect(() => {
    if (currentStep === 1 && selections.currentMood === null) return
    try {
      localStorage.setItem(
        'sane_onboarding_progress',
        JSON.stringify({ currentStep, selections }),
      )
    } catch {}
  }, [currentStep, selections])

  // ── Navigation helper ───────────────────────────────────────────────────
  const goToStep = (step: Step, delay = 500) => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    stepTimerRef.current = setTimeout(() => setCurrentStep(step), delay)
  }

  // ── Step handlers ───────────────────────────────────────────────────────
  const handleMoodSelect = (label: string) => {
    setSelections((prev) => ({ ...prev, currentMood: label }))
    goToStep(2, 500)
  }

  const toggleChallenge = (label: string) => {
    setSelections((prev) => ({
      ...prev,
      challenges: prev.challenges.includes(label)
        ? prev.challenges.filter((c) => c !== label)
        : [...prev.challenges, label],
    }))
  }

  const handleSpecialisationSelect = (title: string) => {
    setSelections((prev) => ({ ...prev, specialisation: title }))
    goToStep(4, 500)
  }

  const handleLanguageSelect = (id: string) => {
    setSelections((prev) => ({ ...prev, languageProfile: normalizeLanguageId(id) }))
    goToStep(5, 500)
  }

  const handleComplete = async () => {
    setIsSaving(true)
    setSaveError('')
    const profile = {
      specialisation: selections.specialisation,
      languageProfile: normalizeLanguageId(selections.languageProfile),
      currentMood: selections.currentMood,
      challenges: selections.challenges,
      onboardingComplete: true,
      ...(user?.firstName ? { firstName: user.firstName } : {}),
    }

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!response.ok) throw new Error('Unable to save your preferences')

      try {
        localStorage.setItem('sane_user_preferences', JSON.stringify(profile))
        localStorage.removeItem('sane_onboarding_progress')
      } catch {}
      router.push('/dashboard')
    } catch {
      setSaveError('We could not save your space yet. Check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const step2Message = (() => {
    const m = selections.currentMood
    if (m === 'Great' || m === 'Good')
      return "That's good to hear 🙂 What brings you to SaneSpace today? Pick everything that fits."
    if (m === 'Neutral')
      return "Got it. What's been on your mind lately? Pick everything that resonates."
    return "I hear you. You're not alone in this. What's been weighing on you? Pick all that apply."
  })()

  const closing = selections.specialisation ? CLOSING[selections.specialisation] : null
  const summaryMood = MOODS.find((m) => m.label === selections.currentMood)
  const summaryMode = MODES.find((m) => m.title === selections.specialisation)
  const summaryLang = LANGUAGES.find((l) => l.id === normalizeLanguageId(selections.languageProfile))

  // ────────────────────────────────────────────────────────────────────────
  return (
    <OnboardingShell currentStep={currentStep} totalSteps={5}>
      {/* Bottom padding so mobile keyboard doesn't hide content */}
      <div className="pb-24 md:pb-8">
        <AnimatePresence
          mode="wait"
          onExitComplete={startTyping}
        >
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >

            {/* ══════════════════════════════════════════
                STEP 1 — Current Mood
            ══════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div>
                <AIBubble isTyping={isTyping}>
                  <p>Hey, I&apos;m SaneSpace 🌿</p>
                  <p className="mt-1">Before we begin — this is a judgment-free zone.</p>
                  <p className="mt-1 font-medium text-dark">How are you feeling right now?</p>
                </AIBubble>

                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <div className="grid grid-cols-3 gap-3">
                        {MOODS.map((mood) => (
                          <MoodEmoji
                            key={mood.label}
                            emoji={mood.emoji}
                            label={mood.label}
                            selected={selections.currentMood === mood.label}
                            onClick={() => handleMoodSelect(mood.label)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 2 — Challenges
            ══════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div>
                <AIBubble isTyping={isTyping}>
                  <p>{step2Message}</p>
                </AIBubble>

                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <div className="flex flex-wrap gap-2 mb-6">
                        {CHALLENGES.map((c) => (
                          <PillChip
                            key={c}
                            label={c}
                            selected={selections.challenges.includes(c)}
                            onClick={() => toggleChallenge(c)}
                          />
                        ))}
                      </div>

                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
                      >
                        <Button
                          variant="primary"
                          size="md"
                          disabled={selections.challenges.length === 0}
                          onClick={() => goToStep(3, 0)}
                        >
                          Continue →
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 3 — Specialisation Mode
            ══════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div>
                <AIBubble isTyping={isTyping}>
                  <p>How do you want SaneSpace to show up for you?</p>
                  <p className="mt-1 text-gray-text">
                    Pick the one that feels right — you can always change this later.
                  </p>
                </AIBubble>

                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {MODES.map((mode) => (
                        <ModeCard
                          key={mode.title}
                          emoji={mode.emoji}
                          title={mode.title}
                          desc={mode.desc}
                          selected={selections.specialisation === mode.title}
                          onClick={() => handleSpecialisationSelect(mode.title)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 4 — Language Profile
            ══════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div>
                <AIBubble isTyping={isTyping}>
                  <p>Last thing — how do you naturally talk?</p>
                  <p className="mt-1 text-gray-text">SaneSpace will match your style.</p>
                </AIBubble>

                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      {LANGUAGES.map((lang) => (
                        <ModeCard
                          key={lang.title}
                          emoji={lang.emoji}
                          title={lang.title}
                          desc={lang.desc}
                          selected={selections.languageProfile === lang.id}
                          onClick={() => handleLanguageSelect(lang.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══════════════════════════════════════════
                STEP 5 — Closing / Ready
            ══════════════════════════════════════════ */}
            {currentStep === 5 && (
              <div>
                <AIBubble isTyping={isTyping}>
                  {closing ? (
                    <div>
                      <p className="font-semibold text-dark">{closing.line1}</p>
                      <p className="mt-2">{closing.body}</p>
                      {closing.disclaimer && (
                        <p className="mt-2 text-xs text-gray-400">{closing.disclaimer}</p>
                      )}
                    </div>
                  ) : (
                    <p>Welcome to SaneSpace 🌿 You&apos;re all set.</p>
                  )}
                </AIBubble>

                <AnimatePresence>
                  {showContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      {/* Summary card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.5, ease: 'easeOut' }}
                        className="glass rounded-2xl border border-border p-5 mb-6"
                      >
                        <div className="flex flex-col gap-3">
                          {summaryMood && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{summaryMood.emoji}</span>
                              <span className="text-sm text-gray-text">
                                Feeling{' '}
                                <span className="font-semibold text-dark">{summaryMood.label}</span>
                              </span>
                            </div>
                          )}
                          {summaryMode && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{summaryMode.emoji}</span>
                              <span className="text-sm text-gray-text">
                                Mode:{' '}
                                <span className="font-semibold text-dark">{summaryMode.title}</span>
                              </span>
                            </div>
                          )}
                          {summaryLang && (
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{summaryLang.emoji}</span>
                              <span className="text-sm text-gray-text">
                                Language:{' '}
                                <span className="font-semibold text-dark">
                                  {summaryLang.title}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-text mt-4 pt-3 border-t border-border">
                          These are your starting settings. Change them anytime in Profile.
                        </p>
                      </motion.div>

                      {/* Enter button */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.4, ease: 'easeOut' }}
                      >
                        <Button variant="primary" size="lg" onClick={handleComplete} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Enter SaneSpace →'}
                        </Button>
                        {saveError && <p className="mt-3 text-sm text-red-600" role="alert">{saveError}</p>}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </OnboardingShell>
  )
}
