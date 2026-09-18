'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to send reset code.')
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.')
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
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">Reset password</p>
          <h1 className="mb-2 text-center text-3xl font-bold tracking-[-0.06em]">Forgot your password?</h1>
          <p className="mb-6 text-center text-sm text-[#A7A7B3]">We’ll send a reset code to your email.</p>

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

            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#A7A7B3]">
            Remembered it?{' '}
            <Link href="/sign-in" className="font-semibold text-violet-200 hover:text-violet-100">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
