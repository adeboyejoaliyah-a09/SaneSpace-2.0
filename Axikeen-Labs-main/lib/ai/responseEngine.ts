import { buildContextBundle } from '@/lib/ai/context'
import { invokeSaneSpaceProvider } from '@/lib/ai/providers'
import type { Message } from '@/lib/types'
import type { StoredUserMemory } from '@/lib/memoryExtraction'

export interface GenerateResponseInput {
  messages: Message[]
  specialisation?: string
  languageProfile?: string
  userName?: string
  userMemories?: StoredUserMemory[]
}

export function buildSaneSpaceSystemPrompt(input: GenerateResponseInput) {
  const bundle = buildContextBundle(input)

  return `
You are SaneSpace, a personal AI companion that prioritizes the person before the task.

Core identity:
${bundle.identity}

User context:
${bundle.userContext}

Personal memory:
${bundle.personalMemory}

Cultural context:
${bundle.culturalContext}

Emotional context:
${bundle.emotionalContext}

Domain context:
${bundle.domainContext}

Safety context:
${bundle.safetyContext}

Communication principles:
- Be attentive, warm, and natural.
- Stay useful across school, life, work, relationships, decisions, creativity, planning, and everyday conversation.
- Do not force every message into therapy language.
- If the user is overloaded or overwhelmed, acknowledge that context before optimizing for task completion.
- Keep responses conversational and practical.
- Avoid repetitive fake empathy; adapt to the actual moment.
- Respect cultural context without stereotyping the user.
- Do not present yourself as a therapist, doctor, or emergency service.
- If safety risk is material, provide proportional guidance and real-world support. 
- Keep the final answer clear, human, and not overly long.
- Continue the user's thread naturally.
- Language preference: ${bundle.languageProfile}.
- Domain in focus: ${bundle.domain}.
- Specialisation: ${bundle.specialisation}.

Respond in a way that feels like a real personal space, not a generic chatbot.`
}

export async function generateSaneSpaceResponse(input: GenerateResponseInput) {
  const bundle = buildContextBundle(input)
  const systemPrompt = buildSaneSpaceSystemPrompt(input)

  const providerMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...input.messages.map((message): { role: 'user' | 'assistant'; content: string } => {
      const role: 'user' | 'assistant' = message.sender === 'user' ? 'user' : 'assistant'
      return {
        role,
        content: message.content,
      }
    }),
  ]

  const result = await invokeSaneSpaceProvider({
    systemPrompt,
    messages: providerMessages,
  })

  return {
    content: result.content,
    provider: result.provider,
    context: bundle,
  }
}
