import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DEFAULT_SETTINGS } from "@/lib/settings/settings-storage"
import { MoodsCard } from "../../components/moods-card"

// "Tuyệt vời" (điểm 5) và "Vui" (điểm 4).
const MOODS = DEFAULT_SETTINGS.moods.slice(0, 2)

describe("MoodsCard — xem thêm", () => {
  // 8 tâm trạng mặc định — thu gọn thì hiện 4 cái đầu.
  const ALL_MOODS = DEFAULT_SETTINGS.moods

  it("shows the first half of a long list, all of it after Xem thêm, and the first half again after Thu gọn", () => {
    expect(ALL_MOODS).toHaveLength(8)
    const onToggle = vi.fn()
    render(<MoodsCard moods={ALL_MOODS} onToggle={onToggle} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getAllByRole("switch")).toHaveLength(4)
    expect(screen.queryByText(ALL_MOODS[4].label)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))
    expect(screen.getAllByRole("switch")).toHaveLength(8)
    fireEvent.click(screen.getByRole("switch", { name: ALL_MOODS[5].label }))
    expect(onToggle).toHaveBeenCalledWith(5)

    fireEvent.click(screen.getByRole("button", { name: "Thu gọn" }))
    expect(screen.getAllByRole("switch")).toHaveLength(4)
  })

  it("shows a short list whole, with no Xem thêm", () => {
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getAllByRole("switch")).toHaveLength(2)
    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument()
  })

  it("opens the whole list after adding a mood, so the new one at the bottom is not hidden", () => {
    render(<MoodsCard moods={ALL_MOODS} onToggle={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm tâm trạng" }))
    fireEvent.change(screen.getByLabelText("Tên", { exact: false }), { target: { value: "Hào hứng" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(screen.getAllByRole("switch")).toHaveLength(8)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()
  })
})

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

describe("MoodsCard — xoá tâm trạng", () => {
  it("asks for confirmation instead of deleting on the first tap, and points to the switch for hiding", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Tuyệt vời" }))

    expect(screen.getByText("Xoá tâm trạng?")).toBeInTheDocument()
    expect(screen.getByText("Tuyệt vời", { selector: "strong" }).closest("p")).toHaveTextContent(
      "Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc."
    )
    expect(onRemove).not.toHaveBeenCalled()
  })

  it("deletes the chosen mood by its index once confirmed", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Vui" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemove).toHaveBeenCalledWith(1)
    expect(screen.queryByText("Xoá tâm trạng?")).not.toBeInTheDocument()
  })

  it("keeps the mood when the dialog is cancelled", () => {
    const onRemove = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Vui" }))
    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onRemove).not.toHaveBeenCalled()
    expect(screen.queryByText("Xoá tâm trạng?")).not.toBeInTheDocument()
  })

  it("deletes the mood named in the dialog even if the list changed while it was open", () => {
    const onRemove = vi.fn()
    const { rerender } = render(<MoodsCard moods={MOODS} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá Vui" }))
    // Tab khác vừa xoá "Tuyệt vời" — "Vui" giờ đứng ở vị trí 0.
    rerender(<MoodsCard moods={MOODS.slice(1)} onToggle={vi.fn()} onRemove={onRemove} onAdd={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onRemove).toHaveBeenCalledWith(0)
  })
})

describe("MoodsCard — công tắc", () => {
  it("names each switch after its mood, so a screen reader can tell the switches apart", () => {
    const onToggle = vi.fn()
    render(<MoodsCard moods={MOODS} onToggle={onToggle} onRemove={vi.fn()} onAdd={vi.fn()} />)

    expect(screen.getByRole("switch", { name: "Tuyệt vời" })).toBeChecked()
    fireEvent.click(screen.getByRole("switch", { name: "Vui" }))

    expect(onToggle).toHaveBeenCalledWith(1)
  })
})
