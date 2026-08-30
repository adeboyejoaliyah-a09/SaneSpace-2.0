export function getUserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function formatForUser(date: string | Date, locale?: string): string {
  const value = typeof date === 'string' ? new Date(date) : date
  const tz = getUserTimeZone()

  return new Intl.DateTimeFormat(locale ?? undefined, {
    timeZone: tz,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value)
}

export function toUtcIso(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date provided')
  }
  return parsed.toISOString()
}