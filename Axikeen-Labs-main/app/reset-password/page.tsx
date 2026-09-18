'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to update password.')
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
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
          <h1 className="mb-2 text-center text-3xl font-bold tracking-[-0.06em]">Set a new password</h1>
          <p className="mb-6 text-center text-sm text-[#A7A7B3]">Enter the code we sent to {email || 'your email'}.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#E6E6EC]">Verification code</label>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                placeholder="123456"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#E6E6EC]">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 pr-11 text-sm outline-none transition focus:border-violet-400"
                  placeholder="Create a new password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-3 flex items-center text-[#A7A7B3]" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

            <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#A7A7B3]">
            Need another code?{' '}
            <button type="button" onClick={() => router.push('/forgot-password')} className="font-semibold text-violet-200 hover:text-violet-100">Request again</button>
          </p>
        </div>
      </div>
    </div>
  )
}
