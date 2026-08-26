'use client'

interface MoodEmojiProps {
  emoji: string
  label: string
  selected: boolean
  onClick: () => void
}

export default function MoodEmoji({ emoji, label, selected, onClick }: MoodEmojiProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center gap-2 p-3 rounded-2xl
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
        ${selected
          ? 'border-2 border-primary bg-primary-light scale-105'
          : 'border-2 border-transparent hover:bg-primary-light hover:scale-105'
        }
      `}
    >
      <span className="text-4xl leading-none select-none">{emoji}</span>
      <span
        className={`text-xs font-medium ${selected ? 'text-primary' : 'text-gray-text'}`}
      >
        {label}
      </span>
    </button>
  )
}
