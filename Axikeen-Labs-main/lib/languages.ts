export type LanguageId =
  | 'english' | 'nigerian-english' | 'nigerian-pidgin' | 'lagos-english' | 'student-english' | 'nigerian-home-english'
  | 'yoruba' | 'hausa' | 'igbo' | 'chinese-simplified' | 'chinese-traditional' | 'japanese' | 'korean'
  | 'spanish' | 'spanish-mexico' | 'french' | 'french-canada' | 'german' | 'portuguese-brazil' | 'portuguese-portugal'
  | 'italian' | 'dutch' | 'polish' | 'russian' | 'ukrainian' | 'hindi' | 'bengali' | 'urdu' | 'arabic'
  | 'turkish' | 'indonesian' | 'vietnamese' | 'thai'

export type LanguageDefinition = {
  id: LanguageId
  label: string
  emoji: string
  locale: string
  aliases: string[]
  translationTarget?: string
  translationStrategy: 'prompt' | 'optional-translation'
  culturalContext: 'neutral' | 'nigerian' | 'global'
  nativeGeneration: 'provider-dependent' | 'prompt-only'
  supportedByLibreTranslate: boolean
  voiceRecognition: 'best-effort-locale' | 'global-english-fallback'
  speechSynthesis: 'best-effort-locale' | 'global-english-fallback'
}

const definition = (
  id: LanguageId,
  label: string,
  locale: string,
  emoji: string,
  aliases: string[],
  translationTarget?: string,
  translationStrategy: LanguageDefinition['translationStrategy'] = 'optional-translation',
  culturalContext: LanguageDefinition['culturalContext'] = 'global',
  nativeGeneration: LanguageDefinition['nativeGeneration'] = 'provider-dependent',
  voiceRecognition: LanguageDefinition['voiceRecognition'] = 'best-effort-locale',
  speechSynthesis: LanguageDefinition['speechSynthesis'] = 'best-effort-locale',
): LanguageDefinition => ({ id, label, locale, emoji, aliases, translationTarget, translationStrategy, culturalContext, nativeGeneration, supportedByLibreTranslate: Boolean(translationTarget), voiceRecognition, speechSynthesis })

