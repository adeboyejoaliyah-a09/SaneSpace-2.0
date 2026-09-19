import Groq from 'groq-sdk'

export type ProviderName = 'yarngpt' | 'groq'

export interface ProviderInput {
  systemPrompt: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
}

export interface ProviderResult {
  content: string
  provider: ProviderName
}

const PROVIDER_TIMEOUT_MS = 7000

let groqClient: Groq | null = null

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: PROVIDER_TIMEOUT_MS,
      maxRetries: 0,
    })
  }
  return groqClient
}

async function callYarnGpt(input: ProviderInput): Promise<ProviderResult | null> {
  const baseUrl = process.env.YARNGPT_BASE_URL?.trim() || ''
  const apiKey = process.env.YARNGPT_API_KEY?.trim()
  if (!baseUrl || !apiKey) return null

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.YARNGPT_MODEL || 'yarn-gpt-4o-mini',
        messages: input.messages,
        temperature: 0.7,
        max_tokens: 450,
      }),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.warn('YarnGPT request failed', response.status, text)
      return null
    }

    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = payload.choices?.[0]?.message?.content?.trim()
    if (!content) return null

    return { content, provider: 'yarngpt' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('YarnGPT connection error', message)
    return null
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function callGroq(input: ProviderInput): Promise<ProviderResult> {
  if (!process.env.GROQ_API_KEY) {
    return {
      content:
        "I'm here and listening 🌿. To enable real AI responses, add GROQ_API_KEY to your .env.local file.",
      provider: 'groq',
    }
  }

  try {
    const completion = await getGroqClient().chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: input.messages,
      max_tokens: 450,
      temperature: 0.8,
    })

    const content = completion.choices?.[0]?.message?.content ?? "I'm here. Tell me more."
    return { content, provider: 'groq' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('Groq request timed out or failed', message)
    return {
      content: "I’m temporarily unavailable right now. Please try again in a moment.",
      provider: 'groq',
    }
  }
}

export async function invokeSaneSpaceProvider(input: ProviderInput): Promise<ProviderResult> {
  const yarnGptResponse = await callYarnGpt(input)
  if (yarnGptResponse) return yarnGptResponse

  return callGroq(input)
}
