import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

import { AuthGuard } from "../auth-guard"
import { setStoredUser } from "@/lib/auth"

const replace = vi.fn()
let pathname = "/"

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}))

describe("AuthGuard", () => {
  beforeEach(() => {
    window.localStorage.clear()
    replace.mockClear()
    pathname = "/"
  })

  it("redirects to /login when there is no stored user", async () => {
    render(
      <AuthGuard>
        <div>protected</div>
      </AuthGuard>
    )

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"))
    expect(screen.queryByText("protected")).not.toBeInTheDocument()
  })

  it("renders children when a user is stored", async () => {
    setStoredUser({ email: "a@b.com" })

    render(
      <AuthGuard>
        <div>protected</div>
      </AuthGuard>
    )

    expect(await screen.findByText("protected")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })

  it("never redirects while already on /login", async () => {
    pathname = "/login"

    render(
      <AuthGuard>
        <div>login page</div>
      </AuthGuard>
    )

    expect(await screen.findByText("login page")).toBeInTheDocument()
    expect(replace).not.toHaveBeenCalled()
  })
})
