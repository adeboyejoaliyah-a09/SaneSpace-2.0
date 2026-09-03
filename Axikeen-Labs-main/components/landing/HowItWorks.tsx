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
    title: 'Remembers what matters',
    body: 'With your consent, SaneSpace keeps structured personal context so relevant conversations can feel less like starting from scratch.',
    tag: 'You control your memory',
    tagColor: 'text-primary bg-primary-light',
  },
  {
    icon: Sparkles,
    iconColor: 'text-accent',
    title: 'Adapts to the moment',
    body: 'Talk through a decision, make a plan, explore an idea, or simply be heard. SaneSpace adjusts its support to the conversation.',
    tag: 'Context before the task',
    tagColor: 'text-accent bg-accent/10',
  },
  {
    icon: Globe,
    iconColor: 'text-primary',
    title: 'Understands your world',
    body: 'From Nigerian English and Pidgin to the many ways people communicate around the world, SaneSpace adapts to language, culture, and context so you can speak naturally.',
    tag: 'Language and cultural intelligence',
    tagColor: 'text-primary bg-primary-light',
  },
]

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 px-5 overflow-hidden mesh-light">
      <div className="relative max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4 opacity-80">
            Built Different
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-dark mb-4">
            Built different. For the world.
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
                className="group relative glass rounded-lg p-7 flex flex-col border border-border hover-lift cursor-default"
              >
                {/* Icon */}
                <div className="relative w-12 h-12 rounded-lg flex items-center justify-center mb-5 shrink-0 border border-border bg-surface">
                  <Icon size={24} className={f.iconColor} />
                </div>

                <h3 className="font-heading text-xl font-bold text-dark mb-3 relative">{f.title}</h3>
                <p className="text-gray-text text-sm leading-relaxed flex-1 relative">{f.body}</p>
                <div className="mt-5 pt-4 border-t border-border relative">
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
