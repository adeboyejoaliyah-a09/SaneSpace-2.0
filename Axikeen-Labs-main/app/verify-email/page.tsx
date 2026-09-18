'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const OTP_LENGTH = 6

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(45)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const otpValue = useMemo(() => otp.join(''), [otp])

  function handleChange(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = cleaned
    setOtp(next)
    setError('')

    if (cleaned && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return

    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((digit, index) => {
      next[index] = digit
    })
    setOtp(next)
    setError('')
    const lastIndex = Math.min(pasted.length - 1, OTP_LENGTH - 1)
    inputsRef.current[lastIndex]?.focus()
  }

  async function handleVerify() {
    const code = otpValue
    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit verification code.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to verify the code.')
      router.push('/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return
    setResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/otp/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'email_verification' }),
      })
      const payload = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Unable to resend code.')
      setCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend code.')
    } finally {
      setResending(false)
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
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">Verify your email</p>
          <h1 className="mb-2 text-center text-3xl font-bold tracking-[-0.06em]">Check your inbox</h1>
          <p className="mb-6 text-center text-sm text-[#A7A7B3]">
            We sent a 6-digit code to <span className="font-medium text-[#F5F5F7]">{email || 'your email'}</span>
          </p>

          <div className="mb-6 flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element
                }}
                value={digit}
                inputMode="numeric"
                maxLength={1}
                onChange={(event) => handleChange(index, event.target.value)}
                onPaste={handlePaste}
                className="h-12 w-11 rounded-xl border border-border bg-[#111118] text-center text-lg font-semibold text-[#F5F5F7] outline-none transition focus:border-violet-400"
              />
            ))}
          </div>

          {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}

          <button type="button" onClick={handleVerify} disabled={loading || otpValue.length !== OTP_LENGTH} className="inline-flex w-full items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">
            {loading ? 'Verifying...' : 'Verify email'}
          </button>

          <div className="mt-6 flex items-center justify-between text-sm text-[#A7A7B3]">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="font-medium text-violet-200 disabled:cursor-not-allowed disabled:text-[#A7A7B3]"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>

            <button type="button" onClick={() => router.push('/sign-up')} className="font-medium text-[#F5F5F7]">
              Change email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
