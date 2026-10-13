import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { Textarea } from "@/components/ui/textarea"

describe("Textarea", () => {
  it("is named by its label and reports typed text", () => {
    const onChange = vi.fn()
    render(<Textarea label="Hôm nay" value="" onChange={onChange} />)

    const box = screen.getByRole("textbox", { name: "Hôm nay" })
    fireEvent.change(box, { target: { value: "- Duyệt bài" } })

    expect(box.tagName).toBe("TEXTAREA")
    expect(onChange).toHaveBeenCalled()
  })

  it("keeps the hint out of the box's name and reads it as the box's description", () => {
    render(<Textarea label="Vướng mắc" hint="Để trống nếu không có" value="" onChange={vi.fn()} />)

    const box = screen.getByRole("textbox", { name: "Vướng mắc" })
    expect(box).toHaveAccessibleDescription("Để trống nếu không có")
  })
})
