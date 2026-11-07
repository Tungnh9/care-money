import { describe, it, expect } from "vitest"

import { DEFAULT_BUDGET_STATE } from "@/lib/budget/budget-storage"
import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/lib/net-worth/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings/settings-storage"
import { DEFAULT_STUDY_STATE } from "@/lib/study/study-storage"
import { DEFAULT_WORK_STATE } from "@/lib/work/work-storage"
import type { ExportSnapshot } from "@/lib/data-transfer"
import type { JournalEntry } from "@/lib/journal/types"
import type { LifeNote, LifePlan } from "@/lib/life-plan/types"
import { describeLocalOnly, findLocalOnly, keepLocalOnly } from "../local-only"

function entry(id: number, text: string): JournalEntry {
  return { id, text, time: "09:00", date: "07/11", words: 1, mood: null }
}

function note(id: number, title: string, extra: Partial<LifeNote> = {}): LifeNote {
  return { id, day: "2026-11-07", title, content: "", images: [], ...extra }
}

function plan(id: number, title: string): LifePlan {
  return { id, title, targetYear: 2030, status: "planned" }
}

function snapshot(entries: JournalEntry[], notes: LifeNote[] = [], plans: LifePlan[] = []): ExportSnapshot {
  return {
    journal: { entries },
    finance: DEFAULT_FINANCE_STATE,
    study: DEFAULT_STUDY_STATE,
    settings: DEFAULT_SETTINGS,
    budget: DEFAULT_BUDGET_STATE,
    netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
    work: DEFAULT_WORK_STATE,
    lifePlan: { notes, plans },
    goals: { carFundName: null },
  }
}

describe("findLocalOnly", () => {
  it("treats a journal entry with the same id as the same entry, even if its text was edited elsewhere", () => {
    const incoming = snapshot([entry(1000, "Đã sửa ở máy kia")])
    const local = snapshot([entry(1000, "Bản cũ"), entry(2000, "Chỉ trên máy này")])

    expect(findLocalOnly(incoming, local).journal.map((e) => e.text)).toEqual(["Chỉ trên máy này"])
  })

  it("tells apart Plan notes and plans that two devices numbered the same", () => {
    const incoming = snapshot([], [note(5, "Ghi chép máy kia")], [plan(2, "Mua nhà")])
    const local = snapshot([], [note(5, "Ghi chép máy này")], [plan(2, "Mua nhà"), plan(3, "Mua xe")])

    const only = findLocalOnly(incoming, local)
    expect(only.notes.map((n) => n.title)).toEqual(["Ghi chép máy này"])
    expect(only.plans.map((p) => p.title)).toEqual(["Mua xe"])
  })

  it("finds nothing when the copy already holds everything", () => {
    const both = snapshot([entry(1, "a")], [note(1, "n")], [plan(1, "p")])

    expect(describeLocalOnly(findLocalOnly(both, both))).toBeNull()
  })
})

describe("describeLocalOnly", () => {
  it("counts each kind that has something", () => {
    expect(describeLocalOnly({ journal: [entry(1, "a"), entry(2, "b")], notes: [], plans: [plan(1, "p")] })).toBe(
      "2 bài nhật ký · 1 kế hoạch"
    )
  })
})

describe("keepLocalOnly", () => {
  it("adds this device's entries to the copy, newest first", () => {
    const incoming = snapshot([entry(3000, "c"), entry(1000, "a")])
    const local = snapshot([entry(2000, "b")])

    const merged = keepLocalOnly(incoming, local, findLocalOnly(incoming, local))

    expect(merged.journal.entries.map((e) => e.text)).toEqual(["c", "b", "a"])
  })

  it("renumbers Plan notes and plans whose ids are taken, and moves the note's plan link along", () => {
    const incoming = snapshot([], [note(1, "Máy kia")], [plan(1, "Mua nhà")])
    const local = snapshot([], [note(1, "Máy này", { planId: 2 })], [plan(1, "Mua nhà"), plan(2, "Mua xe")])

    const merged = keepLocalOnly(incoming, local, findLocalOnly(incoming, local))

    expect(merged.lifePlan.plans).toEqual([plan(1, "Mua nhà"), plan(2, "Mua xe")])
    expect(merged.lifePlan.notes).toEqual([note(1, "Máy kia"), note(2, "Máy này", { planId: 2 })])
  })

  it("points a kept note at a renumbered plan, or at a plan the copy shares", () => {
    const incoming = snapshot([], [], [plan(1, "Mua nhà"), plan(2, "Đi Nhật")])
    const local = snapshot(
      [],
      [note(7, "Gắn kế hoạch riêng", { planId: 2 }), note(8, "Gắn kế hoạch chung", { planId: 1 })],
      [plan(1, "Mua nhà"), plan(2, "Mua xe")]
    )

    const merged = keepLocalOnly(incoming, local, findLocalOnly(incoming, local))

    expect(merged.lifePlan.plans.map((p) => [p.id, p.title])).toEqual([
      [1, "Mua nhà"],
      [2, "Đi Nhật"],
      [3, "Mua xe"],
    ])
    expect(merged.lifePlan.notes.map((n) => [n.title, n.planId])).toEqual([
      ["Gắn kế hoạch riêng", 3],
      ["Gắn kế hoạch chung", 1],
    ])
  })

  it("drops a kept note's link to a plan that is nowhere", () => {
    const incoming = snapshot([], [], [])
    const local = snapshot([], [note(1, "Mồ côi", { planId: 9 })], [])

    const merged = keepLocalOnly(incoming, local, findLocalOnly(incoming, local))

    expect(merged.lifePlan.notes).toEqual([note(1, "Mồ côi")])
  })

  it("leaves everything else in the copy untouched", () => {
    const incoming = snapshot([entry(1, "a")])
    const local = snapshot([entry(2, "b")])

    const merged = keepLocalOnly(incoming, local, findLocalOnly(incoming, local))

    expect(merged.settings).toBe(incoming.settings)
    expect(merged.finance).toBe(incoming.finance)
    expect(merged.work).toBe(incoming.work)
  })
})
