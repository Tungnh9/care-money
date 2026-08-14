import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { DEFAULT_SETTINGS, setStoredSettings } from "@/lib/settings-storage"
import { DEFAULT_FINANCE_STATE, setStoredFinance } from "@/features/finance/finance-storage"
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
    expect(screen.queryByText("Bốn mục tiêu đang chạy")).not.toBeInTheDocument()
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
})
