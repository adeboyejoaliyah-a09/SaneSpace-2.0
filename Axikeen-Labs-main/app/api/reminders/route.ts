import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createReminder, listReminders } from '@/lib/reminderStore'

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reminders = listReminders(user.id)
  return NextResponse.json({ reminders })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const dueAt = typeof body?.dueAt === 'string' ? body.dueAt : ''
  const description =
    typeof body?.description === 'string' ? body.description.trim() : null

  if (!title || !dueAt) {
    return NextResponse.json({ error: 'Title and dueAt are required' }, { status: 400 })
  }

  const date = new Date(dueAt)
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid dueAt value' }, { status: 400 })
  }

  const reminder = createReminder({
    userId: user.id,
    title,
    description,
    dueAt: date.toISOString(),
    source: body?.source ?? 'user_created',
  })

  return NextResponse.json({ reminder }, { status: 201 })
}