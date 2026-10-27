import { describe, it, expect, vi, afterEach } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { Pencil } from "lucide-react"

import { ActionTooltip } from "@/components/ob/action-tooltip"
import { TooltipProvider } from "@/components/ui/tooltip"

function hoverOpen(target: Element) {
  fireEvent.pointerEnter(target, { pointerType: "mouse" })
  fireEvent.mouseEnter(target)
  fireEvent.mouseMove(target)
  act(() => {
    vi.advanceTimersByTime(1000)
  })
}

describe("ActionTooltip", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("keeps the icon button itself as the trigger, with its own name and click handler", () => {
    const onClick = vi.fn()
    render(
      <ActionTooltip label="Sửa">
        <button type="button" aria-label="Sửa khoản chi Ăn uống" onClick={onClick} className="size-9">
          <Pencil size={17} />
        </button>
      </ActionTooltip>
    )

    const button = screen.getByRole("button", { name: "Sửa khoản chi Ăn uống" })
    expect(button).toHaveClass("size-9")
    expect(button.parentElement?.tagName).not.toBe("SPAN")
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("shows the short action label on hover", () => {
    vi.useFakeTimers()
    render(
      <TooltipProvider>
        <ActionTooltip label="Sửa">
          <button type="button" aria-label="Sửa khoản chi Ăn uống">
            <Pencil size={17} />
          </button>
        </ActionTooltip>
      </TooltipProvider>
    )

    expect(screen.queryByText("Sửa")).not.toBeInTheDocument()
    hoverOpen(screen.getByRole("button", { name: "Sửa khoản chi Ăn uống" }))
    expect(screen.getByText("Sửa")).toBeInTheDocument()
  })

  it("explains why a disabled button is locked, on hover and to screen readers", () => {
    vi.useFakeTimers()
    render(
      <TooltipProvider>
        <ActionTooltip label="Xoá" disabledReason="Không thể xoá — đã có lần tặng.">
          <button type="button" aria-label="Xoá giao dịch vàng 22/09/2026" disabled className="size-11">
            <Pencil size={17} />
          </button>
        </ActionTooltip>
      </TooltipProvider>
    )

    const button = screen.getByRole("button", { name: "Xoá giao dịch vàng 22/09/2026" })
    expect(button).toBeDisabled()
    expect(button).toHaveClass("size-11", "pointer-events-none")
    expect(button).toHaveAccessibleDescription("Không thể xoá — đã có lần tặng.")

    const wrapper = button.parentElement as HTMLElement
    expect(wrapper.tagName).toBe("SPAN")
    // flex (khối) như chính nút — không phải inline-flex, để nút không xê dịch khi đổi giữa khoá và mở.
    expect(wrapper).toHaveClass("flex")
    expect(wrapper).not.toHaveClass("inline-flex")
    hoverOpen(wrapper)
    expect(screen.getAllByText("Không thể xoá — đã có lần tặng.").length).toBe(2)
  })

  it("falls back to the label on a disabled button with no reason", () => {
    vi.useFakeTimers()
    render(
      <TooltipProvider>
        <ActionTooltip label="Chuyển sang trái">
          <button type="button" aria-label="Chuyển cột Việc cần làm sang trái" disabled>
            <Pencil size={16} />
          </button>
        </ActionTooltip>
      </TooltipProvider>
    )

    const button = screen.getByRole("button", { name: "Chuyển cột Việc cần làm sang trái" })
    expect(button).not.toHaveAttribute("aria-describedby")
    hoverOpen(button.parentElement as HTMLElement)
    expect(screen.getByText("Chuyển sang trái")).toBeInTheDocument()
  })

  it("keeps the disabled reason out of the name of a <label> that wraps the button", () => {
    // Như ô "Secret đồng bộ" ở Cài đặt: Field bọc input và nút Copy trong cùng 1 <label>.
    render(
      <label>
        Secret đồng bộ
        <input />
        <ActionTooltip label="Copy secret" disabledReason="Chưa có secret để copy.">
          <button type="button" aria-label="Copy secret" disabled>
            <Pencil size={16} />
          </button>
        </ActionTooltip>
      </label>
    )

    expect(screen.getByRole("textbox")).not.toHaveAccessibleName(/Chưa có secret/)
    expect(screen.getByRole("button", { name: "Copy secret" })).toHaveAccessibleDescription("Chưa có secret để copy.")
  })
})
