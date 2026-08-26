'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { fadeUp, fadeIn, scaleIn, slideInLeft, slideInRight } from '@/lib/animations'
import type { Variants } from 'framer-motion'

interface ScrollRevealProps {
  children: React.ReactNode
  variant?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideLeft' | 'slideRight'
  delay?: number
  className?: string
}

const variantMap: Record<string, Variants> = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideLeft: slideInLeft,
  slideRight: slideInRight,
}

export default function ScrollReveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const base = variantMap[variant]
  const resolved: Variants = delay
    ? {
        hidden: base.hidden,
        visible: {
          ...(base.visible as object),
          transition: {
            ...((base.visible as { transition?: object }).transition ?? {}),
            delay,
          },
        },
      }
    : base

  return (
    <motion.div
      ref={ref}
      variants={resolved}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  )
}
