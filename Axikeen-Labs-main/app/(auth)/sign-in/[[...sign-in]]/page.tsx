'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to sign in.')

      const statusResponse = await fetch('/api/auth/onboarding-status', { cache: 'no-store' })
      const status = (await statusResponse.json()) as { profile?: { onboardingComplete?: boolean } | null }
      router.push(status?.profile?.onboardingComplete ? '/chat' : '/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] px-4 py-12 text-[#F5F5F7]">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="font-heading text-2xl font-black tracking-[-0.06em]">Sane</span>
          <span className="font-heading text-2xl font-black tracking-[-0.06em] text-violet-300">Space</span>
        </Link>

        <div className="rounded-[30px] border border-border bg-[#0D0D12]/90 p-6 shadow-[0_25px_80px_rgba(19,15,26,0.75)] backdrop-blur-sm">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">Welcome back</p>
          <h1 className="mb-2 text-center text-3xl font-bold tracking-[-0.06em]">Sign in</h1>
          <p className="mb-6 text-center text-sm text-[#A7A7B3]">Continue to your personal space.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#E6E6EC]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-[#E6E6EC]">Password</label>
                <Link href="/forgot-password" className="text-xs text-violet-200 hover:text-violet-100">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 pr-11 text-sm outline-none transition focus:border-violet-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#A7A7B3]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7A7B3]">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <a href="/api/auth/google" className="block">
              <button type="button" className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-sm font-medium text-[#F5F5F7] transition hover:border-violet-500/40">
                Continue with Google
              </button>
            </a>
          </div>

          <p className="mt-6 text-center text-sm text-[#A7A7B3]">
            New here?{' '}
            <Link href="/sign-up" className="font-semibold text-violet-200 hover:text-violet-100">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
