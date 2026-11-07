import { beforeEach, describe, expect, it, vi } from "vitest"

import { onDataChanged } from "@/lib/data-change-bus"
import {
  JOURNAL_DRAFT_KEY,
  clearJournalDraft,
  getJournalDraft,
  setJournalDraft,
} from "@/lib/journal/journal-draft-storage"

const DRAFT = { html: "<p>Hôm nay đi bộ</p>", words: 3, mood: "Vui", savedAt: "2026-11-07T14:30:00.000Z" }

describe("journal draft storage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("keeps a draft and gives it back", () => {
    setJournalDraft(DRAFT)

    expect(getJournalDraft()).toEqual(DRAFT)
  })

  it("tells the app a draft was written, so the storage meter follows", () => {
    const listener = vi.fn()
    const unsubscribe = onDataChanged(listener)
    setJournalDraft(DRAFT)
    unsubscribe()

    expect(listener).toHaveBeenCalled()
  })

  it("does not keep a draft with no text, and drops the one already kept", () => {
    setJournalDraft(DRAFT)
    setJournalDraft({ ...DRAFT, html: "<p><br></p>", words: 0 })

    expect(window.localStorage.getItem(JOURNAL_DRAFT_KEY)).toBeNull()
    expect(getJournalDraft()).toBeNull()
  })

  it("clears the draft", () => {
    setJournalDraft(DRAFT)
    clearJournalDraft()

    expect(getJournalDraft()).toBeNull()
  })

  it("reads a broken draft as none instead of failing", () => {
    window.localStorage.setItem(JOURNAL_DRAFT_KEY, "{not json")
    expect(getJournalDraft()).toBeNull()

    window.localStorage.setItem(JOURNAL_DRAFT_KEY, JSON.stringify({ words: 3 }))
    expect(getJournalDraft()).toBeNull()
  })

  it("never throws when the browser refuses to write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError")
    })
    try {
      expect(() => setJournalDraft(DRAFT)).not.toThrow()
    } finally {
      spy.mockRestore()
    }
  })
})
