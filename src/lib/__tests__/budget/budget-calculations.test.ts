import { describe, it, expect } from "vitest"

import {
  totalExpensesForMonth,
  salaryForMonth,
  signedSettledForMonth,
  remainingToSettle,
  breakdownByTag,
  groupExpensesByDay,
  monthlyExpenseTotals,
  monthlyTagBreakdown,
  unsettledPastMonths,
  hasSalaryRecord,
  settlementsMadeInMonth,
  tagChartColors,
  CHART_PALETTE,
  UNTAGGED_CHART_COLOR,
  exceedsBudgetAmountLimit,
  MAX_BUDGET_AMOUNT,
} from "@/lib/budget/budget-calculations"
import type { Expense, MonthlySalary, Settlement } from "@/lib/budget/types"
import { DEFAULT_TAGS } from "@/lib/settings/settings-storage"

const TAG_RENT = { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8" }
const TAG_SHOPPING = { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" }

function expense(overrides: Partial<Expense>): Expense {
  return { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null, ...overrides }
}

function settlement(overrides: Partial<Settlement>): Settlement {
  return {
    id: 1,
    month: "2026-09",
    at: "2026-09-15T00:00:00.000Z",
    direction: "deposit",
    amount: 100_000,
    fundName: "Quỹ A",
    fundAmountBefore: 0,
    fundAmountAfter: 100_000,
    ...overrides,
  }
}

describe("totalExpensesForMonth", () => {
  it("sums amounts of expenses within the given month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-09-15", amount: 200_000 }),
    ]
    expect(totalExpensesForMonth(expenses, "2026-09")).toBe(300_000)
  })

  it("ignores expenses from a different month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-08-15", amount: 999_999 }),
    ]
    expect(totalExpensesForMonth(expenses, "2026-09")).toBe(100_000)
  })

  it("returns 0 for a month with no expenses", () => {
    expect(totalExpensesForMonth([], "2026-09")).toBe(0)
  })
})

describe("salaryForMonth", () => {
  it("returns the salary amount for the matching month", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 20_000_000 }]
    expect(salaryForMonth(salaries, "2026-09")).toBe(20_000_000)
  })

  it("returns 0 when no salary is set for that month", () => {
    expect(salaryForMonth([], "2026-09")).toBe(0)
  })
})

