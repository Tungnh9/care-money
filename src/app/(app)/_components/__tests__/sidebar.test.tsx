import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { Sidebar } from "../sidebar"
import { setStoredJournal } from "@/features/journal/journal-storage"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/overview",
}))

describe("Sidebar", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("shows a streak of 0 when there is no journal data yet", async () => {
    render(<Sidebar />)

    await waitFor(() => expect(screen.getByText("Chuỗi 0 ngày")).toBeInTheDocument())
  })

  it("shows the real streak from the journal feature, not a hard-coded value", async () => {
    setStoredJournal({ entries: [], streak: 7, lastEntryDay: "2026-08-01" })
    render(<Sidebar />)

    await waitFor(() => expect(screen.getByText("Chuỗi 7 ngày")).toBeInTheDocument())
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
