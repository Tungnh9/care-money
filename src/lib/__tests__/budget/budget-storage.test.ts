import { describe, it, expect, beforeEach } from "vitest"

import {
  BUDGET_STORAGE_KEY,
  DEFAULT_BUDGET_STATE,
  getStoredBudget,
  setStoredBudget,
  renameFundInSettlements,
} from "@/lib/budget/budget-storage"
import type { Expense } from "@/lib/budget/types"

describe("getStoredBudget", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("falls back to defaults when localStorage is empty", () => {
    expect(getStoredBudget()).toEqual(DEFAULT_BUDGET_STATE)
  })

  it("falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(BUDGET_STORAGE_KEY, "{not valid json")

    expect(getStoredBudget()).toEqual(DEFAULT_BUDGET_STATE)
  })

  it("falls back to an empty array when a field holding a list is not an array at all", () => {
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: "not an array" })
    )

    expect(getStoredBudget().expenses).toEqual([])
  })

  it("drops only the single malformed expense, keeping valid siblings (per-element filter)", () => {
    const valid = { id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: [valid, { id: 2, dayKey: "2026-09-02" }] })
    )

    expect(getStoredBudget().expenses).toEqual([valid])
  })

  it("drops only the single malformed settlement, keeping valid siblings", () => {
    const valid = {
      id: 1,
      month: "2026-09",
      at: "2026-09-30T00:00:00.000Z",
      direction: "deposit",
      amount: 100_000,
      fundName: "Quỹ A",
      fundAmountBefore: 0,
      fundAmountAfter: 100_000,
    }
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [valid, { id: 2, month: "2026-09" }] })
    )

    expect(getStoredBudget().settlements).toEqual([valid])
  })

  it("keeps a valid field untouched even when a sibling field is malformed", () => {
    const salary = { month: "2026-09", amount: 20_000_000 }
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, salaries: [salary], expenses: "corrupted" })
    )

    const state = getStoredBudget()
    expect(state.salaries).toEqual([salary])
    expect(state.expenses).toEqual([])
  })

  it("drops an expense with a negative amount", () => {
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: [{ id: 1, dayKey: "2026-09-01", amount: -5, tag: null }] })
    )

    expect(getStoredBudget().expenses).toEqual([])
  })

  it("drops an expense with a non-integer amount", () => {
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: [{ id: 1, dayKey: "2026-09-01", amount: 1.5, tag: null }] })
    )

    expect(getStoredBudget().expenses).toEqual([])
  })

  it("accepts an expense with tag: null (explicit untagged state, not corruption)", () => {
    const expense = { id: 1, dayKey: "2026-09-01", amount: 50_000, tag: null }
    window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: [expense] }))

    expect(getStoredBudget().expenses).toEqual([expense])
  })

  it("keeps every field of an expense, including the note and tag, through a stored round trip", () => {
    // Đọc trả về bản đã qua schema (field lạ bị bỏ) — field nào thiếu khỏi schema sẽ âm thầm rụng ở lần
    // ghi kế tiếp. Required<Expense>: thêm 1 field vào Expense thì fixture này buộc phải đổi theo.
    const expense: Required<Expense> = {
      id: 1,
      dayKey: "2026-09-01",
      amount: 85_000,
      note: "Ăn trưa với đồng nghiệp",
      tag: { label: "Ăn uống", emoji: "🍜", tint: "#FFE0C7" },
      card: { kind: "swipe", cardName: "Visa" },
    }
    const state = { ...DEFAULT_BUDGET_STATE, expenses: [expense] }

    setStoredBudget(state)

    expect(getStoredBudget()).toEqual(state)
  })

  it("drops an expense whose tag snapshot is missing a required field", () => {
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_BUDGET_STATE,
        expenses: [{ id: 1, dayKey: "2026-09-01", amount: 50_000, tag: { label: "Mua sắm" } }],
      })
    )

    expect(getStoredBudget().expenses).toEqual([])
  })

  it("accepts a settlement whose fundName matches no current savings fund (orphan tolerance)", () => {
    const settlement = {
      id: 1,
      month: "2026-09",
      at: "2026-09-30T00:00:00.000Z",
      direction: "withdraw",
      amount: 50_000,
      fundName: "Quỹ đã xoá",
      fundAmountBefore: 100_000,
      fundAmountAfter: 50_000,
    }
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [settlement] })
    )

    expect(getStoredBudget().settlements).toEqual([settlement])
  })

  it("keeps a settlement whose fund balances are fractional, as a fund read from an imported file can be", () => {
    const settlement = {
      id: 1,
      month: "2026-09",
      at: "2026-09-30T00:00:00.000Z",
      direction: "deposit",
      amount: 300_000,
      fundName: "Quỹ A",
      fundAmountBefore: 150_000.5,
      fundAmountAfter: 450_000.5,
    }
    window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [settlement] }))

    expect(getStoredBudget().settlements).toEqual([settlement])
  })

  it("still drops a settlement whose fund balance is not a number", () => {
    const settlement = {
      id: 1,
      month: "2026-09",
      at: "2026-09-30T00:00:00.000Z",
      direction: "deposit",
      amount: 300_000,
      fundName: "Quỹ A",
      fundAmountBefore: "150000",
      fundAmountAfter: 450_000,
    }
    window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BUDGET_STATE, settlements: [settlement] }))

    expect(getStoredBudget().settlements).toEqual([])
  })
})

