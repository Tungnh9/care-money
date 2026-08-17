import type { JournalEntry } from "./types"

interface JournalState {
  entries: JournalEntry[]
  streak: number
  lastEntryDay: string
}

const JOURNAL_STORAGE_KEY = "journal-entries"

const DEFAULT_JOURNAL_STATE: JournalState = {
  entries: [],
  streak: 0,
  lastEntryDay: "",
}

function getStoredJournal(): JournalState {
  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY)
    if (!raw) return DEFAULT_JOURNAL_STATE
    return { ...DEFAULT_JOURNAL_STATE, ...(JSON.parse(raw) as Partial<JournalState>) }
  } catch {
    return DEFAULT_JOURNAL_STATE
  }
}

function setStoredJournal(state: JournalState) {
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(state))
}

export { JOURNAL_STORAGE_KEY, DEFAULT_JOURNAL_STATE, getStoredJournal, setStoredJournal, type JournalState }
