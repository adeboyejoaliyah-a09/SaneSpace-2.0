'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import ScrollReveal from '@/components/ui/ScrollReveal'
import Magnetic from '@/components/ui/Magnetic'

export default function FinalCTA() {
  return (
    <section className="relative py-28 md:py-36 px-5 overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 mesh-light" />

      {/* Large glow orb behind CTA */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(10,124,110,0.1) 0%, rgba(108,99,255,0.05) 50%, transparent 70%)' }}
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <ScrollReveal>
          {/* Eyebrow */}
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-6 opacity-80">
            Ready when you are
          </span>

          <h2 className="font-heading text-4xl md:text-6xl font-bold text-dark mb-6 leading-[1.08]">
            The space that is
            <br />
            <span
              className="text-primary relative inline-block"
              style={{ textShadow: '0 0 40px rgba(10,124,110,0.2)' }}
            >
              there for you.
            </span>
          </h2>

          <p className="text-gray-text text-lg leading-relaxed mb-12 max-w-md mx-auto">
            A personal AI companion for school, work, relationships, and everyday life.
            <br />
            Real conversation. Real context. No pressure.
          </p>

          {/* CTA button — glass card wrapping it for depth */}
          <div className="inline-block glass rounded-2xl p-6 shadow-[0_20px_60px_rgba(10,124,110,0.12)] border border-white/50 mb-8">
            <Magnetic strength={0.2}>
              <Link href="/sign-up">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-12 py-4 rounded-full font-bold text-white text-lg
                    transition-all duration-300 glow-primary"
                  style={{ background: 'linear-gradient(135deg, #0A7C6E 0%, #0d9e8e 50%, #6C63FF 100%)' }}
                >
                  Start for free →
                </motion.button>
              </Link>
            </Magnetic>

            <div className="flex items-center justify-center gap-6 mt-5">
              {['Free to join', 'Cancel anytime', '24/7 available'].map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-gray-text">
                  <span className="text-primary font-bold">✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-text">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-primary hover:underline font-semibold">
              Sign in →
            </Link>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
