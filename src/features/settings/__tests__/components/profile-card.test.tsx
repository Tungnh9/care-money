import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ProfileCard } from "../../components/profile-card"

describe("ProfileCard", () => {
  it("prefills the input with the current display name and disables Save until it changes", () => {
    render(<ProfileCard displayName="Tungnh2k1" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tungnh2k1")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("enables Save once the name changes and calls onSave with the trimmed value", () => {
    const onSave = vi.fn()
    render(<ProfileCard displayName="Tungnh2k1" onSave={onSave} />)

    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "  Tùng mới  " },
    })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(onSave).toHaveBeenCalledWith("Tùng mới")
  })

  it("disables Save when the field is emptied out", () => {
    render(<ProfileCard displayName="Tungnh2k1" onSave={vi.fn()} />)

    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "   " },
    })

    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("shows a brief 'Đã lưu' confirmation after saving", () => {
    render(<ProfileCard displayName="Tungnh2k1" onSave={vi.fn()} />)

    expect(screen.queryByText("Đã lưu")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "Tùng mới" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(screen.getByText("Đã lưu")).toBeInTheDocument()
  })

  it("shows the saved name once it arrives after the first render (hydration, import, pull)", () => {
    const { rerender } = render(<ProfileCard displayName="Tungnh2k1" onSave={vi.fn()} />)

    rerender(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
  })

  it("keeps what the user is typing when the saved name changes underneath", () => {
    const { rerender } = render(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "Tùng đang gõ" },
    })

    rerender(<ProfileCard displayName="Tên từ tab khác" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng đang gõ")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled()
  })

  it("follows the saved name again right after saving", () => {
    const { rerender } = render(<ProfileCard displayName="Tùng" onSave={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "  Tùng mới " },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    rerender(<ProfileCard displayName="Tùng mới" onSave={vi.fn()} />)

    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng mới")
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled()
    expect(screen.getByText("Đã lưu")).toBeInTheDocument()
  })
})
