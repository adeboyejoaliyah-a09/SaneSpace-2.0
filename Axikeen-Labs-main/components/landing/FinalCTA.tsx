'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Magnetic from '@/components/ui/Magnetic'

export default function FinalCTA() {
  return (
    <section className="relative py-28 md:py-36 px-5 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 mesh-light" />

      <div className="relative max-w-2xl mx-auto text-center">
        <ScrollReveal>
          {/* Eyebrow */}
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-6 opacity-80">
            Ready when you are
          </span>

          <h2 className="font-heading text-4xl md:text-6xl font-bold text-dark mb-6 leading-[1.08]">
            The space that is
            <br />
            <span className="text-primary relative inline-block">
              there for you.
            </span>
          </h2>

          <p className="text-gray-text text-lg leading-relaxed mb-12 max-w-md mx-auto">
            A personal AI companion for school, work, relationships, and everyday life.
            <br />
            Real conversation. Real context. No pressure.
          </p>

          <div className="inline-block rounded-lg border border-border bg-surface p-6 shadow-[0_20px_60px_rgb(var(--tw-primary)/0.12)] mb-8">
            <Magnetic strength={0.2}>
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-12 py-4 rounded-full font-bold text-white text-lg
                    bg-primary transition-all duration-300 glow-primary hover:bg-primary/90"
                >
                  Start for free
                  <ArrowRight size={19} />
                </motion.button>
              </Link>
            </Magnetic>

            <div className="flex items-center justify-center gap-6 mt-5">
              {['Free to join', 'Cancel anytime', '24/7 available'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-gray-text">
                  <Check size={13} className="text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-text">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
