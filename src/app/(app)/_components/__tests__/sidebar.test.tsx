import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { setStoredUser } from "@/lib/auth"
import { setSyncSecret } from "@/lib/sync-secret-storage"
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

  it("forgets the sync secret saved on this device when logging out", () => {
    setStoredUser({ email: "owner@example.com" })
    setSyncSecret("real-secret")
    render(<Sidebar />)

    fireEvent.click(screen.getAllByRole("button", { name: "Đăng xuất" })[0])

    expect(window.localStorage.getItem("auth-user")).toBeNull()
    expect(window.localStorage.getItem("sync-secret")).toBeNull()
  })

  it("lets the 7 bottom-nav links shrink to share a phone-width bar instead of pushing Cài đặt off screen", () => {
    render(<Sidebar />)

    // Thanh dưới là position: fixed nên phần tràn không cuộn tới được: nav phải co về đúng bề rộng
    // màn hình (min-w-0) và không chừa khe giữa các mục ở mobile.
    const nav = screen.getByRole("navigation")
    expect(nav).toHaveClass("min-w-0", "flex-1", "md:gap-1")
    expect(nav).not.toHaveClass("gap-1")

    const links = within(nav).getAllByRole("link")
    expect(links.map((link) => link.textContent)).toEqual([
      "Tổng quan",
      "Tài chính",
      "Chi tiêu",
      "Nhật ký",
      "Học tập",
      "Mục tiêu",
      "Cài đặt",
    ])
    for (const link of links) {
      // Mục rộng theo nhãn nhưng co được; từ md trở lên không co giãn như cũ.
      expect(link).toHaveClass("min-w-0", "flex-auto", "px-0.5", "md:flex-none")
      expect(link).not.toHaveClass("px-2")
      // Thiếu chỗ (máy < ~340px) thì nhãn cắt "…" trong mục của nó thay vì đẩy mục khác ra ngoài.
      expect(link.querySelector("span")).toHaveClass("max-w-full", "truncate")
    }
  })

  it("gives the 3 mobile top-bar buttons a 44px touch target without making the bar taller", () => {
    render(<Sidebar />)

    for (const name of ["Máy tính", "Ẩn số tiền", "Đăng xuất"]) {
      // Nút đầu tiên trong DOM nằm ở thanh trên điện thoại; nút sau là dòng ở chân sidebar desktop.
      const [topBarButton, sidebarRow] = screen.getAllByRole("button", { name })
      // 44px (--ob-hit-min) thay vì đúng 18px của icon; margin âm dọc giữ thanh cao như cũ.
      expect(topBarButton).toHaveClass("size-[var(--ob-hit-min)]", "-my-[9px]")
      expect(sidebarRow).not.toHaveClass("size-[var(--ob-hit-min)]")
    }
    // 3 nút rộng hơn thì chữ thương hiệu nhường chỗ (cắt "…" ở máy rất hẹp) thay vì đẩy nút ra ngoài.
    const brand = screen.getAllByText("Orange")[0].parentElement as HTMLElement
    expect(brand).toHaveClass("min-w-0", "flex-1", "truncate")
  })
})
