'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import Magnetic from '@/components/ui/Magnetic'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { staggerContainer } from '@/lib/animations'

const modes = [
  { emoji: '🛋️', title: 'Therapy Support', desc: 'CBT & DBT techniques, structured reflection', color: 'rgba(10,124,110,0.08)', border: 'rgba(10,124,110,0.25)' },
  { emoji: '🎯', title: 'Life Coaching', desc: 'Goals, accountability, action plans', color: 'rgba(108,99,255,0.08)', border: 'rgba(108,99,255,0.25)' },
  { emoji: '💬', title: 'Just to Talk', desc: 'No agenda, just a safe ear', color: 'rgba(10,124,110,0.06)', border: 'rgba(178,223,219,0.4)' },
  { emoji: '📚', title: 'Student Support', desc: 'CGPA stress, hostel life, deadlines', color: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.25)' },
  { emoji: '🎮', title: 'Chill / Play', desc: 'Low-pressure, fun, mood boosts', color: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.2)' },
  { emoji: '💼', title: 'Work & Career', desc: 'Burnout, ambition, workplace stress', color: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.2)' },
]

export default function SpecialisationModes() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden bg-white">
      {/* Background radial blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 blur-3xl pointer-events-none opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(10,124,110,0.07) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.07) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 opacity-80">
            Your Mode
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-4">
            Choose how SaneSpace shows up for you
          </h2>
          <p className="text-gray-text text-lg max-w-md mx-auto">
            Pick a mode that fits where you are right now. Switch anytime.
          </p>
        </ScrollReveal>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12"
        >
          {modes.map((mode, i) => (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, scale: 1.03, rotateX: 3 }}
              className="group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 glass hover-lift"
              style={{
                transformStyle: 'preserve-3d',
                perspective: 800,
                background: mode.color,
                border: `1px solid ${mode.border}`,
              }}
            >
              {/* Inner glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: `radial-gradient(circle at 20% 20%, ${mode.color} 0%, transparent 60%)` }}
              />
              <span className="text-3xl mb-3 block relative">{mode.emoji}</span>
              <h3 className="font-heading font-semibold text-dark text-base mb-1.5 relative group-hover:text-primary transition-colors duration-200">
                {mode.title}
              </h3>
              <p className="text-gray-text text-xs leading-relaxed relative">{mode.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <Magnetic strength={0.25}>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-white text-base
                  transition-all duration-300 glow-primary"
                style={{ background: 'linear-gradient(135deg, #0A7C6E 0%, #0d9e8e 50%, #6C63FF 100%)' }}
              >
                Find your mode →
              </motion.button>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
