'use client'

interface PillChipProps {
  label: string
  selected: boolean
  onClick: () => void
}

export default function PillChip({ label, selected, onClick }: PillChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-full text-sm font-medium border
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
        ${selected
          ? 'bg-primary text-white border-primary'
          : 'bg-transparent text-gray-text border-gray-300 hover:bg-primary-light hover:border-primary-mid'
        }
      `}
    >
      {label}
    </button>
  )
}
