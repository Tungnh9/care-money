import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { QuickAdd } from "../../components/quick-add"
import { TODAY } from "./tile-fixtures"

describe("QuickAdd", () => {
  it("adds a task with no due date and normal priority by default, then clears the box", () => {
    const onAdd = vi.fn(() => true)
    render(<QuickAdd today={TODAY} onAdd={onAdd} />)

    const input = screen.getByLabelText("Tên việc mới")
    fireEvent.change(input, { target: { value: "Gọi khách" } })
    fireEvent.submit(input)

    expect(onAdd).toHaveBeenCalledWith("Gọi khách", { dueDate: null, priority: "normal" })
    expect(input).toHaveValue("")
  })

  it("sets today or tomorrow (one at a time) and high priority, and resets them after adding", () => {
    const onAdd = vi.fn(() => true)
    render(<QuickAdd today={TODAY} onAdd={onAdd} />)

    const todayChip = screen.getByRole("button", { name: "Hôm nay" })
    const tomorrowChip = screen.getByRole("button", { name: "Ngày mai" })
    fireEvent.click(todayChip)
    fireEvent.click(tomorrowChip)
    expect(todayChip).toHaveAttribute("aria-pressed", "false")
    expect(tomorrowChip).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(screen.getByRole("button", { name: "Cao" }))

    fireEvent.change(screen.getByLabelText("Tên việc mới"), { target: { value: "Gửi hợp đồng" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))

    expect(onAdd).toHaveBeenCalledWith("Gửi hợp đồng", { dueDate: "2026-10-14", priority: "high" })
    expect(tomorrowChip).toHaveAttribute("aria-pressed", "false")
    expect(screen.getByRole("button", { name: "Cao" })).toHaveAttribute("aria-pressed", "false")
  })

  it("keeps the text when adding fails, and cannot add a blank title", () => {
    const onAdd = vi.fn(() => false)
    render(<QuickAdd today={TODAY} onAdd={onAdd} />)

    expect(screen.getByRole("button", { name: "Thêm việc" })).toBeDisabled()
    fireEvent.change(screen.getByLabelText("Tên việc mới"), { target: { value: "Việc" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm việc" }))
    expect(screen.getByLabelText("Tên việc mới")).toHaveValue("Việc")
  })
})
