interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase()
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`
        flex items-center justify-center rounded-full
        bg-primary text-white font-semibold select-none shrink-0
        ${sizeClasses[size]}
      `}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}
