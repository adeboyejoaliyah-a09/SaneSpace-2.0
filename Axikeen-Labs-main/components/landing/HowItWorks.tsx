'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Brain, Sparkles, Globe } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { staggerContainer } from '@/lib/animations'

const features = [
  {
    icon: Brain,
    iconColor: 'text-primary',
    glowColor: 'rgba(10,124,110,0.15)',
    borderColor: 'rgba(10,124,110,0.2)',
    title: 'Remembers you',
    body: 'SaneSpace builds a living profile from every conversation. It notices your patterns, your triggers, what lifts you — and brings that into every session.',
    tag: 'No more starting from scratch',
    tagColor: 'text-primary bg-primary-light',
  },
  {
    icon: Sparkles,
    iconColor: 'text-accent',
    glowColor: 'rgba(108,99,255,0.12)',
    borderColor: 'rgba(108,99,255,0.2)',
    title: 'Shifts with your mood',
    body: 'Need to vent? It listens. Need a plan? It coaches. Just want to talk? It shows up. The AI reads what you need and adjusts — automatically.',
    tag: 'Listener → Coach → Guide',
    tagColor: 'text-accent bg-accent/10',
  },
  {
    icon: Globe,
    iconColor: 'text-primary',
    glowColor: 'rgba(10,124,110,0.12)',
    borderColor: 'rgba(178,223,219,0.4)',
    title: 'Actually understands you',
    body: 'Pidgin, Lagos English, Student English — SaneSpace gets the language, the culture, the pressure. Built by Nigerians, for Nigerians.',
    tag: 'E sabi your vibe',
    tagColor: 'text-primary bg-primary-light',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 px-5 overflow-hidden mesh-light">
      {/* Background accent blobs */}
      <div
        className="absolute top-20 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(10,124,110,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 opacity-80">
            Built Different
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-4">
            Built different. For us.
          </h2>
          <p className="text-gray-text text-lg max-w-md mx-auto">
            Three things that make SaneSpace unlike anything you&apos;ve tried.
          </p>
        </ScrollReveal>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, rotateX: 2, rotateY: -2 }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                className="group relative glass rounded-2xl p-7 flex flex-col border hover-lift cursor-default"
              >
                {/* Subtle background glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${f.glowColor} 0%, transparent 70%)` }}
                />

                {/* Icon */}
                <div
                  className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-5 shrink-0 glass"
                  style={{ boxShadow: `0 0 20px ${f.glowColor}` }}
                >
                  <Icon size={24} className={f.iconColor} />
                </div>

                <h3 className="font-heading text-xl font-bold text-dark mb-3 relative">{f.title}</h3>
                <p className="text-gray-text text-sm leading-relaxed flex-1 relative">{f.body}</p>
                <div className="mt-5 pt-4 border-t border-white/50 relative">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${f.tagColor}`}>
                    {f.tag}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
