import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { DEFAULT_SETTINGS, setStoredSettings } from "@/lib/settings-storage"
import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
import { setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { DEFAULT_BUDGET_STATE, setStoredBudget } from "@/features/budget/budget-storage"
import { formatMoney } from "@/lib/format"
import type { GrammarEntry, VocabEntry } from "@/features/study/types"
import { OverviewView } from "../../components/overview-view"

const VOCAB: VocabEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `v-${i}`,
  word: `word-${i}`,
  meaning: `nghĩa ${i}`,
  addedAt: "2026-08-14",
}))

const GRAMMAR: GrammarEntry[] = Array.from({ length: 5 }, (_, i) => ({
  id: `g-${i}`,
  title: `Cấu trúc ${i}`,
  explanation: `Giải thích ${i}`,
  addedAt: "2026-08-14",
}))

describe("OverviewView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 7, 14, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("hides a section when its module is turned off in Cài đặt", async () => {
    setStoredSettings({
      ...DEFAULT_SETTINGS,
      modules: DEFAULT_SETTINGS.modules.map((m) => (m.key === "muctieu" ? { ...m, on: false } : m)),
    })

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText("Tài chính")).toBeInTheDocument())
    expect(screen.queryByText("Mục tiêu")).not.toBeInTheDocument()
    expect(screen.queryByText("3 mục tiêu đang chạy")).not.toBeInTheDocument()
  })

  it("shows the current month's budget summary computed from real data via useBudget()", async () => {
    setStoredBudget({
      ...DEFAULT_BUDGET_STATE,
      salaries: [{ month: "2026-08", amount: 20_000_000 }],
      expenses: [{ id: 1, dayKey: "2026-08-05", amount: 5_000_000, tag: null }],
    })

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText("Ngân sách tháng này")).toBeInTheDocument())
    expect(screen.getByText(formatMoney(20_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(5_000_000))).toBeInTheDocument()
    expect(screen.getByText(formatMoney(15_000_000))).toBeInTheDocument()
  })

  it("hides the budget section when the chitieu module is turned off", async () => {
    setStoredSettings({
      ...DEFAULT_SETTINGS,
      modules: DEFAULT_SETTINGS.modules.map((m) => (m.key === "chitieu" ? { ...m, on: false } : m)),
    })

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText("Tài chính")).toBeInTheDocument())
    expect(screen.queryByText("Ngân sách tháng này")).not.toBeInTheDocument()
  })

  it("ticks the real task through useStudy(), not a mock", async () => {
    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    const checkbox = await screen.findByRole("checkbox", { name: /Ôn 20 từ vựng/ })
    expect(checkbox).not.toBeChecked()

    fireEvent.click(screen.getByText("Ôn 20 từ vựng"))

    await waitFor(() => expect(checkbox).toBeChecked())
  })

  it("reflects a real savings fund consistently in both the Tài chính and Mục tiêu sections", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [{ name: "Quỹ dự phòng", amount: 5_000_000, target: 20_000_000 }],
    })

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText("1 quỹ")).toBeInTheDocument())
    expect(screen.getAllByText("Quỹ dự phòng")).toHaveLength(1)
    expect(screen.getByText(`${formatMoney(5_000_000)} / ${formatMoney(20_000_000)}`)).toBeInTheDocument()
    expect(screen.getAllByText(formatMoney(5_000_000)).length).toBeGreaterThan(0)
  })

  it("shows the real car-goal progress in the Mục tiêu section once a savings fund is linked, matching /goals", async () => {
    setStoredFinance({
      ...DEFAULT_FINANCE_STATE,
      savings: [
        { name: "Quỹ mua xe", amount: 30_000_000, target: 100_000_000 },
        { name: "Quỹ khác", amount: 10_000_000, target: 50_000_000 },
      ],
    })
    setCarGoalFundName("Quỹ mua xe")

    render(<OverviewView vocab={VOCAB} grammar={GRAMMAR} />)

    await waitFor(() => expect(screen.getByText("Mua xe ô tô")).toBeInTheDocument())
    // savingsTotal (40tr/100tr = 40%) khác car-goal (30tr/100tr = 30%) — tránh trùng số ngẫu nhiên.
    const carRow = screen.getByText("Mua xe ô tô").closest("div")
    expect(carRow).not.toBeNull()
    expect(within(carRow as HTMLElement).getByText("30%")).toBeInTheDocument()
  })
})
