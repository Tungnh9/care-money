import { describe, it, expect } from "vitest"

import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/lib/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/lib/study/study-storage"
import { DEFAULT_BUDGET_STATE } from "@/lib/budget/budget-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/lib/net-worth/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings/settings-storage"
import {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  restoreCounts,
} from "@/lib/data-transfer"

describe("buildExportPayload", () => {
  it("wraps a snapshot with the version and export timestamp", () => {
    const payload = buildExportPayload(
      {
        journal: DEFAULT_JOURNAL_STATE,
        finance: DEFAULT_FINANCE_STATE,
        study: DEFAULT_STUDY_STATE,
        settings: DEFAULT_SETTINGS,
        budget: DEFAULT_BUDGET_STATE,
        netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
        goals: { carFundName: "Quỹ mua xe" },
      },
      "2026-08-14T09:00:00.000Z"
    )

    expect(payload.version).toBe(EXPORT_VERSION)
    expect(payload.exportedAt).toBe("2026-08-14T09:00:00.000Z")
    expect(payload.journal).toBe(DEFAULT_JOURNAL_STATE)
  })
})

describe("exportFileName", () => {
  it("names the file after the local day of the export", () => {
    const exportedAt = new Date(2026, 7, 14, 16, 0).toISOString()

    expect(exportFileName(exportedAt)).toBe("orange-banana-2026-08-14.json")
  })

  it("uses the local day even before 07:00 in Vietnam, when the UTC date is still yesterday", () => {
    // 06:30 sáng 28/09 theo giờ máy = 23:30 ngày 27/09 UTC khi máy đặt giờ Việt Nam (UTC+7).
    const exportedAt = new Date(2026, 8, 28, 6, 30).toISOString()

    expect(exportFileName(exportedAt)).toBe("orange-banana-2026-09-28.json")
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
      expect(result.data.netWorthHistory).toEqual(DEFAULT_NET_WORTH_HISTORY)
      expect(result.data.goals).toBeUndefined()
    }
  })

  it("restores the car-goal fund link from the goals section", () => {
    const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION, goals: { carFundName: "Quỹ mua xe" } }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.goals).toEqual({ carFundName: "Quỹ mua xe" })
  })

  it("keeps an explicit null link (no fund chosen) distinct from a missing goals section", () => {
    const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION, goals: { carFundName: null } }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.goals).toEqual({ carFundName: null })
  })

  it("treats a wrong-typed goals section as missing rather than guessing a link", () => {
    for (const goals of ["x", { carFundName: 123 }, { carFundName: ["a"] }, {}]) {
      const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION, goals }))

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.data.goals).toBeUndefined()
    }
  })

  it("restores a valid net-worth-history section from the file (v1 backups lack this field)", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      netWorthHistory: [
        { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
        { date: "2026-09-02", net: 10_100_000, savingsTotal: 5_100_000 },
      ],
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.netWorthHistory).toHaveLength(2)
      expect(result.data.netWorthHistory[1].savingsTotal).toBe(5_100_000)
    }
  })

  it("drops only the malformed net-worth-history entries, keeping the valid ones", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      netWorthHistory: [
        { date: "2026-09-01", net: 10_000_000, savingsTotal: 5_000_000 },
        { date: "not-a-date", net: 1, savingsTotal: 1 },
      ],
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.netWorthHistory).toHaveLength(1)
      expect(result.data.netWorthHistory[0].date).toBe("2026-09-01")
    }
  })

  it("backfills a neutral score onto moods imported from a backup saved before mood scores existed", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: {
        ...DEFAULT_SETTINGS,
        moods: [{ label: "Vui", emoji: "🙂", desc: "Vui vẻ", tint: "#fff", on: true }],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.moods).toHaveLength(1)
      expect(result.data.settings.moods[0].score).toBe(3)
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
        "1 bài nhật ký · 0 lần mua vàng · 0 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })

  it("counts the learned words from the study section in the summary", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      study: { ...DEFAULT_STUDY_STATE, learned: ["v-1", "v-2", "v-42"] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.summary).toBe(
        "0 bài nhật ký · 0 lần mua vàng · 3 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
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
        "0 bài nhật ký · 0 lần mua vàng · 0 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
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

  it("drops only the finance elements missing required fields, keeping their valid siblings", () => {
    const validCard = { name: "Thẻ tốt", balance: 1_000_000, min: 100_000, limit: 10_000_000, due: "15" }
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: { cards: [{ name: "Thẻ lỗi" }, validCard] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.cards).toEqual([validCard])
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

  it("renames duplicate fund and card names from a backup so each keeps its own balance", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      finance: {
        savings: [
          { name: "Quỹ A", amount: 100, target: 1_000 },
          { name: "Quỹ A", amount: 5_000, target: 9_000 },
        ],
        cards: [
          { name: "Visa", balance: 1, min: 1, limit: 10, due: "5" },
          { name: "Visa", balance: 2, min: 2, limit: 20, due: "6" },
        ],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.finance.savings.map((f) => [f.name, f.amount])).toEqual([
        ["Quỹ A", 100],
        ["Quỹ A (2)", 5_000],
      ])
      expect(result.data.finance.cards.map((c) => [c.name, c.balance])).toEqual([
        ["Visa", 1],
        ["Visa (2)", 2],
      ])
    }
  })

  it("drops a null journal entry from an imported backup, keeping the valid ones", () => {
    const entry = { id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }
    const raw = JSON.stringify({ version: EXPORT_VERSION, journal: { entries: [null, entry] } })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.journal.entries).toEqual([entry])
      expect(result.summary).toBe(
        "1 bài nhật ký · 0 lần mua vàng · 0 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })

  it("drops null moods and tags from an imported backup instead of throwing", () => {
    const vui = DEFAULT_SETTINGS.moods[1]
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: { ...DEFAULT_SETTINGS, moods: [null, vui], tags: [null] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.moods).toEqual([vui])
      expect(result.data.settings.tags).toEqual([])
    }
  })

  it("merges imported modules with the current module list, keeping only each one's on/off", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      settings: {
        modules: [
          { key: "taichinh", label: "Nhãn cũ", hint: "", on: false },
          { key: "chuoingay", label: "Chuỗi ngày", hint: "", on: true },
        ],
      },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.settings.modules).toEqual(
        DEFAULT_SETTINGS.modules.map((m) => (m.key === "taichinh" ? { ...m, on: false } : m))
      )
    }
  })

  it("keeps the valid learned ids from an imported backup and drops only a wrong-typed one", () => {
    const raw = JSON.stringify({
      version: EXPORT_VERSION,
      study: { ...DEFAULT_STUDY_STATE, learned: ["v-0001", null, "v-0002"] },
    })

    const result = parseImportPayload(raw)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.study.learned).toEqual(["v-0001", "v-0002"])
      expect(result.summary).toBe(
        "0 bài nhật ký · 0 lần mua vàng · 2 từ đã học · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu"
      )
    }
  })

  it("returns the file's exportedAt so the confirm dialog can show how old the copy is", () => {
    const result = parseImportPayload(
      JSON.stringify({ version: EXPORT_VERSION, exportedAt: "2026-09-20T02:00:00.000Z" })
    )

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.exportedAt).toBe("2026-09-20T02:00:00.000Z")
  })

  it("returns a null exportedAt when a hand-made file has none or a non-string one", () => {
    for (const exportedAt of [undefined, 123]) {
      const result = parseImportPayload(JSON.stringify({ version: EXPORT_VERSION, exportedAt }))

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.exportedAt).toBeNull()
    }
  })
})

describe("restoreCounts", () => {
  it("lists journal entries, expenses, savings funds, gold purchases and learned words", () => {
    const result = parseImportPayload(
      JSON.stringify({
        version: EXPORT_VERSION,
        journal: { entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "10/08", words: 2, mood: null }] },
        budget: {
          expenses: [
            { id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null },
            { id: 2, dayKey: "2026-09-02", amount: 10_000, tag: null },
          ],
        },
        finance: { savings: [{ name: "Quỹ A", amount: 1, target: 2 }] },
        study: { ...DEFAULT_STUDY_STATE, learned: ["v-1", "v-2", "v-3"] },
      })
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(restoreCounts(result.data)).toBe(
        "1 bài nhật ký · 2 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 3 từ đã học"
      )
    }
  })
})
