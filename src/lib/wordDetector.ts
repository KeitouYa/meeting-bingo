function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\./g, '')          // m.v.p. → mvp, r.o.i. → roi
    .replace(/[/\\-]/g, ' ')     // CI/CD → ci cd, dev-ops → dev ops
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function detectWords(
  transcript: string,
  wordList: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normTranscript = normalizeText(transcript)
  const detected: string[] = []

  for (const word of wordList) {
    if (alreadyFilled.has(word.toLowerCase())) continue

    const normWord = normalizeText(word)

    if (normWord.includes(' ')) {
      if (normTranscript.includes(normWord)) {
        detected.push(word)
      }
    } else {
      const re = new RegExp(`\\b${escapeRegex(normWord)}\\b`, 'i')
      if (re.test(normTranscript)) {
        detected.push(word)
      }
    }
  }

  return detected
}

// Aliases keyed by lowercased canonical word.
// - 'api → interface' removed (false positives).
// - 'continuous integration' removed from ci/cd aliases (collision: it's a literal agile word).
// - Dotted acronym entries removed; normalizeText strips dots so direct match handles them.
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd'],
  'mvp': ['minimum viable product'],
  'roi': ['return on investment'],
  'devops': ['dev ops'],
  'sla': ['service level agreement'],
}

export function detectWordsWithAliases(
  transcript: string,
  wordList: string[],
  alreadyFilled: Set<string>,
): string[] {
  const detected = detectWords(transcript, wordList, alreadyFilled)
  const detectedLower = new Set(detected.map(w => w.toLowerCase()))
  const normTranscript = normalizeText(transcript)

  for (const word of wordList) {
    const wordLower = word.toLowerCase()
    if (alreadyFilled.has(wordLower)) continue
    if (detectedLower.has(wordLower)) continue

    const aliases = WORD_ALIASES[wordLower]
    if (!aliases) continue

    for (const alias of aliases) {
      const normAlias = normalizeText(alias)
      const isPhrase = normAlias.includes(' ')
      let matched = false

      if (isPhrase) {
        matched = normTranscript.includes(normAlias)
      } else {
        const re = new RegExp(`\\b${escapeRegex(normAlias)}\\b`, 'i')
        matched = re.test(normTranscript)
      }

      if (matched) {
        detected.push(word)
        detectedLower.add(wordLower)
        break
      }
    }
  }

  return detected
}
