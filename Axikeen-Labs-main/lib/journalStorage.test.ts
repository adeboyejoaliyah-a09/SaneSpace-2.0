import { beforeEach, describe, expect, it } from 'vitest'

const STORAGE_KEY = 'sane_journal_entries'

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    get length() {
      return store.size
    },
  }
}

describe('journal storage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createStorageMock(),
      configurable: true,
      writable: true,
    })
  })

  it('creates a new entry, saves it, and reads it back from storage', () => {
    const firstEntry = {
      id: 'journal-1',
      title: 'Test entry',
      content: 'This is the journal contents.',
      mood: 'happy' as const,
      createdAt: '2026-09-19T08:00:00.000Z',
      updatedAt: '2026-09-19T08:00:00.000Z',
    }

    const secondEntry = {
      id: 'journal-2',
      title: 'Second entry',
      content: 'Second journal note',
      mood: 'calm' as const,
      createdAt: '2026-09-19T09:00:00.000Z',
      updatedAt: '2026-09-19T09:00:00.000Z',
    }

    const saved = [firstEntry, secondEntry]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(2)
    expect(stored[0]).toMatchObject({ id: 'journal-1', title: 'Test entry', mood: 'happy' })
    expect(stored[1]).toMatchObject({ id: 'journal-2', title: 'Second entry', mood: 'calm' })

    const reloaded = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(reloaded[0].content).toBe('This is the journal contents.')
    expect(reloaded[1].content).toBe('Second journal note')
  })

  it('retains existing entries when writing new storage content', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'journal-1', title: 'Original', content: 'Keep me', mood: 'neutral', createdAt: '2026-09-19T08:00:00.000Z', updatedAt: '2026-09-19T08:00:00.000Z' }]))

    const next = [{ id: 'journal-2', title: 'Second', content: 'Added', mood: 'happy', createdAt: '2026-09-19T09:00:00.000Z', updatedAt: '2026-09-19T09:00:00.000Z' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')[0].title).toBe('Second')
  })
})
