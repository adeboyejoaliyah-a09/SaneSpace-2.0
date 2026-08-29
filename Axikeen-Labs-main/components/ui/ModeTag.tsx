import { Compass, HeartHandshake, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'

type Mode = 'listening' | 'coach' | 'explorer' | 'companion' | 'care'

interface ModeTagProps {
  mode: Mode
  size?: 'default' | 'small'
}

const modeConfig: Record<Mode, { label: string; className: string; icon: typeof MessageCircle }> = {
  listening: {
    label: 'Listen',
    className: 'bg-primary-light text-primary border-primary/20',
    icon: HeartHandshake,
  },
  coach: {
    label: 'Plan',
    className: 'bg-accent/10 text-accent border-accent/20',
    icon: Compass,
  },
  explorer: {
    label: 'Explore',
    className: 'bg-primary-light text-primary border-primary/20',
    icon: Sparkles,
  },
  companion: {
    label: 'Talk',
    className: 'bg-accent/10 text-accent border-accent/20',
    icon: MessageCircle,
  },
  care: {
    label: 'Care',
    className: 'bg-red-500/10 text-red-600 border-red-500/20',
    icon: ShieldCheck,
  },
}

export default function ModeTag({ mode, size = 'default' }: ModeTagProps) {
  const { label, className, icon: Icon } = modeConfig[mode]
  const sizeClasses =
    size === 'small'
      ? 'gap-1 px-2 py-0.5 text-[10px]'
      : 'gap-1.5 px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${sizeClasses} ${className}`}
    >
      <Icon size={size === 'small' ? 11 : 13} aria-hidden="true" />
      {label}
    </span>
  )
}
