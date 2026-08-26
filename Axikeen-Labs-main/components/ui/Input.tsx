'use client'

import React from 'react'

interface InputProps {
  label?: string
  error?: string
  icon?: React.ReactNode
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  multiline?: boolean
  rows?: number
  name?: string
  required?: boolean
  className?: string
}

export default function Input({
  label,
  error,
  icon,
  placeholder,
  type = 'text',
  value,
  onChange,
  multiline = false,
  rows = 4,
  name,
  required,
  className = '',
}: InputProps) {
  const baseClasses = `
    w-full border bg-white px-4 py-3 text-sm text-dark placeholder-gray-400
    transition-all duration-200 outline-none
    focus:ring-2 focus:ring-primary focus:border-primary
    ${error ? 'border-red-400 focus:ring-red-300' : 'border-gray-200'}
    ${icon ? 'pl-10' : ''}
  `

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-dark">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && !multiline && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
        {multiline ? (
          <textarea
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            rows={rows}
            required={required}
            className={`${baseClasses} rounded-2xl resize-none`}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={`${baseClasses} rounded-full`}
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
