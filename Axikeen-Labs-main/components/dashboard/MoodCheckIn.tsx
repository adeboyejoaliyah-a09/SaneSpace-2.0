'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, MessageCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export type DailyMood = 'Low' | 'Meh' | 'Okay' | 'Good' | 'Great'

type MoodOption = { value: DailyMood; emoji: string; label: string }

const MOOD_OPTIONS: MoodOption[] = [
  { value: 'Low', emoji: '😔', label: 'Low' },
  { value: 'Meh', emoji: '😕', label: 'Meh' },
  { value: 'Okay', emoji: '😐', label: 'Okay' },
  { value: 'Good', emoji: '🙂', label: 'Good' },
  { value: 'Great', emoji: '😄', label: 'Great' },
]

type MoodEntry = {
  id: string
  userId: string
  mood: DailyMood
  triggerTag: string | null
  note: string | null
  date: string
}

export default function MoodCheckIn({ onTalk }: { onTalk?: (mood: DailyMood) => void }) {
  const [selected, setSelected] = useState<DailyMood | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void fetch('/api/mood', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ entries: MoodEntry[] }> : null)
      .then((data) => {
        const today = new Date().toDateString()
        const entry = data?.entries.find((item) => new Date(item.date).toDateString() === today)
        if (entry) { setSelected(entry.mood); setSaved(true) }
      })
      .catch(() => {})
  }, [])

  const saveMood = async (mood: DailyMood) => {
    if (saving) return
    setSaving(true)
    setError('')
    const previous = selected
    const previousSaved = saved
    setSelected(mood)
    setSaved(false)
    try {
      const response = await fetch('/api/mood', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mood, date: new Date().toISOString() }) })
      if (!response.ok) throw new Error('Unable to save check-in')
      setSaved(true)
    } catch {
      setSelected(previous)
      setSaved(previousSaved)
      setError('Your check-in could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const selectedOption = MOOD_OPTIONS.find((option) => option.value === selected)

  return (
    <section className="glass rounded-2xl p-5 sm:p-6" aria-labelledby="daily-mood-heading">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-primary font-semibold">Daily check-in</p>
          <h2 id="daily-mood-heading" className="font-heading text-xl font-bold text-dark mt-1">How are you feeling today?</h2>
          <p className="text-sm text-gray-text mt-1">A quick signal for how SaneSpace can meet you today.</p>
        </div>
        {saved && <span className="inline-flex items-center gap-1 text-xs text-primary font-medium"><Check size={14} /> Saved</span>}
      </div>

      <div className="grid grid-cols-5 gap-2 sm:gap-3" role="radiogroup" aria-label="Today's mood">
        {MOOD_OPTIONS.map((option, index) => {
          const isSelected = option.value === selected
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={saving}
              aria-label={`Feeling ${option.label}`}
              onClick={() => saveMood(option.value)}
              onKeyDown={(event) => {
                if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return
                event.preventDefault()
                const nextIndex = event.key === 'ArrowRight' || event.key === 'ArrowDown'
                  ? (index + 1) % MOOD_OPTIONS.length
                  : (index - 1 + MOOD_OPTIONS.length) % MOOD_OPTIONS.length
                const nextButton = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIndex]
                nextButton?.focus()
              }}
              whileTap={{ scale: 0.96 }}
              className={`min-w-0 min-h-[76px] rounded-xl border px-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isSelected ? 'border-primary bg-primary-light text-primary' : 'border-border bg-surface text-gray-text hover:border-primary-mid hover:text-dark'}`}
            >
              <span className="text-2xl leading-none" aria-hidden="true">{option.emoji}</span>
              <span className="text-xs font-medium truncate max-w-full">{option.label}</span>
            </motion.button>
          )
        })}
      </div>
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}

      {selectedOption && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-dark">Feeling {selectedOption.label.toLowerCase()} today. Want to talk about it?</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Not now</Button>
            <Button variant="primary" size="sm" onClick={() => onTalk?.(selectedOption.value)}><MessageCircle size={15} /> Talk to SaneSpace</Button>
          </div>
        </motion.div>
      )}
    </section>
  )
}
