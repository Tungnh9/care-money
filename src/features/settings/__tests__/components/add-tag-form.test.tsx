import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { AddTagForm } from "../../components/add-tag-form"

describe("AddTagForm", () => {
  it("shows only the trigger button when collapsed", () => {
    render(<AddTagForm onAdd={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Thêm nhãn" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Tên")).not.toBeInTheDocument()
  })

  it("expands into a form when the trigger is clicked", () => {
    render(<AddTagForm onAdd={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Thêm nhãn" }))

    expect(screen.getByLabelText("Tên")).toBeInTheDocument()
    expect(screen.getByLabelText("Mô tả ngắn")).toBeInTheDocument()
  })

  it("disables submit until a label is entered", () => {
    render(<AddTagForm onAdd={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Thêm nhãn" }))

    expect(screen.getByRole("button", { name: "Thêm" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "Giải trí" } })

    expect(screen.getByRole("button", { name: "Thêm" })).not.toBeDisabled()
  })

  it("submits the chosen emoji, label and description, then collapses again", () => {
    const onAdd = vi.fn()
    render(<AddTagForm onAdd={onAdd} />)
    fireEvent.click(screen.getByRole("button", { name: "Thêm nhãn" }))

    fireEvent.click(screen.getByText("🎬"))
    fireEvent.change(screen.getByLabelText("Tên"), { target: { value: "Giải trí" } })
    fireEvent.change(screen.getByLabelText("Mô tả ngắn"), { target: { value: "Xem phim, chơi game" } })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(onAdd).toHaveBeenCalledWith({ label: "Giải trí", desc: "Xem phim, chơi game", emoji: "🎬" })
    expect(screen.queryByLabelText("Tên")).not.toBeInTheDocument()
  })
})
