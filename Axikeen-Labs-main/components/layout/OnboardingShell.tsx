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
  totalSteps = 5,
}: OnboardingShellProps) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100)

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #E8F5F3 0%, #F8FAFA 50%, #ffffff 100%)',
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 pt-6 pb-4">
        <Link href="/" className="flex items-center">
          <span className="font-heading font-bold text-lg text-dark">Sane</span>
          <span className="font-heading font-bold text-lg text-primary">Space</span>
        </Link>
        <span className="text-xs text-gray-text font-medium">
          Step {currentStep} of {totalSteps}
        </span>
      </header>

      {/* Progress bar */}
      <div className="mx-6 h-1.5 bg-primary-mid rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[600px]">{children}</div>
      </main>
    </div>
  )
}
