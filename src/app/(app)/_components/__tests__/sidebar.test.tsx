import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { Sidebar } from "../sidebar"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/overview",
}))

describe("Sidebar", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("shows the avatar image next to the display name", () => {
    render(<Sidebar />)

    const images = screen.getAllByAltText("")
    expect(images.some((img) => img.getAttribute("src")?.includes("avatar-clover.svg"))).toBe(true)
  })

  it("toggles Ẩn số tiền and persists the choice", async () => {
    render(
      <MoneyVisibilityProvider>
        <Sidebar />
      </MoneyVisibilityProvider>
    )

    const [toggleButton] = await screen.findAllByRole("button", { name: "Ẩn số tiền" })
    fireEvent.click(toggleButton)

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Hiện số tiền" })).toHaveLength(2)
    )
    expect(window.localStorage.getItem("hide-money")).toBe("1")
  })
})
