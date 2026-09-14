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

  it("shows a Chi tiêu nav link pointing at /budget", () => {
    render(<Sidebar />)

    const links = screen.getAllByRole("link", { name: "Chi tiêu" })
    expect(links.length).toBeGreaterThan(0)
    links.forEach((link) => expect(link).toHaveAttribute("href", "/budget"))
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

  it("opens the calculator modal when Máy tính is clicked", async () => {
    render(<Sidebar />)

    const [calcButton] = screen.getAllByLabelText("Máy tính")
    fireEvent.click(calcButton)

    await waitFor(() => expect(screen.getByTestId("calculator-result")).toHaveTextContent("0"))
  })

  it("hides Máy tính and Ẩn số tiền when the Tài chính module is off", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({ modules: [{ key: "taichinh", label: "Tài chính", hint: "", on: false }] })
    )

    render(<Sidebar />)

    expect(screen.queryAllByLabelText("Máy tính")).toHaveLength(0)
    expect(screen.queryAllByLabelText("Ẩn số tiền")).toHaveLength(0)
  })

  it("still shows Máy tính and Ẩn số tiền when the Tài chính module is on", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({ modules: [{ key: "taichinh", label: "Tài chính", hint: "", on: true }] })
    )

    render(<Sidebar />)

    expect(screen.getAllByLabelText("Máy tính").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Ẩn số tiền").length).toBeGreaterThan(0)
  })
})
