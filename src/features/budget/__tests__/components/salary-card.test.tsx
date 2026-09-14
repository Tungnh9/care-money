import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { SalaryCard } from "../../components/salary-card"

describe("SalaryCard", () => {
  it("shows the current month's salary pre-filled", () => {
    render(<SalaryCard month="2026-09" salary={20_000_000} onSave={vi.fn()} />)

    expect(screen.getByLabelText("Lương tháng này", { exact: false })).toHaveValue("20.000.000")
  })

  it("disables save until the amount changes", () => {
    render(<SalaryCard month="2026-09" salary={20_000_000} onSave={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Lương tháng này", { exact: false }), {
      target: { value: "22000000" },
    })

    expect(screen.getByRole("button", { name: "Lưu" })).not.toBeDisabled()
  })

  it("calls onSave with the month and the numeric amount", () => {
    const onSave = vi.fn()
    render(<SalaryCard month="2026-09" salary={0} onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Lương tháng này", { exact: false }), {
      target: { value: "20000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith("2026-09", 20_000_000)
  })
})
