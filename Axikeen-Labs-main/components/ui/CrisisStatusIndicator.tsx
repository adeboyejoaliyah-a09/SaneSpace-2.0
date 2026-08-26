'use client'

import type { CrisisTier } from '@/lib/crisisDetection'

interface CrisisStatusIndicatorProps {
  tier: CrisisTier
}

const config: Record<CrisisTier, { color: string; dot: string; label: string }> = {
  safe: {
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
    label: 'Doing well',
  },
  monitor: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Monitor',
  },
  escalate: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
    label: 'Needs support',
  },
  stop: {
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500 animate-pulse',
    label: 'Crisis mode',
  },
}

export default function CrisisStatusIndicator({ tier }: CrisisStatusIndicatorProps) {
  const { color, dot, label } = config[tier]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${color}`}
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
