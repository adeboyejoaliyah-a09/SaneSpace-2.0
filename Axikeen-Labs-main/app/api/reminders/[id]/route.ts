import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { deleteReminder, getReminderById, updateReminder, type ReminderSource, type ReminderStatus } from '@/lib/reminderStore'

const VALID_STATUSES = new Set(['pending', 'completed', 'dismissed', 'cancelled'])
const VALID_SOURCES = new Set(['conversation', 'memory', 'user_created', 'daily_plan'])
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 1000
type ReminderBody = Record<string, unknown>

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: ReminderBody
  try {
    const parsed = await _req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body')
    body = parsed as ReminderBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const current = await getReminderById(user.id, params.id)
  if (!current) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
  }

  if (body?.title !== undefined && (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > MAX_TITLE_LENGTH)) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
  }
  if (body?.description !== undefined && body.description !== null && (typeof body.description !== 'string' || body.description.trim().length > MAX_DESCRIPTION_LENGTH)) {
    return NextResponse.json({ error: 'Invalid description' }, { status: 400 })
  }
  if (body?.dueAt !== undefined && (typeof body.dueAt !== 'string' || Number.isNaN(new Date(body.dueAt).getTime()))) {
    return NextResponse.json({ error: 'Invalid dueAt value' }, { status: 400 })
  }
  if (body.status !== undefined && (typeof body.status !== 'string' || !VALID_STATUSES.has(body.status))) {
    return NextResponse.json({ error: 'Invalid reminder status' }, { status: 400 })
  }
  if (body.source !== undefined && (typeof body.source !== 'string' || !VALID_SOURCES.has(body.source))) {
    return NextResponse.json({ error: 'Invalid reminder source' }, { status: 400 })
  }
  const status = typeof body.status === 'string' ? body.status as ReminderStatus : undefined
  const source = typeof body.source === 'string' ? body.source as ReminderSource : undefined

  const next = await updateReminder(user.id, params.id, {
    title: typeof body?.title === 'string' ? body.title.trim() : undefined,
    description:
      typeof body?.description === 'string'
        ? body.description.trim()
        : body?.description ?? undefined,
    dueAt: typeof body?.dueAt === 'string' ? body.dueAt : undefined,
    status,
    source,
  })

  if (!next) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
  }

  return NextResponse.json({ reminder: next })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await deleteReminder(user.id, params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}