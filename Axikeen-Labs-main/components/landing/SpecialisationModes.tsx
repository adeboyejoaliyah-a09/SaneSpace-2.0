'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Briefcase, Compass, Gamepad2, GraduationCap, MessageCircle, Target } from 'lucide-react'
import Magnetic from '@/components/ui/Magnetic'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { staggerContainer } from '@/lib/animations'

const modes = [
  { icon: Compass, title: 'Reflection', desc: 'Make space to understand what you need', className: 'bg-primary-light text-primary border-primary/20' },
  { icon: Target, title: 'Life Planning', desc: 'Goals, accountability, and action plans', className: 'bg-accent/10 text-accent border-accent/20' },
  { icon: MessageCircle, title: 'Just to Talk', desc: 'No agenda, just a thoughtful place to start', className: 'bg-primary-light text-primary border-primary/20' },
  { icon: GraduationCap, title: 'School & Learning', desc: 'Study, assignments, campus life, and decisions', className: 'bg-primary-light text-primary border-primary/20' },
  { icon: Gamepad2, title: 'Chill / Play', desc: 'Low-pressure conversation, ideas, and mood boosts', className: 'bg-accent/10 text-accent border-accent/20' },
  { icon: Briefcase, title: 'Career & Work', desc: 'Opportunities, skills, ambition, and workplace choices', className: 'bg-primary-light text-primary border-primary/20' },
]

export default function SpecialisationModes() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-24 md:py-32 px-5 overflow-hidden bg-background">
      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 opacity-80">
            Ways to use SaneSpace
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-4">
            Bring whatever life is asking of you
          </h2>
          <p className="text-gray-text text-lg max-w-md mx-auto">
            Start with the part of life you want to think through. SaneSpace follows your context.
          </p>
        </ScrollReveal>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12"
        >
          {modes.map((mode, i) => {
            const Icon = mode.icon
            return (
            <motion.div
              key={mode.title}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, scale: 1.03 }}
              className={`group relative rounded-lg p-5 cursor-pointer transition-all duration-300 border bg-surface hover-lift ${mode.className}`}
            >
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-surface/80">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="font-heading font-semibold text-dark text-base mb-1.5 relative group-hover:text-primary transition-colors duration-200">
                {mode.title}
              </h3>
              <p className="text-gray-text text-xs leading-relaxed relative">{mode.desc}</p>
            </motion.div>
          )})}
        </motion.div>

        <div className="text-center">
          <Magnetic strength={0.25}>
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-semibold text-white text-base
                  bg-primary transition-all duration-300 glow-primary hover:bg-primary/90"
              >
                Start your space
                <ArrowRight size={18} />
              </motion.button>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}
