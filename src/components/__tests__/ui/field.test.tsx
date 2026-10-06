import { describe, it, expect, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { Field } from "@/components/ui/field"

describe("Field", () => {
  it("shows a grouped value as usual when not masked", () => {
    render(<Field label="Số tiền" numeric group value="20000000" onChange={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveValue("20.000.000")
  })

  it("hides a filled value behind dots while masked and not focused", () => {
    render(<Field label="Số tiền" numeric group masked value="20000000" placeholder="0" onChange={vi.fn()} />)

    const input = screen.getByLabelText("Số tiền", { exact: false })
    expect(input).toHaveValue("")
    expect(input).toHaveAttribute("placeholder", "••••••••")
  })

  it("shows the real value while the field is focused, and hides it again on blur", () => {
    const onChange = vi.fn()
    render(<Field label="Số tiền" numeric group masked value="20000000" onChange={onChange} />)
    const input = screen.getByLabelText("Số tiền", { exact: false })

    act(() => input.focus())
    expect(input).toHaveValue("20.000.000")

    act(() => input.blur())
    expect(input).toHaveValue("")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("keeps the caller's placeholder for an empty masked field", () => {
    render(<Field label="Số tiền" numeric group masked value="" placeholder="0" onChange={vi.fn()} />)

    expect(screen.getByLabelText("Số tiền", { exact: false })).toHaveAttribute("placeholder", "0")
  })

  it("still calls the caller's own onFocus and onBlur", () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    render(<Field label="Ghi chú" masked value="abc" onFocus={onFocus} onBlur={onBlur} onChange={vi.fn()} />)
    const input = screen.getByLabelText("Ghi chú", { exact: false })

    act(() => input.focus())
    act(() => input.blur())

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
