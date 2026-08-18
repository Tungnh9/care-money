import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

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
})
