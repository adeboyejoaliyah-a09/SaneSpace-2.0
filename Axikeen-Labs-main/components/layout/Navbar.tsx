'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useSaneUser } from '@/hooks/useSaneUser'

const navLinks = [
  { label: 'Space', href: '#space' },
  { label: 'Journal', href: '#journal' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useSaneUser()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? 'border-b border-border bg-[#070708]/80 backdrop-blur-xl' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-black tracking-[-0.06em] text-[#F5F5F7]">Sane</span>
          <span className="font-heading text-xl font-black tracking-[-0.06em] text-violet-300">Space</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#A7A7B3] transition hover:text-[#F5F5F7]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!user ? (
            <>
              <Link href="/sign-in" className="text-sm font-medium text-[#A7A7B3] transition hover:text-[#F5F5F7]">
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.22)] transition hover:bg-violet-500"
              >
                Get started
                <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="text-sm font-medium text-[#A7A7B3] transition hover:text-[#F5F5F7]"
            >
              Log out
            </button>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-[#111118] text-[#F5F5F7] md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-border bg-[#070708]/95 md:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-[#A7A7B3] transition hover:text-[#F5F5F7]"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                {!user ? (
                  <>
                    <Link href="/sign-in" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-[#A7A7B3]">
                      Log in
                    </Link>
                    <Link href="/sign-up" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white">
                      Get started
                      <ArrowRight size={16} />
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      void handleLogout()
                    }}
                    className="text-left text-sm font-medium text-[#A7A7B3]"
                  >
                    Log out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
