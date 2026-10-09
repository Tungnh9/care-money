import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { Tabs } from "@/components/ob/tabs"

const TABS = ["Tiết kiệm", "Nợ thẻ tín dụng", "Tích lũy vàng", "Đầu tư"]

describe("Tabs", () => {
  it("tells assistive tech which tab is showing", () => {
    render(<Tabs tabs={TABS} active="Tích lũy vàng" onChange={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Tích lũy vàng", pressed: true })).toBeInTheDocument()
    for (const tab of ["Tiết kiệm", "Nợ thẻ tín dụng", "Đầu tư"]) {
      expect(screen.getByRole("button", { name: tab, pressed: false })).toBeInTheDocument()
    }
  })

  it("reports the tab that was clicked", () => {
    const onChange = vi.fn()
    render(<Tabs tabs={TABS} active="Tiết kiệm" onChange={onChange} />)

    fireEvent.click(screen.getByRole("button", { name: "Đầu tư" }))

    expect(onChange).toHaveBeenCalledWith("Đầu tư")
  })
})
