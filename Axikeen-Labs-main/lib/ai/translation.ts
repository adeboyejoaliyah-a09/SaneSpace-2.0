export interface TranslationRequest {
  text: string
  source?: string
  target?: string
}

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<string | null>
}

export class LibreTranslateProvider implements TranslationProvider {
  async translate({ text, source = 'auto', target = 'en' }: TranslationRequest): Promise<string | null> {
    const baseUrl = process.env.LIBRETRANSLATE_BASE_URL?.trim()
    if (!baseUrl || !text.trim()) return null

    try {
      const response = await fetch(baseUrl.replace(/\/$/, ''), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text',
        }),
      })

      if (!response.ok) {
        console.warn('LibreTranslate request failed', response.status)
        return null
      }

      const payload = await response.json() as Array<{ translatedText?: string }> | { translatedText?: string }
      if (Array.isArray(payload)) {
        return payload[0]?.translatedText?.trim() || null
      }

      return payload.translatedText?.trim() || null
    } catch (error) {
      console.warn('LibreTranslate connection error', error)
      return null
    }
  }
}

export const translationProvider: TranslationProvider = new LibreTranslateProvider()

export async function translateText(text: string, target = 'en', source = 'auto'): Promise<string | null> {
  return translationProvider.translate({ text, source, target })
}
