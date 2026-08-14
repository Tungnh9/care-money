import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { ResetCard } from "../../components/reset-card"

describe("ResetCard", () => {
  it("starts collapsed with just the warning copy and a button to begin", () => {
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={vi.fn()} onExport={vi.fn()} />)

    expect(
      screen.getByText("Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" })).toBeInTheDocument()
  })

  it("shows what will be deleted after clicking the first button, and cancel returns to the start", () => {
    render(<ResetCard counts={["3 bài nhật ký", "chuỗi 5 ngày"]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.getByText("3 bài nhật ký, chuỗi 5 ngày")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá vĩnh viễn" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))

    expect(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" })).toBeInTheDocument()
  })

  it("shows a message with no data to delete when counts is empty", () => {
    render(<ResetCard counts={[]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.getByText("Không còn gì để xoá.")).toBeInTheDocument()
  })

  it("calls onWipe and shows the done state when confirming the delete", () => {
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))

    expect(onWipe).toHaveBeenCalled()
    expect(screen.getByText("Đã xoá sạch.")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("exports a backup and returns to the start when choosing to export first", () => {
    const onExport = vi.fn()
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={onExport} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xuất bản sao trước" }))

    expect(onExport).toHaveBeenCalled()
    expect(onWipe).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" })).toBeInTheDocument()
  })
})
