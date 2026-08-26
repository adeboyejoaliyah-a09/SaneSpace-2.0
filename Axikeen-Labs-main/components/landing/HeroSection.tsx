'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Mic, ChevronDown } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Magnetic from '@/components/ui/Magnetic'

// Dynamically import 3D canvas — SSR off to avoid browser-API issues on server
const HeroOrb = dynamic(() => import('@/components/three/HeroOrb'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div
        className="w-32 h-32 rounded-full glow-primary-pulse"
        style={{ background: 'radial-gradient(circle, #0A7C6E 0%, rgba(10,124,110,0.2) 70%)' }}
      />
    </div>
  ),
})

const TRUST_ITEMS = ['Free to start', 'Voice-first', 'Private & confidential']

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })

  // Parallax transforms driven by scroll
  const orbY       = useTransform(scrollYProgress, [0, 1], [0, 120])
  const textY      = useTransform(scrollYProgress, [0, 1], [0, 60])
  const bgOpacity  = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const scrollDown = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden mesh-hero">

      {/* Gradient orb blobs in background */}
      <div
        className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(10,124,110,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto px-5 w-full pt-24 pb-16 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0">

          {/* ── LEFT — Text ── */}
          <motion.div
            className="flex-1 lg:max-w-[54%] lg:pr-8"
            style={{ y: textY }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Pill tag */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-1.5 border border-primary/40 text-primary text-xs font-semibold
                rounded-full px-4 py-1.5 mb-6 glass-primary"
            >
              🇳🇬 Built for Nigerians
            </motion.span>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading text-5xl md:text-6xl xl:text-7xl font-bold text-dark leading-[1.06] mb-5"
            >
              Welcome back.
              <br />
              What&apos;s up?
              <br />
              <span
                className="text-primary relative inline-block"
                style={{ textShadow: '0 0 40px rgba(10,124,110,0.25)' }}
              >
                SaneSpace is here.
                <motion.span
                  className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.9, duration: 0.8, ease: 'easeOut' }}
                />
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-gray-text text-lg max-w-md leading-relaxed mb-8"
            >
              SaneSpace is the space that is there for you — a voice-aware, memory-aware
              companion for school, work, relationships, and life pressure. It listens,
              adapts, and remembers what matters, with your consent.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="flex flex-wrap items-center gap-3 mb-7"
            >
              <Magnetic strength={0.25}>
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white text-base
                      transition-all duration-300 glow-primary"
                    style={{ background: 'linear-gradient(135deg, #0A7C6E 0%, #0d9e8e 100%)' }}
                  >
                    Start for free →
                  </motion.button>
                </Link>
              </Magnetic>

              <motion.button
                onClick={scrollDown}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-primary text-base
                  glass border border-primary/30 hover:border-primary/60 transition-all duration-300"
              >
                See how it works
              </motion.button>
            </motion.div>

            {/* Trust line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap gap-5 text-sm text-gray-text"
            >
              {TRUST_ITEMS.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary-light flex items-center justify-center text-primary text-[10px] font-bold">✓</span>
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT — 3D Orb + Glass Chat Card ── */}
          <motion.div
            className="w-full lg:w-[46%] flex justify-center lg:justify-end relative"
            style={{ y: orbY }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          >
            {/* 3D Canvas */}
            <div className="relative w-full max-w-[440px] aspect-square">
              <div className="absolute inset-0">
                <HeroOrb className="w-full h-full" />
              </div>

              {/* Glass chat card — floats over the orb */}
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[88%] glass rounded-2xl
                  shadow-[0_8px_40px_rgba(10,124,110,0.18)] border border-white/60"
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Card header */}
                <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-white/30">
                  <div className="w-9 h-9 rounded-full glow-primary flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #0A7C6E, #0d9e8e)' }}>
                    SS
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark">Welcome back</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-gray-400">What&apos;s up?</span>
                    </div>
                  </div>
                  <span className="glass-primary text-primary text-xs rounded-full px-2.5 py-1 font-semibold border border-primary/20 shrink-0">
                    🫂 Listening
                  </span>
                </div>

                {/* Chat bubbles */}
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-end">
                    <div
                      className="text-white text-sm rounded-3xl rounded-br-sm px-3.5 py-2.5 max-w-[85%] leading-relaxed"
                      style={{ background: 'linear-gradient(135deg, #0A7C6E, #0d9e8e)' }}
                    >
                      Abeg I just dey stress, e don do me today
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/70 text-gray-600 text-sm rounded-3xl rounded-bl-sm px-3.5 py-2.5 max-w-[85%] leading-relaxed backdrop-blur-sm">
                      I hear you. E no easy at all. Wetin dey happen exactly?
                    </div>
                  </div>
                </div>

                {/* Decorative input bar */}
                <div className="flex items-center gap-2 mx-4 mb-4 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/40">
                  <span className="text-gray-400 text-sm flex-1">Talk to me...</span>
                  <Mic size={15} className="text-primary shrink-0" />
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Scroll cue */}
      <motion.button
        onClick={scrollDown}
        style={{ opacity: bgOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-primary transition-colors z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <ChevronDown size={20} />
      </motion.button>
    </section>
  )
}
