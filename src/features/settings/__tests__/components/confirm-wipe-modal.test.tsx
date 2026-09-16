import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { toast } from "sonner"

import { MOCK_ACCOUNT } from "@/lib/mock-account"
import { ConfirmWipeModal } from "../../components/confirm-wipe-modal"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function baseProps() {
  return {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isLocked: false,
    remainingAttempts: 5,
    registerFailure: vi.fn(),
    registerSuccess: vi.fn(),
  }
}

describe("ConfirmWipeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows a password field when open", () => {
    render(<ConfirmWipeModal {...baseProps()} />)

    expect(screen.getByLabelText("Mật khẩu", { exact: false })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeInTheDocument()
  })

  it("renders nothing when closed", () => {
    const { container } = render(<ConfirmWipeModal {...baseProps()} open={false} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("calls registerSuccess, onConfirm and closes when the correct password is entered", () => {
    const props = baseProps()
    render(<ConfirmWipeModal {...props} />)

    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), {
      target: { value: MOCK_ACCOUNT.password },
    })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(props.registerSuccess).toHaveBeenCalled()
    expect(props.onConfirm).toHaveBeenCalled()
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls registerFailure and shows an error toast when the password is wrong", () => {
    const props = baseProps()
    render(<ConfirmWipeModal {...props} />)

    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), { target: { value: "sai-mat-khau" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(props.onConfirm).not.toHaveBeenCalled()
    expect(props.registerFailure).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("Sai mật khẩu. Còn 4 lần thử.")
  })

  it("shows the lockout toast when this is the last remaining attempt", () => {
    const props = baseProps()
    render(<ConfirmWipeModal {...props} remainingAttempts={1} />)

    fireEvent.change(screen.getByLabelText("Mật khẩu", { exact: false }), { target: { value: "sai" } })
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }))

    expect(toast.error).toHaveBeenCalledWith(
      "Bạn đã nhập sai quá 5 lần. Tính năng xoá dữ liệu bị khoá tạm 10 phút."
    )
  })

  it("disables the password field and confirm button when isLocked is true", () => {
    render(<ConfirmWipeModal {...baseProps()} isLocked />)

    expect(screen.getByLabelText("Mật khẩu", { exact: false })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Xác nhận" })).toBeDisabled()
  })
})
