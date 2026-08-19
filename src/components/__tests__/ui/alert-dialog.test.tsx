import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { AlertDialog } from "../../ui/alert-dialog"

describe("AlertDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <AlertDialog
        open={false}
        onOpenChange={vi.fn()}
        title="Xoá quỹ tiết kiệm?"
        onConfirm={vi.fn()}
      />
    )

    expect(screen.queryByText("Xoá quỹ tiết kiệm?")).not.toBeInTheDocument()
  })

  it("renders the title, description and both buttons when open", () => {
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Xoá quỹ tiết kiệm?"
        description='Xoá "Quỹ dự phòng" sẽ không thể hoàn tác.'
        confirmLabel="Xoá"
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText("Xoá quỹ tiết kiệm?")).toBeInTheDocument()
    expect(screen.getByText('Xoá "Quỹ dự phòng" sẽ không thể hoàn tác.')).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Huỷ" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá" })).toBeInTheDocument()
  })

  it("clicking Huỷ closes without confirming", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AlertDialog open onOpenChange={onOpenChange} title="Xoá quỹ?" onConfirm={onConfirm} />
    )

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("clicking the confirm button calls onConfirm and closes the dialog", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Xoá quỹ?"
        confirmLabel="Xoá"
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("clicking the backdrop closes the dialog without confirming", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AlertDialog open onOpenChange={onOpenChange} title="Xoá quỹ?" onConfirm={onConfirm} />
    )

    fireEvent.click(screen.getByTestId("alert-dialog-backdrop"))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("pressing Escape closes the dialog without confirming", () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    render(
      <AlertDialog open onOpenChange={onOpenChange} title="Xoá quỹ?" onConfirm={onConfirm} />
    )

    fireEvent.keyDown(window, { key: "Escape" })

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("applies the destructive red styling to the confirm button when destructive is set", () => {
    render(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Xoá quỹ?"
        confirmLabel="Xoá"
        onConfirm={vi.fn()}
        destructive
      />
    )

    expect(screen.getByRole("button", { name: "Xoá" })).toHaveClass(
      "!border-[var(--ob-color-expense)]",
      "!text-[var(--ob-color-expense)]",
      "hover:!bg-[var(--ob-color-expense)]/10"
    )
  })

  it("colors the title red too when destructive is set, and leaves it default otherwise", () => {
    const { rerender } = render(
      <AlertDialog open onOpenChange={vi.fn()} title="Xoá quỹ?" onConfirm={vi.fn()} destructive />
    )
    expect(screen.getByText("Xoá quỹ?")).toHaveClass("text-[var(--ob-color-expense)]")

    rerender(<AlertDialog open onOpenChange={vi.fn()} title="Xoá quỹ?" onConfirm={vi.fn()} />)
    expect(screen.getByText("Xoá quỹ?")).not.toHaveClass("text-[var(--ob-color-expense)]")
  })

  it("renders via a portal directly under document.body, so it isn't trapped inside an ancestor's CSS transform/containing-block (e.g. the ob-rise entrance animation)", () => {
    const { container } = render(
      <AlertDialog open onOpenChange={vi.fn()} title="Xoá quỹ?" onConfirm={vi.fn()} />
    )

    // Not inside the local render tree...
    expect(container.querySelector('[data-testid="alert-dialog-backdrop"]')).toBeNull()
    // ...but portalled as a direct child of document.body, escaping any ancestor's transform.
    const backdrop = screen.getByTestId("alert-dialog-backdrop")
    expect(backdrop.parentElement?.parentElement).toBe(document.body)
  })
})
