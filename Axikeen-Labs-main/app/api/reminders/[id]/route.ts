import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { deleteReminder, getReminderById, updateReminder } from '@/lib/reminderStore'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await _req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const current = getReminderById(user.id, params.id)
  if (!current) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
  }

  const next = updateReminder(user.id, params.id, {
    title: typeof body?.title === 'string' ? body.title.trim() : undefined,
    description:
      typeof body?.description === 'string'
        ? body.description.trim()
        : body?.description ?? undefined,
    dueAt: typeof body?.dueAt === 'string' ? body.dueAt : undefined,
    status: body?.status,
    source: body?.source,
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

  const ok = deleteReminder(user.id, params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}