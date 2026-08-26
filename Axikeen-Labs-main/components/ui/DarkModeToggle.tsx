'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DarkModeToggleProps {
  size?: 'sm' | 'md'
  className?: string
}

export default function DarkModeToggle({ size = 'md', className = '' }: DarkModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className={size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'} />

  const isDark = theme === 'dark'
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={`${dim} rounded-full flex items-center justify-center glass border transition-all duration-300 ${className}`}
      style={{
        borderColor: isDark ? 'rgba(139,131,255,0.3)' : 'rgba(10,124,110,0.2)',
        background: isDark ? 'rgba(139,131,255,0.1)' : 'rgba(10,124,110,0.07)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            <Sun size={iconSize} className="text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            <Moon size={iconSize} className="text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
