import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { LoginForm } from "../../components/login-form"
import { EMPTY_CREDENTIALS_MESSAGE } from "../../schemas"
import { MAX_ATTEMPTS, LOCKOUT_MINUTES } from "../../hooks/use-login-lockout"
import { MOCK_ACCOUNT } from "../../mock-data"

const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}))

async function submitCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } })
  fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: password } })
  fireEvent.click(screen.getByRole("button", { name: /đăng nhập|đang vào/i }))
  await vi.advanceTimersByTimeAsync(900)
  await vi.advanceTimersByTimeAsync(0)
}

describe("LoginForm", () => {
  beforeEach(() => {
    window.localStorage.clear()
    push.mockClear()
  })

  it("shows the shared error message when submitting an empty form", async () => {
    render(<LoginForm />)

    fireEvent.click(screen.getByRole("button", { name: /đăng nhập/i }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      EMPTY_CREDENTIALS_MESSAGE
    )
  })

  it("shows a failure message with remaining attempts on wrong credentials", async () => {
    vi.useFakeTimers()
    render(<LoginForm />)

    await submitCredentials("a@b.com", "wrong-password")
    vi.useRealTimers()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `Đăng nhập không thành công. Còn ${MAX_ATTEMPTS - 1} lần thử.`
    )
    expect(push).not.toHaveBeenCalled()
  })

  it("redirects to / on correct credentials", async () => {
    vi.useFakeTimers()
    render(<LoginForm />)

    await submitCredentials(MOCK_ACCOUNT.email, MOCK_ACCOUNT.password)
    vi.useRealTimers()

    expect(push).toHaveBeenCalledWith("/")
  })

  it("locks the submit button after too many failed attempts", async () => {
    vi.useFakeTimers()
    render(<LoginForm />)

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      await submitCredentials("a@b.com", "wrong-password")
    }
    vi.useRealTimers()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      `Bạn đã nhập sai quá ${MAX_ATTEMPTS} lần. Vui lòng thử lại sau ${LOCKOUT_MINUTES} phút.`
    )
    expect(screen.getByRole("button", { name: /đăng nhập/i })).toBeDisabled()
  })
})
