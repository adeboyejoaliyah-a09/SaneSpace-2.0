import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createMoodEntry, listMoodEntries, updateMoodEntry } from '@/lib/moodStore'

const VALID_MOODS = new Set(['Low', 'Meh', 'Okay', 'Good', 'Great'])
const MAX_NOTE_LENGTH = 1000

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ entries: listMoodEntries(user.id) })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { mood?: unknown; triggerTag?: unknown; note?: unknown; date?: unknown } | null
  if (!body || typeof body.mood !== 'string' || !VALID_MOODS.has(body.mood)) return NextResponse.json({ error: 'Invalid mood' }, { status: 400 })
  if (body.triggerTag !== undefined && (typeof body.triggerTag !== 'string' || body.triggerTag.trim().length > 120)) return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 })
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.trim().length > MAX_NOTE_LENGTH)) return NextResponse.json({ error: 'Note is too long' }, { status: 400 })
  if (body.date !== undefined && (typeof body.date !== 'string' || Number.isNaN(Date.parse(body.date)))) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  const triggerTag = typeof body.triggerTag === 'string' ? body.triggerTag.trim() || null : null
  const note = typeof body.note === 'string' ? body.note.trim() || null : null
  const date = typeof body.date === 'string' ? new Date(body.date).toISOString() : new Date().toISOString()
  const day = date.slice(0, 10)
  const existing = listMoodEntries(user.id).find((entry) => entry.date.slice(0, 10) === day)
  if (existing) {
    updateMoodEntry(user.id, existing.id, { mood: body.mood, triggerTag, note, date })
    return NextResponse.json({ entry: { ...existing, mood: body.mood, triggerTag, note, date }, entries: listMoodEntries(user.id) })
  }
  const entry = createMoodEntry({ userId: user.id, mood: body.mood, triggerTag, note, date })
  return NextResponse.json({ entry, entries: listMoodEntries(user.id) }, { status: 201 })
}