import { beforeEach, describe, expect, it } from 'vitest'
import { clearMoodEntries, createMoodEntry, latestMoodEntry, listMoodEntries, updateMoodEntry } from './moodStore'

describe('mood store', () => {
  beforeEach(() => {
    clearMoodEntries('mood-user-a')
    clearMoodEntries('mood-user-b')
  })

  it('persists and isolates mood entries by user', () => {
    const entry = createMoodEntry({ userId: 'mood-user-a', mood: 'Good', triggerTag: 'Work', note: 'A note', date: '2026-09-03T10:00:00.000Z' })
    createMoodEntry({ userId: 'mood-user-b', mood: 'Low', triggerTag: null, note: null, date: '2026-09-03T11:00:00.000Z' })
    expect(listMoodEntries('mood-user-a')).toHaveLength(1)
    expect(listMoodEntries('mood-user-a')[0].id).toBe(entry.id)
    expect(listMoodEntries('mood-user-b')[0].mood).toBe('Low')
  })

  it('updates only an owned entry', () => {
    const entry = createMoodEntry({ userId: 'mood-user-a', mood: 'Okay', triggerTag: null, note: null, date: '2026-09-03T10:00:00.000Z' })
    updateMoodEntry('mood-user-b', entry.id, { mood: 'Great', triggerTag: null, note: null, date: entry.date })
    expect(listMoodEntries('mood-user-a')[0].mood).toBe('Okay')
    updateMoodEntry('mood-user-a', entry.id, { mood: 'Great', triggerTag: null, note: 'Updated', date: entry.date })
    expect(listMoodEntries('mood-user-a')[0]).toMatchObject({ mood: 'Great', note: 'Updated' })
  })

  it('returns the latest mood entry scoped to the user', () => {
    createMoodEntry({ userId: 'mood-user-a', mood: 'Low', triggerTag: 'Sleep', note: null, date: '2026-09-01T10:00:00.000Z' })
    createMoodEntry({ userId: 'mood-user-a', mood: 'Great', triggerTag: 'Work', note: null, date: '2026-09-03T10:00:00.000Z' })
    createMoodEntry({ userId: 'mood-user-b', mood: 'Meh', triggerTag: null, note: null, date: '2026-09-04T10:00:00.000Z' })

    const latest = latestMoodEntry('mood-user-a')
    expect(latest?.mood).toBe('Great')
    expect(latest?.triggerTag).toBe('Work')
    expect(latest?.userId).toBe('mood-user-a')
  })

  it('returns null when the user has no mood entries', () => {
    expect(latestMoodEntry('mood-user-with-none')).toBeNull()
  })
})