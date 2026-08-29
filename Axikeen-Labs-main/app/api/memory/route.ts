import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getSessionUserFromToken } from '@/lib/auth'
import { clearUserMemories, deleteUserMemory, isMemoryEnabled, listUserMemories, setMemoryEnabled, updateUserMemory, upsertUserMemories } from '@/lib/memoryStore'
import type { ExtractedMemory } from '@/lib/memoryExtraction'

const MAX_MEMORY_CONTENT_LENGTH = 1000
const VALID_MEMORY_TYPES = new Set(['trigger', 'pattern', 'resilience', 'vocabulary'])
const VALID_SOURCES = new Set(['chat', 'mood_log', 'journal'])

async function getUser() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value
  return token ? getSessionUserFromToken(token) : null
}

function isValidMemoryId(memoryId: string) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(memoryId)
}

function validateMemories(value: unknown): ExtractedMemory[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 20).filter((memory): memory is ExtractedMemory => {
    if (!memory || typeof memory !== 'object') return false
    const candidate = memory as Partial<ExtractedMemory>
    return (
      typeof candidate.category === 'string' &&
      candidate.category.trim().length > 0 &&
      candidate.category.length <= 120 &&
      typeof candidate.content === 'string' &&
      candidate.content.trim().length > 0 &&
      candidate.content.length <= MAX_MEMORY_CONTENT_LENGTH &&
      typeof candidate.confidenceScore === 'number' &&
      candidate.confidenceScore >= 0 &&
      candidate.confidenceScore <= 1 &&
      typeof candidate.memoryType === 'string' &&
      VALID_MEMORY_TYPES.has(candidate.memoryType) &&
      typeof candidate.source === 'string' &&
      VALID_SOURCES.has(candidate.source)
    )
  })
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function PATCH(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { enabled?: boolean; memoryId?: string; content?: string } | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  if (typeof body.enabled === 'boolean') setMemoryEnabled(user.id, body.enabled)
  if (
    typeof body.memoryId === 'string' &&
    isValidMemoryId(body.memoryId) &&
    typeof body.content === 'string' &&
    body.content.trim() &&
    body.content.length <= MAX_MEMORY_CONTENT_LENGTH
  ) {
    updateUserMemory(user.id, body.memoryId, body.content.trim())
  }
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memoryId = request.nextUrl.searchParams.get('id')
  if (memoryId && isValidMemoryId(memoryId)) deleteUserMemory(user.id, memoryId)
  else clearUserMemories(user.id)
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: listUserMemories(user.id) })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { memories?: unknown } | null
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const memories = validateMemories(body.memories)
  return NextResponse.json({ enabled: isMemoryEnabled(user.id), memories: isMemoryEnabled(user.id) ? upsertUserMemories(user.id, memories) : [] })
}
