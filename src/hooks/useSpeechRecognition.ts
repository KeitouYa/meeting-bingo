import { useCallback, useEffect, useRef, useState } from 'react'

const FATAL_ERRORS = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
])

const MAX_RESTARTS = 5

function isSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
}

export function useSpeechRecognition({
  onFinalResult,
  lang = 'en-US',
}: {
  onFinalResult: (text: string) => void
  lang?: string
}) {
  const [supported] = useState<boolean>(isSupported)
  const [listening, setListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  // Track intended-listening state in a ref (NOT setState) — restart from onend must
  // read this synchronously without triggering a render cycle.
  const intendedRef = useRef(false)
  const restartCountRef = useRef(0)

  // Always points to the latest onFinalResult without re-running the main effect.
  const onFinalResultRef = useRef(onFinalResult)
  onFinalResultRef.current = onFinalResult

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          final += r[0].transcript
        } else {
          interim += r[0].transcript
        }
      }
      setInterimTranscript(interim)
      if (final.trim()) {
        restartCountRef.current = 0
        onFinalResultRef.current(final.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const err = event.error as string
      if (FATAL_ERRORS.has(err)) {
        intendedRef.current = false
        setPermissionDenied(err === 'not-allowed' || err === 'service-not-allowed')
        setError(err)
        setListening(false)
      }
      // transient (no-speech, aborted, network): leave intendedRef true — onend will restart
    }

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript('')

      if (!intendedRef.current) return

      restartCountRef.current++
      if (restartCountRef.current > MAX_RESTARTS) {
        intendedRef.current = false
        setError('Speech recognition stopped — too many consecutive errors.')
        return
      }
      // Restart from the onend handler directly (never from setState/useEffect).
      try {
        recognition.start()
      } catch {
        // "already started" — safe to ignore
      }
    }

    return () => {
      // Full teardown so StrictMode double-invoke doesn't leave two live instances.
      intendedRef.current = false
      recognition.onresult = null
      recognition.onerror = null
      recognition.onstart = null
      recognition.onend = null
      try { recognition.stop() } catch {}
      recognitionRef.current = null
    }
  }, [lang])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    intendedRef.current = true
    restartCountRef.current = 0
    setError(null)
    try {
      recognitionRef.current.start()
    } catch {
      // already started
    }
  }, [])

  const stopListening = useCallback(() => {
    intendedRef.current = false
    try {
      recognitionRef.current?.stop()
    } catch {
      // already stopped
    }
    setListening(false)
    setInterimTranscript('')
  }, [])

  return {
    isSupported: supported,
    isListening: listening,
    interimTranscript,
    error,
    permissionDenied,
    startListening,
    stopListening,
  }
}
