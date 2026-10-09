import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
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
      screen.getByText(
        "Xoá sạch tài chính, chi tiêu (cả lương và tất toán), nhật ký, học tập, lịch sử tài sản, quỹ gắn mục tiêu mua xe và secret đồng bộ trên máy này — chỉ giữ lại cài đặt và danh sách cửa hàng vàng. Không khôi phục được."
      )
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

  it("never claims there is nothing to delete, and still suggests a backup, when counts is empty", () => {
    render(<ResetCard counts={[]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.queryByText("Không còn gì để xoá.")).not.toBeInTheDocument()
    expect(
      screen.getByText(
        "Chưa thấy dữ liệu nào ở các mục chính — phần còn lại trên máy (kể cả secret đồng bộ) vẫn sẽ bị xoá. Không khôi phục được — nên xuất một bản sao trước."
      )
    ).toBeInTheDocument()
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
    expect(
      screen.getByText(
        "Tài chính, chi tiêu, nhật ký, học tập và lịch sử tài sản đều về 0 — chỉ còn cài đặt và danh sách cửa hàng vàng. Bắt đầu lại từ Tổng quan.",
        { exact: false }
      )
    ).toBeInTheDocument()
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

  it("asks for the password again after the confirm dialog was cancelled", () => {
    render(<ResetCard counts={["3 bài nhật ký"]} onWipe={vi.fn()} onExport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))
    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))
    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), {
      target: { value: MOCK_ACCOUNT.password },
    })
    // Bấm "Huỷ" của hộp mật khẩu (thẻ phía sau cũng có 1 nút "Huỷ" riêng).
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Huỷ" }))

    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))

    expect(screen.getByLabelText("Mật khẩu", { exact: false })).toHaveValue("")
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })
})