describe("signedSettledForMonth", () => {
  it("returns 0 with no settlements", () => {
    expect(signedSettledForMonth([], "2026-09")).toBe(0)
  })

  it("sums deposits as positive", () => {
    const settlements = [settlement({ direction: "deposit", amount: 100_000 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(100_000)
  })

  it("sums withdraws as negative", () => {
    const settlements = [settlement({ direction: "withdraw", amount: 40_000 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(-40_000)
  })

  it("nets mixed deposit and withdraw settlements", () => {
    const settlements = [
      settlement({ id: 1, direction: "deposit", amount: 100_000 }),
      settlement({ id: 2, direction: "withdraw", amount: 30_000 }),
    ]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(70_000)
  })

  it("ignores settlements from a different month", () => {
    const settlements = [settlement({ month: "2026-08", direction: "deposit", amount: 999_999 })]
    expect(signedSettledForMonth(settlements, "2026-09")).toBe(0)
  })
})

describe("remainingToSettle", () => {
  it("equals the full net (salary - expenses) with no prior settlements", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 300_000 })]
    expect(remainingToSettle(salaries, expenses, [], "2026-09")).toBe(700_000)
  })

  it("hits exactly 0 after one settlement matching the full surplus", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 1_000_000 })]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(0)
  })

  it("leaves a nonzero remainder after one partial deposit", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 500_000 })]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(500_000)
  })

  it("goes negative when new expenses arrive after a partial deposit overshoots the true surplus", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [settlement({ direction: "deposit", amount: 500_000 })]
    const expenses = [expense({ dayKey: "2026-09-20", amount: 700_000 })]
    // net = 1,000,000 - 700,000 = 300,000 ; signedSettled = 500,000 ; remaining = 300,000 - 500,000 = -200,000
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(-200_000)
  })

  it("leaves a nonzero-negative remainder after one partial withdraw", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 1_500_000 })]
    const settlements = [settlement({ direction: "withdraw", amount: 300_000 })]
    // net = 1,000,000 - 1,500,000 = -500,000 ; signedSettled = -300,000 ; remaining = -500,000 - (-300,000) = -200,000
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(-200_000)
  })

  it("reaches exactly 0 after multiple partial settlements summing to the full net", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const settlements = [
      settlement({ id: 1, direction: "deposit", amount: 400_000 }),
      settlement({ id: 2, direction: "deposit", amount: 600_000 }),
    ]
    expect(remainingToSettle(salaries, [], settlements, "2026-09")).toBe(0)
  })

  it("is unaffected by the order expenses vs. settlements were logged in", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-09", amount: 1_000_000 }]
    const expenses = [expense({ dayKey: "2026-09-01", amount: 200_000 })]
    const settlements = [settlement({ direction: "deposit", amount: 300_000 })]
    const a = remainingToSettle(salaries, expenses, settlements, "2026-09")
    const b = remainingToSettle(salaries, [...expenses].reverse(), [...settlements].reverse(), "2026-09")
    expect(a).toBe(b)
    expect(a).toBe(500_000)
  })

  it("is fully isolated from other months' expenses/settlements", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-09", amount: 1_000_000 },
      { month: "2026-08", amount: 5_000_000 },
    ]
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 200_000 }),
      expense({ id: 2, dayKey: "2026-08-01", amount: 4_999_999 }),
    ]
    const settlements = [settlement({ id: 1, month: "2026-08", direction: "deposit", amount: 1 })]
    expect(remainingToSettle(salaries, expenses, settlements, "2026-09")).toBe(800_000)
  })

  it("returns 0 for an untouched month with no salary, no expenses, and no settlements", () => {
    expect(remainingToSettle([], [], [], "2026-09")).toBe(0)
  })
})

describe("breakdownByTag", () => {
  it("groups expenses by the snapshotted tag label within the given month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000, tag: TAG_RENT }),
      expense({ id: 2, dayKey: "2026-09-02", amount: 50_000, tag: TAG_RENT }),
      expense({ id: 3, dayKey: "2026-09-03", amount: 30_000, tag: TAG_SHOPPING }),
    ]
    const result = breakdownByTag(expenses, "2026-09")
    expect(result).toEqual(
      expect.arrayContaining([
        { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 150_000 },
        { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", total: 30_000 },
      ])
    )
  })

  it("buckets untagged (null) expenses into a separate 'Không gắn thẻ' group instead of dropping them", () => {
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 40_000, tag: null })]
    const result = breakdownByTag(expenses, "2026-09")
    expect(result).toEqual([{ label: "Không gắn thẻ", emoji: "🏷️", tint: "#F2E9DC", total: 40_000 }])
  })

  it("keeps a correct bucket for a tag whose label no longer exists in current Settings (still snapshotted)", () => {
    const goneTag = { label: "Tag đã xoá", emoji: "❓", tint: "#EEE" }
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 10_000, tag: goneTag })]
    expect(breakdownByTag(expenses, "2026-09")).toEqual([
      { label: "Tag đã xoá", emoji: "❓", tint: "#EEE", total: 10_000 },
    ])
  })

  it("only sums expenses within the requested month", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 10_000, tag: TAG_RENT }),
      expense({ id: 2, dayKey: "2026-08-01", amount: 999_999, tag: TAG_RENT }),
    ]
    expect(breakdownByTag(expenses, "2026-09")).toEqual([
      { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", total: 10_000 },
    ])
  })
})

