import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { Button } from "../../ui/button"

describe("Button", () => {
  it("gives the ghost variant a hover background, since it has none by default (bg-transparent)", () => {
    render(<Button variant="ghost">Huỷ</Button>)

    expect(screen.getByRole("button", { name: "Huỷ" })).toHaveClass(
      "hover:bg-[var(--ob-color-surface-sunken)]"
    )
  })

  it("gives the sm size wider left/right padding, so short labels like Lưu/Huỷ/Xoá/Thêm are easier to hit with the mouse", () => {
    render(<Button size="sm">Lưu</Button>)

    expect(screen.getByRole("button", { name: "Lưu" })).toHaveClass("px-[18px]")
  })
})
