interface MoodSnapshot {
  emoji: string
  label: string
  tint: string
}

interface JournalEntry {
  id: number
  text: string
  time: string
  date: string
  words: number
  mood: MoodSnapshot | null
}

export type { MoodSnapshot, JournalEntry }
