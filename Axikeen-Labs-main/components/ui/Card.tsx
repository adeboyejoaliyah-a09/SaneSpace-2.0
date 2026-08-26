import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
}

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl
        shadow-[0_2px_16px_rgba(10,124,110,0.08)]
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
