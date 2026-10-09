import { describe, it, expect, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"

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

describe("Field — dán số tiền", () => {
  it("drops the decimal part of a pasted Vietnamese amount instead of gluing it onto the number", () => {
    const onChange = vi.fn()
    render(<Field label="Số tiền" numeric group value="" onChange={onChange} />)

    fireEvent.paste(screen.getByLabelText("Số tiền", { exact: false }), {
      clipboardData: { getData: () => "1.500.000,00" },
    })

    expect(onChange).toHaveBeenLastCalledWith({ target: { value: "1500000" } })
  })

  it("replaces the selected amount with the pasted one", () => {
    const onChange = vi.fn()
    render(<Field label="Số tiền" numeric group value="20000000" onChange={onChange} />)
    const input = screen.getByLabelText("Số tiền", { exact: false }) as HTMLInputElement
    input.setSelectionRange(0, input.value.length)

    fireEvent.paste(input, { clipboardData: { getData: () => "1,500,000.00" } })

    expect(onChange).toHaveBeenLastCalledWith({ target: { value: "1500000" } })
  })

  it("leaves pasting into a plain text field to the browser", () => {
    const onChange = vi.fn()
    render(<Field label="Ghi chú" value="" onChange={onChange} />)

    const notCancelled = fireEvent.paste(screen.getByLabelText("Ghi chú", { exact: false }), {
      clipboardData: { getData: () => "1.500.000,00" },
    })

    expect(notCancelled).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })
})
