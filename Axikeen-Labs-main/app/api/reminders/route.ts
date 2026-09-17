import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createReminder, listReminders, type ReminderSource } from '@/lib/reminderStore'

const VALID_SOURCES = new Set(['conversation', 'memory', 'user_created', 'daily_plan'])
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 1000
type ReminderBody = Record<string, unknown>

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminders = await listReminders(user.id)
  return NextResponse.json({ reminders })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ReminderBody
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body')
    body = parsed as ReminderBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const dueAt = typeof body?.dueAt === 'string' ? body.dueAt : ''
  const description =
    typeof body?.description === 'string' ? body.description.trim() : null

  if (!title || title.length > MAX_TITLE_LENGTH || !dueAt) {
    return NextResponse.json({ error: 'Title and dueAt are required' }, { status: 400 })
  }

  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: 'Description is too long' }, { status: 400 })
  }

  if (body.source !== undefined && (typeof body.source !== 'string' || !VALID_SOURCES.has(body.source))) {
    return NextResponse.json({ error: 'Invalid reminder source' }, { status: 400 })
  }
  const source = typeof body.source === 'string' ? body.source as ReminderSource : 'user_created'

  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid dueAt value' }, { status: 400 })
  }

  const reminder = await createReminder({
    userId: user.id,
    title,
    description,
    dueAt: date.toISOString(),
    source,
  })

  return NextResponse.json({ reminder }, { status: 201 })
}