describe("groupExpensesByDay", () => {
  it("groups expenses that share the same dayKey and sums their total", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-09-01", amount: 50_000 }),
      expense({ id: 3, dayKey: "2026-09-02", amount: 30_000 }),
    ]
    const result = groupExpensesByDay(expenses)
    expect(result).toEqual([
      { dayKey: "2026-09-02", expenses: [expenses[2]], total: 30_000 },
      { dayKey: "2026-09-01", expenses: [expenses[0], expenses[1]], total: 150_000 },
    ])
  })

  it("orders days most-recent-first", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-09-05" }),
      expense({ id: 2, dayKey: "2026-09-20" }),
      expense({ id: 3, dayKey: "2026-09-12" }),
    ]
    expect(groupExpensesByDay(expenses).map((g) => g.dayKey)).toEqual([
      "2026-09-20",
      "2026-09-12",
      "2026-09-05",
    ])
  })

  it("returns an empty array for no expenses", () => {
    expect(groupExpensesByDay([])).toEqual([])
  })
})

describe("monthlyExpenseTotals", () => {
  it("produces one data point per requested month, even for a month with zero expenses", () => {
    const expenses = [expense({ dayKey: "2026-10-01", amount: 200_000 })]
    const result = monthlyExpenseTotals(expenses, ["2026-10", "2026-11"])
    expect(result).toEqual([
      { month: "2026-10", total: 200_000 },
      { month: "2026-11", total: 0 },
    ])
  })

  it("sums every expense within each requested month via dayKey", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-10-01", amount: 100_000 }),
      expense({ id: 2, dayKey: "2026-10-31", amount: 50_000 }),
    ]
    expect(monthlyExpenseTotals(expenses, ["2026-10"])).toEqual([{ month: "2026-10", total: 150_000 }])
  })

  it("excludes expenses outside the requested months", () => {
    const expenses = [expense({ dayKey: "2026-01-01", amount: 999_999 })]
    expect(monthlyExpenseTotals(expenses, ["2026-10"])).toEqual([{ month: "2026-10", total: 0 }])
  })
})

describe("monthlyTagBreakdown", () => {
  it("returns one series per distinct tag seen across the requested months, aligned to those months", () => {
    const expenses = [
      expense({ id: 1, dayKey: "2026-08-01", amount: 100_000, tag: TAG_RENT }),
      expense({ id: 2, dayKey: "2026-09-01", amount: 50_000, tag: TAG_RENT }),
      expense({ id: 3, dayKey: "2026-09-02", amount: 30_000, tag: TAG_SHOPPING }),
    ]

    const result = monthlyTagBreakdown(expenses, ["2026-08", "2026-09"])

    expect(result).toEqual(
      expect.arrayContaining([
        { label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [100_000, 50_000] },
        { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF", data: [0, 30_000] },
      ])
    )
  })

  it("fills 0 for a month where a tag (seen in another requested month) has no expenses", () => {
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 100_000, tag: TAG_RENT })]

    const result = monthlyTagBreakdown(expenses, ["2026-08", "2026-09", "2026-10"])

    expect(result).toEqual([{ label: "Tiền trọ", emoji: "🏠", tint: "#FFF0B8", data: [0, 100_000, 0] }])
  })

  it("buckets untagged expenses into 'Không gắn thẻ' just like breakdownByTag", () => {
    const expenses = [expense({ id: 1, dayKey: "2026-09-01", amount: 40_000, tag: null })]

    const result = monthlyTagBreakdown(expenses, ["2026-09"])

    expect(result).toEqual([{ label: "Không gắn thẻ", emoji: "🏷️", tint: "#F2E9DC", data: [40_000] }])
  })

  it("returns an empty array when no requested month has any expenses", () => {
    expect(monthlyTagBreakdown([], ["2026-09", "2026-10"])).toEqual([])
  })
})

