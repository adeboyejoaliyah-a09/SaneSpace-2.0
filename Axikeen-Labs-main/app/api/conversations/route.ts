import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createConversation, listConversations } from '@/lib/conversationStore'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ conversations: listConversations(user.id) })
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { title?: unknown; mode?: unknown } | null
  const title = typeof body?.title === 'string' && body.title.trim().length <= 120 ? body.title.trim() : 'New conversation'
  const mode = body?.mode === 'voice' ? 'voice' : 'text'
  return NextResponse.json({ conversation: createConversation(user.id, { title, mode }) }, { status: 201 })
}