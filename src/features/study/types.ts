interface VocabEntry {
  id: string
  word: string
  pos?: string
  phonetic?: string
  meaning: string
  topic?: string
  addedAt: string
  example?: string
}

interface GrammarEntry {
  id: string
  title: string
  explanation: string
  examples?: string[]
  addedAt: string
}

interface Task {
  label: string
  done: boolean
}

export type { VocabEntry, GrammarEntry, Task }
