import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getSessionUserFromToken } from '@/lib/auth'
import { clearUserMemories, deleteUserMemory, isMemoryEnabled, listUserMemories, setMemoryEnabled, updateUserMemory, upsertUserMemories } from '@/lib/memoryStore'
import type { ExtractedMemory } from '@/lib/memoryExtraction'

async function getUser() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  return token ? getSessionUserFromToken(token) : null
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { enabled?: boolean; memoryId?: string; content?: string }
  if (typeof body.enabled === 'boolean') setMemoryEnabled(user.id, body.enabled)
  if (body.memoryId && typeof body.content === 'string' && body.content.trim()) updateUserMemory(user.id, body.memoryId, body.content)
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memoryId = request.nextUrl.searchParams.get('id')
  if (memoryId) deleteUserMemory(user.id, memoryId)
  else clearUserMemories(user.id)
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json() as { memories?: ExtractedMemory[] }
  const memories = Array.isArray(body.memories) ? body.memories : []
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: isMemoryEnabled(user.id) ? upsertUserMemories(user.id, memories) : [] })
}