describe("unsettledPastMonths", () => {
  it("lists every past month with a salary record that is still off, newest first, however far back", () => {
    const salaries: MonthlySalary[] = [
      { month: "2024-03", amount: 500_000 },
      { month: "2026-07", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ]
    const expenses = [expense({ dayKey: "2026-08-20", amount: 850_000 })]

    expect(unsettledPastMonths(salaries, expenses, [], "2026-09")).toEqual([
      { month: "2026-08", remaining: 150_000 },
      { month: "2026-07", remaining: 1_000_000 },
      { month: "2024-03", remaining: 500_000 },
    ])
  })

  it("never lists the current or a future month", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-09", amount: 1_000_000 },
      { month: "2026-11", amount: 1_000_000 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([{ month: "2026-08", remaining: 1_000_000 }])
  })

  it("leaves out a past month without a salary record, even with spending or a settlement", () => {
    const expenses = [expense({ dayKey: "2026-08-20", amount: 500_000 })]
    const settlements = [settlement({ month: "2026-08", direction: "withdraw", amount: 200_000 })]

    expect(unsettledPastMonths([], expenses, settlements, "2026-09")).toEqual([])
  })

  it("counts a salary record of 0 đ", () => {
    const salaries: MonthlySalary[] = [{ month: "2026-08", amount: 0 }]

    expect(unsettledPastMonths(salaries, [expense({ dayKey: "2026-08-20", amount: 70_000 })], [], "2026-09")).toEqual([
      { month: "2026-08", remaining: -70_000 },
    ])
    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([])
  })

  it("leaves out a fully settled month but keeps what is left of a partly settled one", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-07", amount: 1_000_000 },
      { month: "2026-08", amount: 1_000_000 },
    ]
    const expenses = [expense({ dayKey: "2026-08-20", amount: 850_000 })]
    const settlements = [
      settlement({ id: 1, month: "2026-08", direction: "deposit", amount: 150_000 }),
      settlement({ id: 2, month: "2026-07", direction: "deposit", amount: 400_000 }),
    ]

    expect(unsettledPastMonths(salaries, expenses, settlements, "2026-09")).toEqual([{ month: "2026-07", remaining: 600_000 }])
  })

  it("lists a month only once when its salary was recorded twice", () => {
    const salaries: MonthlySalary[] = [
      { month: "2026-08", amount: 1_000_000 },
      { month: "2026-08", amount: 2_000_000 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-09")).toEqual([{ month: "2026-08", remaining: 1_000_000 }])
  })

  it("ignores salary records whose month is not a YYYY-MM key", () => {
    // Tháng hiện tại 2027-01 để "2026-9", "2026-13", "2026-00" đều nhỏ hơn nó khi so chuỗi:
    // chỉ phép kiểm định dạng mới loại được chúng.
    const salaries: MonthlySalary[] = [
      { month: "", amount: 1 },
      { month: "2026-9", amount: 1 },
      { month: "2026-13", amount: 1 },
      { month: "2026-00", amount: 1 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2027-01")).toEqual([])
  })

  it("orders months across the new year", () => {
    const salaries: MonthlySalary[] = [
      { month: "2025-11", amount: 1 },
      { month: "2026-01", amount: 1 },
      { month: "2025-12", amount: 1 },
    ]

    expect(unsettledPastMonths(salaries, [], [], "2026-02").map((m) => m.month)).toEqual(["2026-01", "2025-12", "2025-11"])
  })
})

describe("hasSalaryRecord", () => {
  it("is true for a recorded salary, even 0 đ, and false when the month has none", () => {
    expect(hasSalaryRecord([{ month: "2026-09", amount: 0 }], "2026-09")).toBe(true)
    expect(hasSalaryRecord([{ month: "2026-08", amount: 1_000_000 }], "2026-09")).toBe(false)
  })
})

describe("tagChartColors", () => {
  const TAGS = [{ label: "Tiền trọ" }, { label: "Mua sắm" }, { label: "Ăn uống" }]

  it("colours each tag by its place in Settings, whatever order a chart lists it in", () => {
    const colors = tagChartColors(["Ăn uống", "Tiền trọ"], TAGS)

    expect(colors.get("Tiền trọ")).toBe(CHART_PALETTE[0])
    expect(colors.get("Ăn uống")).toBe(CHART_PALETTE[2])
    expect(tagChartColors(["Tiền trọ", "Ăn uống"], TAGS)).toEqual(colors)
  })

  it("always paints 'Không gắn thẻ' grey, a colour no tag gets", () => {
    const colors = tagChartColors(["Không gắn thẻ", "Tiền trọ"], TAGS)

    expect(colors.get("Không gắn thẻ")).toBe(UNTAGGED_CHART_COLOR)
    expect(CHART_PALETTE).not.toContain(UNTAGGED_CHART_COLOR)
  })

  it("gives tags no longer in Settings the colours right after the Settings tags", () => {
    const colors = tagChartColors(["Tag đã xoá", "Mua sắm"], TAGS)

    expect(colors.get("Tag đã xoá")).toBe(CHART_PALETTE[3])
    expect(colors.get("Mua sắm")).toBe(CHART_PALETTE[1])
  })

  it("never repeats a colour among the 11 default tags", () => {
    const colors = tagChartColors(
      DEFAULT_TAGS.map((t) => t.label),
      DEFAULT_TAGS
    )

    expect(new Set(colors.values()).size).toBe(DEFAULT_TAGS.length)
  })
})

describe("exceedsBudgetAmountLimit", () => {
  it("accepts amounts up to 999.999.999.999 đ, and an empty field", () => {
    expect(MAX_BUDGET_AMOUNT).toBe(999_999_999_999)
    expect(exceedsBudgetAmountLimit("")).toBe(false)
    expect(exceedsBudgetAmountLimit("999999999999")).toBe(false)
  })

  it("rejects anything larger, including a 17-digit typo that would vanish after a reload", () => {
    expect(exceedsBudgetAmountLimit("1000000000000")).toBe(true)
    expect(exceedsBudgetAmountLimit("12345678901234567")).toBe(true)
  })
})

describe("settlementsMadeInMonth", () => {
  it("keeps the settlements made in the month by local day, whatever month they settled", () => {
    const madeSep1 = settlement({ id: 1, month: "2026-08", at: new Date(2026, 8, 1, 0, 30).toISOString() })
    const madeAug31 = settlement({ id: 2, month: "2026-08", at: new Date(2026, 7, 31, 23, 30).toISOString() })
    const madeOct1 = settlement({ id: 3, month: "2026-09", at: new Date(2026, 9, 1, 0, 30).toISOString() })

    expect(settlementsMadeInMonth([madeSep1, madeAug31, madeOct1], "2026-09", ["Quỹ A"])).toEqual([
      { ...madeSep1, dayKey: "2026-09-01", fundDeleted: false },
    ])
  })

  it("leaves out a settlement whose time cannot be read", () => {
    expect(settlementsMadeInMonth([settlement({ at: "garbage" })], "2026-09", ["Quỹ A"])).toEqual([])
  })

  it("puts the newest first by real instant, then the higher id", () => {
    // Lần mới nhất mang id THẤP nhất: sắp chỉ theo id thì nó xuống cuối, nên test này bắt được.
    const sameInstantOffset = settlement({ id: 2, at: "2026-09-10T09:00:00+07:00" })
    const sameInstantUtc = settlement({ id: 3, at: "2026-09-10T02:00:00.000Z" })
    const later = settlement({ id: 1, at: new Date(2026, 8, 12, 8).toISOString() })

    const ids = settlementsMadeInMonth([sameInstantOffset, later, sameInstantUtc], "2026-09", ["Quỹ A"]).map((s) => s.id)

    expect(ids).toEqual([1, 3, 2])
  })

  it("flags a settlement whose fund is no longer among the savings funds", () => {
    const made = settlement({ fundName: "Quỹ A", at: new Date(2026, 8, 10, 9).toISOString() })

    expect(settlementsMadeInMonth([made], "2026-09", ["Quỹ B"])[0].fundDeleted).toBe(true)
    expect(settlementsMadeInMonth([made], "2026-09", ["Quỹ A"])[0].fundDeleted).toBe(false)
  })
})
