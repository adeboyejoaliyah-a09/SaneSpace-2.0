'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '@/components/ui/Button'

const moods = [
  {
    emoji: '😀',
    label: 'Great',
    color: 'from-green-400/20 to-primary/20',
    border: 'border-green-400/40',
    response: "Omo, that's good to hear! Cherish this energy — life can feel light sometimes, and you deserve it. Let SaneSpace help you keep the momentum going.",
  },
  {
    emoji: '🙂',
    label: 'Okay',
    color: 'from-primary/20 to-primary-mid/30',
    border: 'border-primary/40',
    response: "Okay is more than enough. Not every day has to be amazing. What's one small thing on your mind right now? SaneSpace is here to listen.",
  },
  {
    emoji: '😐',
    label: 'Neutral',
    color: 'from-gray-200/40 to-primary/10',
    border: 'border-gray-300/40',
    response: "Flat days are real days too. Sometimes the quiet ones need the most attention. Come in, talk — even if you don't know what to say.",
  },
  {
    emoji: '😔',
    label: 'Low',
    color: 'from-blue-400/20 to-accent/20',
    border: 'border-blue-400/30',
    response: "I hear you. Low days happen, and you don't have to carry this alone. SaneSpace is ready to sit with you — no judgment, no rush.",
  },
  {
    emoji: '😣',
    label: 'Overwhelmed',
    color: 'from-accent/20 to-primary/20',
    border: 'border-accent/30',
    response: "Ehn, take one breath. You're not lazy, you're not failing — you're just carrying too much right now. Let's put some of it down together.",
  },
]

export default function MoodStrip() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section className="relative py-20 px-5 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,124,110,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-3xl mx-auto">
        <motion.h4
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-heading text-2xl font-semibold text-dark text-center mb-10"
        >
          How are you feeling right now?
        </motion.h4>

        {/* Emoji row */}
        <div className="flex justify-center flex-wrap gap-4 sm:gap-6">
          {moods.map((mood, i) => (
            <motion.button
              key={mood.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.12, y: -4 }}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 focus:outline-none
                ${selected === i
                  ? `bg-gradient-to-br ${mood.color} ${mood.border} shadow-lg`
                  : 'border-transparent hover:bg-gray-50 hover:border-primary/20'
                }`}
            >
              <span className="text-4xl leading-none">{mood.emoji}</span>
              <span className={`text-xs font-semibold ${selected === i ? 'text-primary' : 'text-gray-text'}`}>
                {mood.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Response card */}
        <AnimatePresence mode="wait">
          {selected !== null && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`mt-8 glass rounded-2xl p-6 text-center border ${moods[selected].border}
                shadow-[0_8px_40px_rgba(10,124,110,0.12)]`}
            >
              <p className="text-gray-text leading-relaxed mb-5 text-base">
                {moods[selected].emoji} {moods[selected].response}
              </p>
              <Link href="/sign-up">
                <Button variant="primary" size="md">
                  Talk to SaneSpace about this →
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
