'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSaneUser } from '@/hooks/useSaneUser'
import { motion, AnimatePresence } from 'framer-motion'
import OnboardingShell from '@/components/layout/OnboardingShell'

const COMMUNICATION_STYLES = [
  'Casual',
  'Straight to the point',
  'Detailed',
  'Gentle',
  'Playful',
  'Thoughtful',
  'Challenging',
  'Encouraging',
]

const USE_CASES = [
  'School',
  'Work',
  'Brainstorming',
  'Relationships',
  'Decisions',
  'Planning',
  'Journaling',
  'Learning',
  'Creative projects',
  'Someone to talk to',
  'Everyday life',
  'Just exploring',
]

const INTERESTS = [
  'Technology',
  'Music',
  'Movies/series',
  'Books',
  'Gaming',
  'Art/design',
  'Sports',
  'Fashion',
  'Business',
  'Science',
  'Writing',
  'Travel',
  'Coding',
  'Anime',
  'Food',
  'Other',
]

const GOALS = [
  'School',
  'Career',
  'Projects',
  'Learning',
  'Building something',
  'Relationships',
  'Personal growth',
  'Creative goals',
  'Other',
]

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

type Selections = {
  preferredName: string
  country: string
  cityOrRegion: string
  communicationPreferences: string[]
  useCases: string[]
  interests: string[]
  interestsText: string
  goals: string[]
  goalsText: string
  personalContext: string
}