describe("renameFundInSettlements", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("rewrites fundName on every settlement across every month that referenced the old name", () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      settlements: [
        {
          id: 1,
          month: "2026-08",
          at: "2026-08-31T00:00:00.000Z",
          direction: "deposit",
          amount: 100_000,
          fundName: "Quỹ A",
          fundAmountBefore: 0,
          fundAmountAfter: 100_000,
        },
        {
          id: 2,
          month: "2026-09",
          at: "2026-09-30T00:00:00.000Z",
          direction: "withdraw",
          amount: 20_000,
          fundName: "Quỹ A",
          fundAmountBefore: 100_000,
          fundAmountAfter: 80_000,
        },
      ],
    })

    renameFundInSettlements("Quỹ A", "Quỹ B")

    const state = getStoredBudget()
    expect(state.settlements[0].fundName).toBe("Quỹ B")
    expect(state.settlements[1].fundName).toBe("Quỹ B")
  })

  it("leaves settlements referencing a different fund untouched", () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      settlements: [
        {
          id: 1,
          month: "2026-09",
          at: "2026-09-30T00:00:00.000Z",
          direction: "deposit",
          amount: 100_000,
          fundName: "Quỹ khác",
          fundAmountBefore: 0,
          fundAmountAfter: 100_000,
        },
      ],
    })

    renameFundInSettlements("Quỹ A", "Quỹ B")

    expect(getStoredBudget().settlements[0].fundName).toBe("Quỹ khác")
  })
})

describe("expense card link", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  const base: Expense = { id: 1, dayKey: "2026-09-01", amount: 500_000, tag: null }

  it("keeps an expense's card link through a stored round trip", () => {
    for (const cardName of ["Visa", null]) {
      const expenses: Expense[] = [{ ...base, card: { kind: "swipe", cardName } }]
      setStoredBudget({ ...DEFAULT_BUDGET_STATE, expenses })
      expect(getStoredBudget().expenses).toEqual(expenses)
    }
  })

  it("keeps an expense whose card link is malformed, dropping only the link", () => {
    window.localStorage.setItem(
      BUDGET_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_BUDGET_STATE, expenses: [{ ...base, card: { kind: "nope" } }] })
    )
    const { expenses } = getStoredBudget()
    expect(expenses).toHaveLength(1)
    expect(expenses[0].card).toBeUndefined()
    expect(expenses[0]).toMatchObject(base)
  })

  it("reads old expenses without a card link unchanged", () => {
    setStoredBudget({ ...DEFAULT_BUDGET_STATE, expenses: [base] })
    const [read] = getStoredBudget().expenses
    expect(read).toEqual(base)
    expect(read).not.toHaveProperty("card")
  })
})