export const LANGUAGE_DEFINITIONS: readonly LanguageDefinition[] = [
  definition('english', 'Global English', 'en-US', '🌍', ['english', 'standard', 'neutral', 'neutral / international'], undefined, 'prompt', 'neutral'),
  definition('nigerian-english', 'Nigerian English', 'en-NG', '🇳🇬', ['nigerian_english', 'nigerian english'], undefined, 'prompt', 'nigerian'),
  definition('nigerian-pidgin', 'Nigerian Pidgin', 'en-NG', '🇳🇬', ['pidgin', 'nigerian pidgin'], undefined, 'prompt', 'nigerian'),
  definition('lagos-english', 'Lagos English', 'en-NG', '🗣️', ['lagos'], undefined, 'prompt', 'nigerian'),
  definition('student-english', 'Student English', 'en-NG', '🎓', ['student'], undefined, 'prompt', 'global'),
  definition('nigerian-home-english', 'Nigerian Home English', 'en-NG', '🏠', ['home'], undefined, 'prompt', 'nigerian'),
  definition('yoruba', 'Yoruba', 'yo-NG', '🪘', ['yoruba'], 'yo'),
  definition('hausa', 'Hausa', 'ha-NG', '🌾', ['hausa'], 'ha'),
  definition('igbo', 'Igbo', 'ig-NG', '🧭', ['igbo'], 'ig'),
  definition('chinese-simplified', 'Simplified Chinese', 'zh-CN', '中', ['chinese', 'simplified chinese', 'zh-cn'], 'zh'),
  definition('chinese-traditional', 'Traditional Chinese', 'zh-TW', '繁', ['traditional chinese', 'zh-tw'], 'zh-TW'),
  definition('japanese', 'Japanese', 'ja-JP', '日', ['japanese'], 'ja'),
  definition('korean', 'Korean', 'ko-KR', '한', ['korean'], 'ko'),
  definition('spanish', 'Spanish', 'es-ES', 'ES', ['spanish', 'es-es'], 'es'),
  definition('spanish-mexico', 'Spanish (Mexico)', 'es-MX', 'MX', ['mexican spanish', 'spanish mexico', 'es-mx'], 'es-MX'),
  definition('french', 'French', 'fr-FR', 'FR', ['french', 'fr-fr'], 'fr'),
  definition('french-canada', 'French (Canada)', 'fr-CA', 'CA', ['canadian french', 'french canada', 'fr-ca'], 'fr-CA'),
  definition('german', 'German', 'de-DE', 'DE', ['german'], 'de'),
  definition('portuguese-brazil', 'Portuguese (Brazil)', 'pt-BR', 'BR', ['portuguese', 'brazilian portuguese', 'portuguese brazil', 'pt-br'], 'pt-BR'),
  definition('portuguese-portugal', 'Portuguese (Portugal)', 'pt-PT', 'PT', ['portuguese portugal', 'european portuguese', 'pt-pt'], 'pt-PT'),
  definition('italian', 'Italian', 'it-IT', 'IT', ['italian'], 'it'),
  definition('dutch', 'Dutch', 'nl-NL', 'NL', ['dutch'], 'nl'),
  definition('polish', 'Polish', 'pl-PL', 'PL', ['polish'], 'pl'),
  definition('russian', 'Russian', 'ru-RU', 'RU', ['russian'], 'ru'),
  definition('ukrainian', 'Ukrainian', 'uk-UA', 'UA', ['ukrainian'], 'uk'),
  definition('hindi', 'Hindi', 'hi-IN', 'हि', ['hindi'], 'hi'),
  definition('bengali', 'Bengali', 'bn-BD', 'বাংলা', ['bengali'], 'bn'),
  definition('urdu', 'Urdu', 'ur-PK', 'اردو', ['urdu'], 'ur'),
  definition('arabic', 'Arabic', 'ar-SA', 'ع', ['arabic'], 'ar'),
  definition('turkish', 'Turkish', 'tr-TR', 'TR', ['turkish'], 'tr'),
  definition('indonesian', 'Indonesian', 'id-ID', 'ID', ['indonesian'], 'id'),
  definition('vietnamese', 'Vietnamese', 'vi-VN', 'VN', ['vietnamese'], 'vi'),
  definition('thai', 'Thai', 'th-TH', 'TH', ['thai'], 'th'),
]

const byId = new Map(LANGUAGE_DEFINITIONS.map((item) => [item.id, item]))
const byAlias = new Map(LANGUAGE_DEFINITIONS.flatMap((item) => [item.id, item.label, ...item.aliases].map((alias) => [alias.toLowerCase(), item.id] as const)))

export function normalizeLanguageId(value: unknown): LanguageId {
  if (typeof value !== 'string') return 'english'
  return byAlias.get(value.trim().toLowerCase()) ?? 'english'
}

export function resolveLanguagePreference(serverValue?: string | null, localFallback?: string | null): LanguageId {
  if (typeof serverValue === 'string' && serverValue.trim() !== '') {
    return normalizeLanguageId(serverValue)
  }
  if (typeof localFallback === 'string' && localFallback.trim() !== '') {
    return normalizeLanguageId(localFallback)
  }
  return 'english'
}

export function isSupportedLanguage(value: unknown) {
  return typeof value === 'string' && byAlias.has(value.trim().toLowerCase())
}

export function getLanguageDefinition(value: unknown): LanguageDefinition {
  return byId.get(normalizeLanguageId(value)) ?? byId.get('english')!
}

export function getLanguageLabel(value: unknown) { return getLanguageDefinition(value).label }
export function getLanguageLocale(value: unknown) { return getLanguageDefinition(value).locale }
export function getLanguageEmoji(value: unknown) { return getLanguageDefinition(value).emoji }
export function getLanguageCapabilities(value: unknown) {
  const language = getLanguageDefinition(value)
  return {
    languageId: language.id,
    locale: language.locale,
    culturalContext: language.culturalContext,
    translationStrategy: language.translationStrategy,
    supportedByProvider: language.nativeGeneration,
    supportedByLibreTranslate: language.supportedByLibreTranslate,
    translationTarget: language.translationTarget ?? null,
    voiceRecognition: language.voiceRecognition,
    speechSynthesis: language.speechSynthesis,
  }
}