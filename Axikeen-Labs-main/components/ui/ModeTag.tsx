type Mode = 'listening' | 'coach' | 'explorer' | 'companion' | 'care'

interface ModeTagProps {
  mode: Mode
  size?: 'default' | 'small'
}

const modeConfig: Record<Mode, { emoji: string; label: string; className: string }> = {
  listening: {
    emoji: '👂',
    label: 'Listening',
    className: 'bg-blue-100 text-blue-700',
  },
  coach: {
    emoji: '🎯',
    label: 'Coach',
    className: 'bg-primary-light text-primary',
  },
  explorer: {
    emoji: '🔭',
    label: 'Explorer',
    className: 'bg-purple-100 text-purple-700',
  },
  companion: {
    emoji: '🤝',
    label: 'Companion',
    className: 'bg-yellow-100 text-yellow-700',
  },
  care: {
    emoji: '❤️',
    label: 'Care',
    className: 'bg-red-100 text-red-600',
  },
}

export default function ModeTag({ mode, size = 'default' }: ModeTagProps) {
  const { emoji, label, className } = modeConfig[mode]
  const sizeClasses =
    size === 'small'
      ? 'gap-1 px-2 py-0.5 text-[10px]'
      : 'gap-1.5 px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClasses} ${className}`}
    >
      <span>{emoji}</span>
      {label}
    </span>
  )
}
