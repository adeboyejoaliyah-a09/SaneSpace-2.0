'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { CompanionAvatar } from '@/components/ui/Companion'

export default function FloatingCompanion() {
  const [expanded, setExpanded] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.4 }}
      className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <Link
        href="/chat"
        className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 shadow-[0_16px_48px_rgb(var(--tw-primary)/0.18)] transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-base"
        aria-label="Talk to your SaneSpace companion"
      >
        <motion.span
          animate={!reduceMotion ? { scale: [1, 1.04, 1] } : undefined}
          transition={{ delay: 1.4, duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <CompanionAvatar state="idle" size="md" />
        </motion.span>
        <motion.span
          initial={false}
          animate={{ width: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
          className="hidden overflow-hidden whitespace-nowrap text-left sm:block"
        >
          <span className="block text-xs font-semibold text-dark">Talk to SaneSpace</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-text">
            <MessageCircle size={12} />
            What&apos;s on your mind?
          </span>
        </motion.span>
      </Link>
    </motion.div>
  )
}
