import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { toast } from "sonner"

import { MOCK_ACCOUNT } from "@/lib/mock-account"
import { LOCKOUT_MINUTES } from "@/lib/use-attempt-lockout"
import { ResetCard } from "../../components/reset-card"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function enterPasswordAndConfirm(password: string) {
  fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))
}

describe("ResetCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it("starts collapsed with just the warning copy and a button to begin", () => {
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={vi.fn()} onExport={vi.fn()} />)

    expect(
      screen.getByText("Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.")
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" })).toBeInTheDocument()
    expect(
      screen.getByText("Cần nhập lại mật khẩu đăng nhập để xác nhận.", { exact: false })
    ).toBeInTheDocument()
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

  it("opens a password confirmation modal instead of wiping immediately", () => {
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))

    expect(onWipe).not.toHaveBeenCalled()
    expect(screen.getByText("Xác nhận xoá toàn bộ dữ liệu")).toBeInTheDocument()
  })

  it("calls onWipe, toasts success, and shows the done state after the correct password", () => {
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    enterPasswordAndConfirm(MOCK_ACCOUNT.password)

    expect(onWipe).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith("Đã xoá toàn bộ dữ liệu.")
    expect(screen.getByText("Đã xoá sạch.")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("toasts a wipe failure and stays on the confirm step when onWipe throws", () => {
    const onWipe = vi.fn(() => {
      throw new Error("quota exceeded")
    })
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    enterPasswordAndConfirm(MOCK_ACCOUNT.password)

    expect(toast.error).toHaveBeenCalledWith("Xoá dữ liệu thất bại. Vui lòng thử lại.")
    expect(screen.queryByText("Đã xoá sạch.")).not.toBeInTheDocument()
  })

  it("does not call onWipe and shows an error toast when the password is wrong", () => {
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    enterPasswordAndConfirm("sai-mat-khau")

    expect(onWipe).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Sai mật khẩu. Còn 4 lần thử.")
  })

  it("disables the whole reset feature after 5 wrong password attempts", () => {
    const onWipe = vi.fn()
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    for (let i = 0; i < 5; i++) enterPasswordAndConfirm("sai-mat-khau")

    expect(
      screen.getByText("Tính năng này đang bị khoá do nhập sai mật khẩu quá 5 lần.", { exact: false })
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Xoá toàn bộ dữ liệu" })).not.toBeInTheDocument()
  })

  it("returns to the initial step (not a reopened modal) once the lockout auto-expires", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const onWipe = vi.fn()
      render(<ResetCard counts={["3 bài nhật ký"]} onWipe={onWipe} onExport={vi.fn()} />)

      fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
      fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
      for (let i = 0; i < 5; i++) enterPasswordAndConfirm("sai-mat-khau")
      expect(screen.getByText("Tính năng này đang bị khoá", { exact: false })).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(LOCKOUT_MINUTES * 60 * 1000 + 1_000)
      })

      expect(screen.queryByText("Xác nhận xoá toàn bộ dữ liệu")).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
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
