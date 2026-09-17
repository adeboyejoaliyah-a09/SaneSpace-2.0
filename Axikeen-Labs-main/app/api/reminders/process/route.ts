import { NextRequest, NextResponse } from 'next/server'
import { processDueReminders } from '@/lib/reminderStore'

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization') ?? req.headers.get('x-cron-secret')
  const isAuthorized = Boolean(cronSecret) && (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret)

  if (!cronSecret || !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const result = await processDueReminders(now)

  return NextResponse.json({
    ok: true,
    processed: result.processed.length,
    skipped: result.skipped,
    processedReminders: result.processed.map((reminder) => ({
      id: reminder.id,
      userId: reminder.userId,
      title: reminder.title,
      status: reminder.status,
      dueAt: reminder.dueAt,
      recurrence: reminder.recurrence,
      nextOccurrence: reminder.nextOccurrence,
    })),
    checkedAt: now.toISOString(),
  })
}
