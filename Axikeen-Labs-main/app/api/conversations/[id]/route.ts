import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { deleteConversation, updateConversation } from '@/lib/conversationStore'
import type { Message } from '@/lib/types'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { title?: unknown; messages?: unknown } | null
  const title = typeof body?.title === 'string' && body.title.trim().length > 0 && body.title.trim().length <= 120 ? body.title.trim() : undefined
  const messages = Array.isArray(body?.messages) && body.messages.length <= 100 ? body.messages as Message[] : undefined
  if (body?.messages !== undefined && !messages) return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  const conversation = updateConversation(user.id, params.id, { title, messages })
  if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  return NextResponse.json({ conversation })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!deleteConversation(user.id, params.id)) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}