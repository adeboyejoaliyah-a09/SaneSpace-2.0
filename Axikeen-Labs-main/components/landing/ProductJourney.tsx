'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Mic, Radio, Sparkles } from 'lucide-react'

const journey = [
  {
    name: 'Web',
    title: 'SaneSpace Web',
    description: 'A calm place to think, reflect, and plan with full conversational context.',
    accent: 'from-primary/15 via-primary/5 to-transparent',
    icon: Sparkles,
  },
  {
    name: 'Voice',
    title: 'Voice-first companion',
    description: 'Speak naturally, pause when you need to, and keep the same relationship alive in conversation.',
    accent: 'from-accent/15 via-accent/5 to-transparent',
    icon: Mic,
  },
  {
    name: 'Box',
    title: 'SaneSpace Box',
    description: 'A future ambient layer that carries the same personality into your room and daily rhythm.',
    accent: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    icon: Radio,
  },
]

export default function ProductJourney() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-4">One relationship</span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark leading-tight">
            Three interfaces. One SaneSpace.
          </h2>
        </motion.div>

        <div ref={ref} className="grid md:grid-cols-3 gap-6">
          {journey.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.name}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="relative group"
              >
                <div className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${step.accent} opacity-80`} />
                <div className="relative glass rounded-[28px] p-6 h-full border border-white/50 dark:border-border">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/80 dark:bg-surface text-primary shadow-sm">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-text">{step.name}</span>
                  </div>

                  <h3 className="font-heading text-2xl font-semibold text-dark mb-3">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-text">{step.description}</p>

                  {index < journey.length - 1 && (
                    <div className="hidden md:flex items-center justify-center my-5 text-primary">
                      <ArrowRight size={18} />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
