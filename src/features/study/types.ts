interface VocabEntry {
  id: string
  word: string
  pos?: string
  phonetic?: string
  meaning: string
  topic?: string
  addedAt: string
  example?: string
  image?: string
}

interface GrammarEntry {
  id: string
  title: string
  explanation: string
  examples?: string[]
  translations?: string[]
  structure?: string
  addedAt: string
}

interface Task {
  label: string
  done: boolean
}

type GameType = "quiz" | "match" | "spelling"

interface GameHighScores {
  quiz: number
  match: number
  spelling: number
}

interface GameStreak {
  count: number
  lastPlayedDayKey: string | null
}

export type { VocabEntry, GrammarEntry, Task, GameType, GameHighScores, GameStreak }