const INITIAL_SELECTIONS: Selections = {
  preferredName: '',
  country: '',
  cityOrRegion: '',
  communicationPreferences: [],
  useCases: [],
  interests: [],
  interestsText: '',
  goals: [],
  goalsText: '',
  personalContext: '',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useSaneUser()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [selections, setSelections] = useState<Selections>(INITIAL_SELECTIONS)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // refs to manage timers
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sane_onboarding_progress')
      if (saved) {
        const parsed = JSON.parse(saved) as { currentStep: Step; selections: Partial<Selections> }
        setCurrentStep(parsed.currentStep || 1)
        setSelections({ ...INITIAL_SELECTIONS, ...parsed.selections })
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSelection = (list: string[], value: string) => {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  const parseOptionalTextList = (value: string) =>
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20)

  const savePreferences = async () => {
    setIsSaving(true)
    setSaveError('')

    try {
      const interests = [...new Set([...selections.interests, ...parseOptionalTextList(selections.interestsText)])]
      const goals = [...new Set([...selections.goals, ...parseOptionalTextList(selections.goalsText)])]

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredName: selections.preferredName.trim() || null,
          country: selections.country.trim() || null,
          cityOrRegion: selections.cityOrRegion.trim() || null,
          communicationPreferences: selections.communicationPreferences,
          useCases: selections.useCases,
          interests,
          goals,
          personalContext: selections.personalContext.trim() || null,
          onboardingComplete: true,
          firstName: user?.firstName ?? null,
        }),
      })

      if (!response.ok) throw new Error('Unable to save your preferences.')

      localStorage.removeItem('sane_onboarding_progress')
      router.push('/chat')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save your preferences.')
    } finally {
      setIsSaving(false)
    }
  }

  const nextStep = (step: Step) => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
    stepTimerRef.current = setTimeout(() => setCurrentStep(step), 300)
  }

  useEffect(() => {
    try {
      localStorage.setItem('sane_onboarding_progress', JSON.stringify({ currentStep, selections }))
    } catch {}
  }, [currentStep, selections])

  const questionTitle = () => {
    switch (currentStep) {
      case 1:
        return 'What should I call you?'
      case 2:
        return 'Where are you based?'
      case 3:
        return 'How do you want SaneSpace to talk to you?'
      case 4:
        return 'What do you want SaneSpace to help with?'
      case 5:
        return 'What are you into?'
      case 6:
        return 'What are you working toward right now?'
      case 7:
        return 'Anything else you want SaneSpace to know?'
      default:
        return 'A little more about you'
    }
  }

  const helperText = () => {
    switch (currentStep) {
      case 1:
        return 'Your name, nickname, or whatever feels natural.'
      case 2:
        return 'Optional country and city/region help us personalize context without making assumptions.'
      case 3:
        return 'These preferences can be changed later.'
      case 4:
        return 'Pick the things you want help with most.'
      case 5:
        return 'Optional — add a hobby, interest, or anything you enjoy.'
      case 6:
        return 'Optional — this helps us understand what matters right now.'
      case 7:
        return 'You can share anything that would help SaneSpace understand you better. You can always change or remove this later.'
      default:
        return ''
    }
  }

  const canProceedFromStepOne = selections.preferredName.trim().length > 0

  return (
    <OnboardingShell currentStep={currentStep} totalSteps={7}>
      <div className="rounded-[32px] border border-border bg-[#0D0D12]/90 p-5 shadow-[0_30px_80px_rgba(19,15,26,0.75)] md:p-8">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-sm font-semibold text-violet-200">
            {currentStep}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#A7A7B3]">Personalize your space</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.06em] text-[#F5F5F7] md:text-3xl">{questionTitle()}</h2>
            <p className="mt-2 text-sm text-[#A7A7B3]">{helperText()}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-5"
          >
            {currentStep === 1 && (
              <div>
                <label htmlFor="preferred-name" className="mb-2 block text-sm font-medium text-[#E6E6EC]">Preferred name / nickname</label>
                <input
                  id="preferred-name"
                  type="text"
                  value={selections.preferredName}
                  onChange={(event) => setSelections((prev) => ({ ...prev, preferredName: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                  placeholder="Ada, Ayo, or whatever you like"
                  required
                />
                {!canProceedFromStepOne && (
                  <p className="mt-3 text-sm text-red-200">Please tell me what to call you so SaneSpace feels personal.</p>
                )}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => canProceedFromStepOne && nextStep(2)}
                    disabled={!canProceedFromStepOne}
                    className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="country" className="mb-2 block text-sm font-medium text-[#E6E6EC]">Country</label>
                  <input
                    id="country"
                    type="text"
                    value={selections.country}
                    onChange={(event) => setSelections((prev) => ({ ...prev, country: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                    placeholder="Nigeria, Ghana, UK, etc."
                  />
                </div>
                <div>
                  <label htmlFor="city-region" className="mb-2 block text-sm font-medium text-[#E6E6EC]">City / region (optional)</label>
                  <input
                    id="city-region"
                    type="text"
                    value={selections.cityOrRegion}
                    onChange={(event) => setSelections((prev) => ({ ...prev, cityOrRegion: event.target.value }))}
                    className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                    placeholder="Lagos, Accra, Toronto..."
                  />
                </div>
                <div className="flex justify-between gap-3 pt-2">
                  <button type="button" onClick={() => nextStep(1)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => nextStep(3)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {COMMUNICATION_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelections((prev) => ({ ...prev, communicationPreferences: toggleSelection(prev.communicationPreferences, style) }))}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        selections.communicationPreferences.includes(style)
                          ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                          : 'border-border bg-[#111118] text-[#A7A7B3]'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#A7A7B3]">These preferences can be changed later from your profile.</p>
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => nextStep(2)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => nextStep(4)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {USE_CASES.map((useCase) => (
                    <button
                      key={useCase}
                      type="button"
                      onClick={() => setSelections((prev) => ({ ...prev, useCases: toggleSelection(prev.useCases, useCase) }))}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        selections.useCases.includes(useCase)
                          ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                          : 'border-border bg-[#111118] text-[#A7A7B3]'
                      }`}
                    >
                      {useCase}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => nextStep(3)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => nextStep(5)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setSelections((prev) => ({ ...prev, interests: toggleSelection(prev.interests, interest) }))}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        selections.interests.includes(interest)
                          ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                          : 'border-border bg-[#111118] text-[#A7A7B3]'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label htmlFor="interests-text" className="mb-2 block text-sm font-medium text-[#E6E6EC]">Anything else?</label>
                  <textarea
                    id="interests-text"
                    value={selections.interestsText}
                    onChange={(event) => setSelections((prev) => ({ ...prev, interestsText: event.target.value }))}
                    className="min-h-[90px] w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                    placeholder="Books, photography, travel, gaming, etc."
                  />
                </div>
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => nextStep(4)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => nextStep(6)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setSelections((prev) => ({ ...prev, goals: toggleSelection(prev.goals, goal) }))}
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        selections.goals.includes(goal)
                          ? 'border-violet-500 bg-violet-500/10 text-violet-100'
                          : 'border-border bg-[#111118] text-[#A7A7B3]'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label htmlFor="goals-text" className="mb-2 block text-sm font-medium text-[#E6E6EC]">Anything else you&apos;re working toward?</label>
                  <textarea
                    id="goals-text"
                    value={selections.goalsText}
                    onChange={(event) => setSelections((prev) => ({ ...prev, goalsText: event.target.value }))}
                    className="min-h-[90px] w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                    placeholder="Learning something new, better routines, creative projects..."
                  />
                </div>
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => nextStep(5)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => nextStep(7)} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">Continue</button>
                </div>
              </div>
            )}

            {currentStep === 7 && (
              <div>
                <label htmlFor="personal-context" className="mb-2 block text-sm font-medium text-[#E6E6EC]">Anything else you want SaneSpace to know?</label>
                <textarea
                  id="personal-context"
                  value={selections.personalContext}
                  onChange={(event) => setSelections((prev) => ({ ...prev, personalContext: event.target.value }))}
                  className="min-h-[120px] w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-base outline-none transition focus:border-violet-400"
                  placeholder="Optional — share anything that would help SaneSpace understand you better."
                />
                <div className="mt-3 flex justify-end">
                  <button type="button" onClick={() => setSelections((prev) => ({ ...prev, personalContext: '' }))} className="text-sm text-[#A7A7B3] hover:text-[#F5F5F7]">Skip</button>
                </div>
                <div className="mt-6 flex justify-between gap-3">
                  <button type="button" onClick={() => nextStep(6)} className="rounded-2xl border border-border bg-[#111118] px-4 py-2.5 text-sm font-medium text-[#F5F5F7]">Back</button>
                  <button type="button" onClick={() => void savePreferences()} disabled={isSaving} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {isSaving ? 'Saving...' : 'Finish'}
                  </button>
                </div>
                {saveError && <p className="mt-4 text-sm text-red-200">{saveError}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </OnboardingShell>
  )
}
