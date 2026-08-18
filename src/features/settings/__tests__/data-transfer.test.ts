import { describe, it, expect } from "vitest"

import { DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
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
      expect(result.data.finance.goldPrice).toBe(DEFAULT_FINANCE_STATE.goldPrice)
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
