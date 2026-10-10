import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { SalaryCard } from "../../components/salary-card"

describe("SalaryCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })
  it("shows the current month's salary pre-filled", () => {
    render(<SalaryCard month="2026-09" salary={20_000_000} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("20.000.000")
  })

  it("updates the field once the real salary loads after an initial salary=0 render (async hydration)", () => {
    // Mirrors BudgetView's real mount order: useBudget() starts at salary=0 before its
    // localStorage-hydration effect runs, then re-renders with the actual stored salary.
    const { rerender } = render(<SalaryCard month="2026-09" salary={0} onSave={vi.fn()} />)
    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("")

    rerender(<SalaryCard month="2026-09" salary={10_000_000} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("10.000.000")
  })

  it("shows a recorded 0 đ salary as 0 (not blank) and keeps save disabled until it changes", () => {
    render(<SalaryCard month="2026-09" salary={0} recorded onSave={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("0")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("lets the user save 0 đ for a month that has no salary yet", () => {
    const onSave = vi.fn()
    render(<SalaryCard month="2026-09" salary={0} recorded={false} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith("2026-09", 0)
  })

  it("disables save until the amount changes", () => {
    render(<SalaryCard month="2026-09" salary={20_000_000} onSave={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), {
      target: { value: "22000000" },
    })

    expect(screen.getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("calls onSave with the month and the numeric amount", () => {
    const onSave = vi.fn()
    render(<SalaryCard month="2026-09" salary={0} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), {
      target: { value: "20000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith("2026-09", 20_000_000)
  })

  it("masks the pre-filled salary while money is hidden, and shows it only while the field is focused", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <SalaryCard month="2026-09" salary={20_000_000} onSave={vi.fn()} />
      </MoneyVisibilityProvider>
    )
    const input = screen.getByLabelText("Số tiền", { exact: false })

    await waitFor(() => expect(input).toHaveValue(""))
    expect(input).toHaveAttribute("placeholder", "••••••••")

    act(() => input.focus())
    expect(input).toHaveValue("20.000.000")
  })

  it("blocks saving a salary above 999.999.999.999 đ", () => {
    render(<SalaryCard month="2026-09" salary={0} onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Số tiền", { exact: false }), { target: { value: "1000000000000" } })

    expect(screen.getByText("Tối đa 999.999.999.999 đ")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })
})
