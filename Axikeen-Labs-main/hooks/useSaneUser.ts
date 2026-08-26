'use client'

import { useEffect, useState } from 'react'

export type SaneUser = {
  id: string
  email?: string
  name?: string
  fullName?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  provider?: string
  createdAt?: string
}

export function useSaneUser() {
  const [user, setUser] = useState<SaneUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' })
        const payload = (await response.json()) as { user?: SaneUser | null }
        if (!active) return
        setUser(payload.user ?? null)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    const onStorage = () => load()
    window.addEventListener('storage', onStorage)

    return () => {
      active = false
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return { user, isLoading }
}
