import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { TaskItem } from "@/components/ob/task-item"

describe("TaskItem", () => {
  it("toggles through a real checkbox named after the task", () => {
    const onToggle = vi.fn()
    render(<TaskItem label="Đọc 10 trang" done={false} onToggle={onToggle} />)

    const checkbox = screen.getByRole("checkbox", { name: "Đọc 10 trang" })
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("draws the keyboard focus ring on the visible box, since the real checkbox is visually hidden", () => {
    render(<TaskItem label="Đọc 10 trang" done={false} onToggle={vi.fn()} />)

    const checkbox = screen.getByRole("checkbox", { name: "Đọc 10 trang" })
    // Ẩn kiểu sr-only, không phải 0×0 + opacity 0 (opacity giấu luôn vòng focus vẽ trên chính checkbox).
    expect(checkbox).toHaveClass("peer", "sr-only")
    expect(checkbox).not.toHaveClass("opacity-0")
    expect(checkbox).not.toHaveClass("size-0")
    // Ô vuông ngay sau checkbox vẽ vòng focus thay, cùng kiểu với vòng focus chung của app.
    expect(checkbox.nextElementSibling).toHaveClass(
      "peer-focus-visible:outline-2",
      "peer-focus-visible:outline-offset-2",
      "peer-focus-visible:outline-[color:var(--ob-color-focus)]"
    )
    // Input sr-only là position: absolute — label phải là mốc định vị của nó.
    expect(checkbox.closest("label")).toHaveClass("relative")
  })

  it("names a done task's checkbox after the label only, without the tick mark", () => {
    render(<TaskItem label="Đọc 10 trang" done onToggle={vi.fn()} />)

    expect(screen.getByRole("checkbox", { name: "Đọc 10 trang" })).toBeChecked()
  })
})
