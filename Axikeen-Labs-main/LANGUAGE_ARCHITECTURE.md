# Language Architecture

SaneSpace uses canonical language IDs internally. Display labels are presentation-only; aliases are accepted at profile and compatibility boundaries and normalized before storage or runtime behavior.

## Capability model

Each catalog entry in `lib/languages.ts` defines its language ID, BCP-47 locale, aliases, cultural-context classification, generation strategy, translation target, and voice capability. A catalog entry does not imply that every AI, translation, browser speech, or future TTS provider supports it equally.

The current catalog uses these capability meanings:

- `nativeGeneration: provider-dependent`: ask the configured AI provider to generate directly in the requested language, but do not claim that every provider or model has equal quality. `prompt-only` means the catalog supplies guidance without claiming a translation or native-generation guarantee.
- `translationStrategy: optional-translation`: use LibreTranslate after generation only when a configured target exists; preserve the provider response on failure.
- `supportedByLibreTranslate`: metadata indicating a configured target exists, not a guarantee about the deployed LibreTranslate instance.
- `voiceRecognition` and `speechSynthesis`: `best-effort-locale` means the browser receives the requested locale but may fall back; browser capability is runtime-dependent.

## Catalog

| Language | Canonical ID | Locale | Cultural context | Translation | Voice |
| --- | --- | --- | --- | --- | --- |
| Global English | `english` | `en-US` | Neutral | Prompt | Best effort |
| Nigerian English | `nigerian-english` | `en-NG` | Nigerian | Prompt | Best effort |
| Nigerian Pidgin | `nigerian-pidgin` | `en-NG` | Nigerian | Prompt | Best effort |
| Lagos English | `lagos-english` | `en-NG` | Nigerian | Prompt | Best effort |
| Student English | `student-english` | `en-NG` | Global | Prompt | Best effort |
| Nigerian Home English | `nigerian-home-english` | `en-NG` | Nigerian | Prompt | Best effort |
| Yoruba | `yoruba` | `yo-NG` | Global, language-aware | Optional `yo` | Best effort |
| Hausa | `hausa` | `ha-NG` | Global, language-aware | Optional `ha` | Best effort |
| Igbo | `igbo` | `ig-NG` | Global, language-aware | Optional `ig` | Best effort |
| Simplified Chinese | `chinese-simplified` | `zh-CN` | Global | Optional `zh` | Best effort |
| Traditional Chinese | `chinese-traditional` | `zh-TW` | Global | Optional `zh-TW` | Best effort |
| Japanese | `japanese` | `ja-JP` | Global | Optional `ja` | Best effort |
| Korean | `korean` | `ko-KR` | Global | Optional `ko` | Best effort |
| Spanish | `spanish` | `es-ES` | Global | Optional `es` | Best effort |
| Spanish (Mexico) | `spanish-mexico` | `es-MX` | Global | Optional `es-MX` | Best effort |
| French | `french` | `fr-FR` | Global | Optional `fr` | Best effort |
| French (Canada) | `french-canada` | `fr-CA` | Global | Optional `fr-CA` | Best effort |
| German | `german` | `de-DE` | Global | Optional `de` | Best effort |
| Portuguese (Brazil) | `portuguese-brazil` | `pt-BR` | Global | Optional `pt-BR` | Best effort |
| Portuguese (Portugal) | `portuguese-portugal` | `pt-PT` | Global | Optional `pt-PT` | Best effort |
| Italian | `italian` | `it-IT` | Global | Optional `it` | Best effort |
| Dutch | `dutch` | `nl-NL` | Global | Optional `nl` | Best effort |
| Polish | `polish` | `pl-PL` | Global | Optional `pl` | Best effort |
| Russian | `russian` | `ru-RU` | Global | Optional `ru` | Best effort |
| Ukrainian | `ukrainian` | `uk-UA` | Global | Optional `uk` | Best effort |
| Hindi | `hindi` | `hi-IN` | Global | Optional `hi` | Best effort |
| Bengali | `bengali` | `bn-BD` | Global | Optional `bn` | Best effort |
| Urdu | `urdu` | `ur-PK` | Global | Optional `ur` | Best effort |
| Arabic | `arabic` | `ar-SA` | Global | Optional `ar` | Best effort |
| Turkish | `turkish` | `tr-TR` | Global | Optional `tr` | Best effort |
| Indonesian | `indonesian` | `id-ID` | Global | Optional `id` | Best effort |
| Vietnamese | `vietnamese` | `vi-VN` | Global | Optional `vi` | Best effort |
| Thai | `thai` | `th-TH` | Global | Optional `th` | Best effort |

## Response boundary and fallback

The safety gate runs before normal response generation. The provider receives canonical language and locale context, plus separate personality and cultural guidance. Optional LibreTranslate adaptation runs only on the final provider response. System instructions and user messages are never translated. Safety responses return directly with their original emergency guidance, so translation cannot remove or alter crisis resources.

If the provider or translation service is unavailable, SaneSpace returns the safest usable response from the earlier stage. Translation failures, empty results, and timeouts preserve the original provider output.

Voice recognition and browser speech synthesis request the catalog locale on a best-effort basis. Browser support varies by device; unsupported locales fall back to the browser's available speech behavior rather than being treated as guaranteed support.