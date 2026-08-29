'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Quote } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { staggerContainer } from '@/lib/animations'

const testimonials = [
  {
    quote: "I sha didn't expect an AI to understand the context so quickly. I could explain what was happening and actually think clearly.",
    name: 'Temi A.',
    sub: '300 Level, UNILAG',
  },
  {
    quote: "The way it understood when I said 'e don do me' — I was shook. I didn't have to stop and translate myself.",
    name: 'Chidi O.',
    sub: 'Software Engineer, Lagos',
  },
  {
    quote: "I use SaneSpace to think through work, family, and the decisions I keep postponing. It feels useful because it remembers the thread.",
    name: 'Fatima B.',
    sub: 'Corper, Abuja',
  },
]

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden">
      {/* Deep rich background */}
      <div className="absolute inset-0 mesh-dark" />

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary-mid mb-4 opacity-80">
            Real Stories
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white">
            Nigerians are finding their place here
          </h2>
        </ScrollReveal>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative rounded-lg border border-primary/20 p-6 flex flex-col gap-4 glass-dark hover-lift"
            >
              <div className="flex items-center gap-2 text-base relative text-primary-mid">
                <Quote size={20} />
              </div>

              <p className="text-white/80 text-sm leading-relaxed flex-1 relative">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="relative pt-4 border-t border-white/10">
                <p className="font-semibold text-white text-sm">{t.name}</p>
                <p className="text-gray-300 dark:text-gray-400 text-xs">{t.sub}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
