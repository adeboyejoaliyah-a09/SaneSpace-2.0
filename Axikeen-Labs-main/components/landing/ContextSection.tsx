'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { BrainCircuit, PencilLine, ShieldCheck, Sparkles } from 'lucide-react'

const memoryCards = [
  { label: 'Goal', value: 'Statistics degree', tint: 'bg-primary/10 text-primary' },
  { label: 'Current project', value: 'SaneSpace', tint: 'bg-accent/10 text-accent' },
  { label: 'Preference', value: 'Concise explanations', tint: 'bg-emerald-500/10 text-emerald-600' },
  { label: 'Current focus', value: 'University', tint: 'bg-amber-500/10 text-amber-600' },
]

const contextSignals = [
  { label: 'School', value: 88, color: 'bg-primary' },
  { label: 'Career', value: 72, color: 'bg-accent' },
  { label: 'Lifestyle', value: 64, color: 'bg-emerald-500' },
  { label: 'Relationships', value: 56, color: 'bg-amber-500' },
]

export default function ContextSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden">
      <div className="absolute inset-0 bg-white/60" />
      <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[640px] h-[640px] rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,124,110,0.18) 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-4">Personal Context</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark leading-tight">
            SaneSpace follows the person, not just the prompt.
          </h2>
        </motion.div>

        <div ref={ref} className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            className="glass rounded-[28px] p-6 md:p-7"
          >
            <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/40">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-text mb-2">User Context</p>
                <h3 className="font-heading text-2xl font-semibold text-dark">Your world, in view</h3>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-primary text-xs font-semibold">
                <Sparkles size={14} />
                Personal memory
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              {memoryCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="rounded-2xl border border-white/40 bg-white/60 p-4"
                >
                  <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${card.tint}`}>
                    {card.label}
                  </span>
                  <p className="mt-3 text-lg font-semibold text-dark">{card.value}</p>
                  <div className="mt-4 flex items-center gap-2">
                    {['Keep', 'Edit', 'Forget'].map((action) => (
                      <button
                        key={action}
                        type="button"
                        className="text-[10px] font-medium rounded-full border border-border bg-white/70 px-2.5 py-1 text-gray-text transition-colors hover:text-primary"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.55 }}
            className="space-y-4"
          >
            <div className="glass rounded-[26px] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-text">
                  <BrainCircuit size={14} className="text-primary" />
                  Context cues
                </span>
                <span className="text-[10px] text-primary font-semibold">Live</span>
              </div>

              <div className="space-y-4">
                {contextSignals.map((signal) => (
                  <div key={signal.label}>
                    <div className="flex items-center justify-between mb-2 text-sm text-gray-text">
                      <span>{signal.label}</span>
                      <span className="font-semibold text-dark">{signal.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-200/80 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${signal.value}%` } : { width: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className={`h-full rounded-full ${signal.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[26px] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                  <PencilLine size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">Memory is user-controlled</p>
                  <p className="text-xs text-gray-text">Transparent, editable, and reversible</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-text">
                Your preferences, goals, and context stay helpful without becoming creepy or intrusive.
              </p>
            </div>

            <div className="glass rounded-[26px] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">Private by default</p>
                  <p className="text-xs text-gray-text">You decide what stays</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-text">
                SaneSpace remembers what matters and lets you delete or disable memory whenever you want.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
