import { describe, it, expect } from "vitest"

import { DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
import { DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
} from "../data-transfer"

describe("buildExportPayload", () => {
  it("wraps a snapshot with the version and export timestamp", () => {
    const payload = buildExportPayload(
      {
        journal: DEFAULT_JOURNAL_STATE,
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget: DEFAULT_BUDGET_STATE,
      },
      "2026-08-14T09:00:00.000Z"
    )

    expect(payload.version).toBe(EXPORT_VERSION)
    expect(payload.exportedAt).toBe("2026-08-14T09:00:00.000Z")
    expect(payload.journal).toBe(DEFAULT_JOURNAL_STATE)
  })
})

describe("exportFileName", () => {
  it("uses the date portion of the export timestamp", () => {
    expect(exportFileName("2026-08-14T09:00:00.000Z")).toBe("orange-banana-2026-08-14.json")
  })
})

describe("parseImportPayload", () => {
  it("rejects a file that isn't valid JSON", () => {
    const result = parseImportPayload("not json")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe("File không phải JSON hợp lệ.")
  })

  it("rejects a JSON file with no version or the wrong version", () => {
    expect(parseImportPayload(JSON.stringify({ foo: "bar" })).ok).toBe(false)
    expect(parseImportPayload(JSON.stringify({ version: 2 })).ok).toBe(false)
  })

  it("fills in defaults for any section missing from the file", () => {
    const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION }))

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.journal).toEqual(DEFAULT_JOURNAL_STATE)
      expect(result.data.finance).toEqual(DEFAULT_FINANCE_STATE)
      expect(result.data.study).toEqual(DEFAULT_STUDY_STATE)
      expect(result.data.settings).toEqual(DEFAULT_SETTINGS)
      expect(result.data.budget).toEqual(DEFAULT_BUDGET_STATE)
    }
  })

  it("restores a valid budget section from the file", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      budget: {
        salaries: [{ month: "2026-09", amount: 20_000_000 }],
        expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }],
        settlements: [],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.budget.salaries).toHaveLength(1)
      expect(result.data.budget.expenses).toHaveLength(1)
    }
  })

  it("falls back to defaults instead of crashing when the budget section is wrong-typed", () => {
    const raw = JSON.stringify({ version: EXPORT_VERSION, budget: { expenses: "not-an-array" } })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.budget.expenses).toEqual([])
    }
  })

  it("restores real data and merges missing fields within a section from defaults", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      journal: { entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }] },
      finance: { savings: [{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.journal.entries).toHaveLength(1)
      expect(result.data.finance.savings).toHaveLength(1)
      expect(result.data.finance.goldStores).toEqual(DEFAULT_FINANCE_STATE.goldStores)
      expect(result.data.study).toEqual(DEFAULT_STUDY_STATE)
      expect(result.summary).toBe(
        "1 bài nhật ký · 0 lần mua vàng · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })

  it("falls back to the default array instead of crashing when an array field is wrong-typed", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      journal: { entries: null },
      finance: { gold: "not-an-array" },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.journal.entries).toEqual(DEFAULT_JOURNAL_STATE.entries)
      expect(result.data.finance.gold).toEqual(DEFAULT_FINANCE_STATE.gold)
      expect(result.summary).toBe(
        "0 bài nhật ký · 0 lần mua vàng · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })

  it("falls back to the default modules array instead of corrupting it when wrong-typed", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { modules: "x" },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.modules).toEqual(DEFAULT_SETTINGS.modules)
    }
  })

  it("falls back to the default tags array instead of corrupting it when wrong-typed", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { tags: "x" },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.tags).toEqual(DEFAULT_SETTINGS.tags)
    }
  })

  it("restores a valid custom tags array from the backup", () => {
    const customTags = [{ label: "Riêng", emoji: "✨", desc: "", tint: "#FFF0B8", on: true }]
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { tags: customTags },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.tags).toEqual(customTags)
    }
  })

  it("migrates a legacy backup file's single goldPrice + storeless purchases into one default store", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: {
        gold: [{ id: 1, date: "10/08/2026", phan: 20, buy: 900_000 }],
        goldPrice: "935.000",
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.goldStores).toEqual([{ name: "Chưa gắn cửa hàng", price: "935.000" }])
      expect(result.data.finance.gold).toEqual([
        { id: 1, date: "10/08/2026", phan: 20, buy: 900_000, store: "Chưa gắn cửa hàng" },
      ])
    }
  })

  it("falls back to the default finance array when its elements are missing required fields, not just when the field is wrong-typed", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: { cards: [{ name: "Thẻ lỗi" }] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.cards).toEqual(DEFAULT_FINANCE_STATE.cards)
    }
  })

  it("falls back to the default study tasks when its elements are missing required fields", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      study: { tasks: [{ label: "Thiếu done" }] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.study.tasks).toEqual(DEFAULT_STUDY_STATE.tasks)
    }
  })

  it("drops legacy settings fields no longer part of AppSettings (e.g. old budget) from an imported backup", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { ...DEFAULT_SETTINGS, budget: { amount: "20.000.000", cycleStart: "1" } },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings).not.toHaveProperty("budget")
      expect(result.data.settings).toEqual(DEFAULT_SETTINGS)
    }
  })
})
