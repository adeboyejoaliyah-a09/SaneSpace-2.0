import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import type { ExtractedMemory } from '@/lib/memoryExtraction'

const testDatabasePath = path.join(os.tmpdir(), `sanespace-memory-${process.pid}.db`)
process.env.SANESPACE_DATABASE_PATH = testDatabasePath

import { clearUserMemories, deleteUserMemory, isMemoryEnabled, listUserMemories, retrieveRelevantMemories, setMemoryEnabled, updateUserMemory, upsertUserMemories } from '@/lib/memoryStore'

const academicMemory: ExtractedMemory = {
  memoryType: 'trigger',
  category: 'academic',
  content: 'User often reports academic stress around exams or CGPA.',
  confidenceScore: 0.7,
  source: 'chat',
}

const financialMemory: ExtractedMemory = {
  memoryType: 'trigger',
  category: 'financial',
  content: 'User often reports financial stress or money pressure.',
  confidenceScore: 0.6,
  source: 'mood_log',
}

describe('persistent user memory', () => {
  beforeEach(() => {
    clearUserMemories('user-a')
    clearUserMemories('user-b')
    setMemoryEnabled('user-a', true)
    setMemoryEnabled('user-b', true)
  })

  it('keeps memories isolated by authenticated user id', () => {
    upsertUserMemories('user-a', [academicMemory])
    upsertUserMemories('user-b', [financialMemory])

    expect(listUserMemories('user-a').map((memory) => memory.category)).toEqual(['academic'])
    expect(listUserMemories('user-b').map((memory) => memory.category)).toEqual(['financial'])
  })

  it('retrieves only relevant memories and respects disabled memory', () => {
    upsertUserMemories('user-a', [academicMemory, financialMemory])

    expect(retrieveRelevantMemories('user-a', 'I am worried about my exams').map((memory) => memory.category)).toEqual(['academic'])
    expect(retrieveRelevantMemories('user-a', 'hello there')).toEqual([])

    setMemoryEnabled('user-a', false)
    expect(isMemoryEnabled('user-a')).toBe(false)
    expect(retrieveRelevantMemories('user-a', 'exam pressure')).toEqual([])
    expect(upsertUserMemories('user-a', [{ ...academicMemory, category: 'new' }])).toEqual([])
  })

  it('supports updating, deleting, and clearing memories', () => {
    const [memory] = upsertUserMemories('user-a', [academicMemory])
    expect(updateUserMemory('user-a', memory.id, 'Updated exam context')).toMatchObject({ content: 'Updated exam context' })
    expect(deleteUserMemory('user-a', memory.id)).toBe(true)
    expect(listUserMemories('user-a')).toEqual([])

    upsertUserMemories('user-a', [academicMemory, financialMemory])
    clearUserMemories('user-a')
    expect(listUserMemories('user-a')).toEqual([])
  })
})

afterAll(() => {
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.rmSync(`${testDatabasePath}${suffix}`, { force: true }) } catch {}
  }
})