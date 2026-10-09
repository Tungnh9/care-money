import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { MoodsCard } from "../../components/moods-card"

// "Tuyệt vời" (điểm 5) và "Vui" (điểm 4).
const MOODS = DEFAULT_SETTINGS.moods.slice(0, 2)

describe("MoodsCard — thêm tâm trạng", () => {
  it("blocks adding a mood whose name is already taken (ignoring case) and keeps what was typed", () => {
    const onAdd = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm tâm trạng" }))
    fireEvent.change(screen.getByLabelText("Tên", { exact: false }), { target: { value: " vui" } })

    expect(screen.getByText("Đã có tâm trạng tên này — chọn tên khác")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByLabelText("Tên", { exact: false })).toHaveValue(" vui")
  })

  it("still adds a mood with a new name", () => {
    const onAdd = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={onAdd} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm tâm trạng" }))
    fireEvent.change(screen.getByLabelText("Tên", { exact: false }), { target: { value: "Hào hứng" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ label: "Hào hứng", desc: "Tâm trạng của riêng bạn", emoji: "🙂" })
  })
})
