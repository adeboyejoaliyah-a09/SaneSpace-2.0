export function speakWithBrowser(text: string, locale: string): Promise<boolean> {
  if (!text.trim() || typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve(false)

  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale
    utterance.rate = 0.95

    const matchingVoice = synth.getVoices().find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
      ?? synth.getVoices().find((voice) => voice.lang.toLowerCase().startsWith(locale.split('-')[0].toLowerCase()))
    if (matchingVoice) utterance.voice = matchingVoice

    let settled = false
    const finish = (success: boolean) => {
      if (settled) return
      settled = true
      resolve(success)
    }

    utterance.onstart = () => undefined
    utterance.onend = () => finish(true)
    utterance.onerror = () => finish(false)
    synth.cancel()
    synth.resume()
    synth.speak(utterance)
  })
}

export function playAudioElement(audio: HTMLAudioElement, url: string): Promise<boolean> {
  audio.src = url
  return new Promise((resolve) => {
    let settled = false
    const finish = (success: boolean) => {
      if (settled) return
      settled = true
      resolve(success)
    }
    audio.onended = () => finish(true)
    audio.onerror = () => finish(false)
    void audio.play().then(() => undefined).catch(() => finish(false))
  })
}