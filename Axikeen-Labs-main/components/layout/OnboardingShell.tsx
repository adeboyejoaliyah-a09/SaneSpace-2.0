import React from 'react'
import Link from 'next/link'

interface OnboardingShellProps {
  children: React.ReactNode
  currentStep: number
  totalSteps?: number
}

export default function OnboardingShell({
  children,
  currentStep,
  totalSteps = 7,
}: OnboardingShellProps) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100)

  return (
    <div className="min-h-screen bg-[#070708] text-[#F5F5F7]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 pb-4 pt-6 md:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-xl font-black tracking-[-0.06em]">Sane</span>
          <span className="font-heading text-xl font-black tracking-[-0.06em] text-violet-300">Space</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#A7A7B3]">
          Step {currentStep} of {totalSteps}
        </span>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 md:px-8 lg:px-10">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#111118]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-lime-300 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-4xl items-center justify-center px-5 py-10 md:px-8 lg:px-10">
        <div className="w-full">{children}</div>
      </main>
    </div>
  )
}
