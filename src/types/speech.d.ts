// Web Speech API types not included in TypeScript's DOM lib by default.

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: SpeechGrammarList
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onnomatch: ((event: SpeechRecognitionEvent) => void) | null
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  abort(): void
  start(): void
  stop(): void
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface Window {
  SpeechRecognition?: typeof SpeechRecognition
  webkitSpeechRecognition?: typeof SpeechRecognition
}
