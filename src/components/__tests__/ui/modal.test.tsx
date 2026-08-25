import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { Modal } from "../../ui/modal"

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal open={false} onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(screen.queryByText("Xin chào")).not.toBeInTheDocument()
  })

  it("renders children with dialog role when open, defaulting role to dialog", () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(screen.getByRole("dialog", { name: "Test modal" })).toBeInTheDocument()
    expect(screen.getByText("Xin chào")).toBeInTheDocument()
  })

  it("uses the alertdialog role when role='alertdialog' is passed", () => {
    render(
      <Modal open onOpenChange={vi.fn()} role="alertdialog" ariaLabel="Xoá?">
        <p>Nội dung</p>
      </Modal>
    )

    expect(screen.getByRole("alertdialog", { name: "Xoá?" })).toBeInTheDocument()
  })

  it("renders via a portal directly under document.body", () => {
    const { container } = render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(container.querySelector('[data-testid="modal-backdrop"]')).toBeNull()
    const backdrop = screen.getByTestId("modal-backdrop")
    expect(backdrop.parentElement?.parentElement).toBe(document.body)
  })

  it("uses a custom backdrop testid when backdropTestId is passed", () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal" backdropTestId="my-backdrop">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(screen.getByTestId("my-backdrop")).toBeInTheDocument()
    expect(screen.queryByTestId("modal-backdrop")).not.toBeInTheDocument()
  })

  it("clicking the backdrop calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    fireEvent.click(screen.getByTestId("modal-backdrop"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("pressing Escape calls onOpenChange(false)", () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    fireEvent.keyDown(window, { key: "Escape" })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("locks body scroll while open and restores the previous overflow value on close", () => {
    document.body.style.overflow = "auto"

    const { rerender } = render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(document.body.style.overflow).toBe("hidden")

    rerender(
      <Modal open={false} onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Xin chào</button>
      </Modal>
    )

    expect(document.body.style.overflow).toBe("auto")
  })

  it("auto-focuses the first focusable element inside when nothing else already has focus", async () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Đầu tiên</button>
        <button type="button">Thứ hai</button>
      </Modal>
    )

    await vi.waitFor(() => expect(screen.getByText("Đầu tiên")).toHaveFocus())
  })

  it("does not steal focus from a child that already focused itself on mount (e.g. autoFocus)", async () => {
    render(
      <Modal open onOpenChange={vi.fn()} ariaLabel="Test modal">
        <button type="button">Đầu tiên</button>
        <input autoFocus placeholder="Số tiền" />
      </Modal>
    )

    await vi.waitFor(() => expect(screen.getByPlaceholderText("Số tiền")).toHaveFocus())
  })

  it("restores focus to the previously-focused element after closing", async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Mở
          </button>
          <Modal open={open} onOpenChange={setOpen} ariaLabel="Test modal">
            <button type="button" onClick={() => setOpen(false)}>
              Đóng
            </button>
          </Modal>
        </div>
      )
    }

    render(<Harness />)

    const openButton = screen.getByRole("button", { name: "Mở" })
    openButton.focus()
    fireEvent.click(openButton)

    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Đóng" })).toHaveFocus())

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }))

    await vi.waitFor(() => expect(openButton).toHaveFocus())
  })

  it("restores focus to the trigger element even when a child steals focus via autoFocus on open", async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Mở
          </button>
          <Modal open={open} onOpenChange={setOpen} ariaLabel="Test modal">
            <input autoFocus placeholder="Số tiền" />
            <button type="button" onClick={() => setOpen(false)}>
              Đóng
            </button>
          </Modal>
        </div>
      )
    }

    render(<Harness />)

    const openButton = screen.getByRole("button", { name: "Mở" })
    openButton.focus()
    fireEvent.click(openButton)

    // The autoFocus input should win, not Modal's own fallback focus.
    await vi.waitFor(() => expect(screen.getByPlaceholderText("Số tiền")).toHaveFocus())

    fireEvent.click(screen.getByRole("button", { name: "Đóng" }))

    // Focus must return to the button that originally opened the modal — not to whatever
    // the autoFocus child grabbed after the modal had already opened.
    await vi.waitFor(() => expect(openButton).toHaveFocus())
  })

  it("traps Tab: pressing Tab on the last focusable element cycles to the first", () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} ariaLabel="Test modal">
        <button type="button">Đầu tiên</button>
        <button type="button">Cuối cùng</button>
      </Modal>
    )

    const last = screen.getByRole("button", { name: "Cuối cùng" })
    last.focus()
    fireEvent.keyDown(window, { key: "Tab" })

    expect(screen.getByRole("button", { name: "Đầu tiên" })).toHaveFocus()
  })

  it("traps Shift+Tab: pressing Shift+Tab on the first focusable element cycles to the last", () => {
    const onOpenChange = vi.fn()
    render(
      <Modal open onOpenChange={onOpenChange} ariaLabel="Test modal">
        <button type="button">Đầu tiên</button>
        <button type="button">Cuối cùng</button>
      </Modal>
    )

    const first = screen.getByRole("button", { name: "Đầu tiên" })
    first.focus()
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true })

    expect(screen.getByRole("button", { name: "Cuối cùng" })).toHaveFocus()
  })
})
