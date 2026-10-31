import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { setStoredUser } from "@/lib/auth"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import { Sidebar } from "../sidebar"

const navigation = vi.hoisted(() => ({ pathname: "/overview" }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navigation.pathname,
}))

describe("Sidebar", () => {
  beforeEach(() => {
    window.localStorage.clear()
    navigation.pathname = "/overview"
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

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Hiện số tiền" })).toHaveLength(2))
    expect(window.localStorage.getItem("hide-money")).toBe("1")
  })

  it("opens the calculator modal when Máy tính is clicked", async () => {
    render(<Sidebar />)

    const [calcButton] = screen.getAllByLabelText("Máy tính")
    fireEvent.click(calcButton)

    await waitFor(() => expect(screen.getByTestId("calculator-result")).toHaveTextContent("0"))
  })

  it("keeps Máy tính and Ẩn số tiền when Tài chính is off but Chi tiêu still shows money", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({
        modules: [
          { key: "taichinh", label: "Tài chính", hint: "", on: false },
          { key: "muctieu", label: "Mục tiêu", hint: "", on: false },
        ],
      })
    )

    render(<Sidebar />)

    expect(screen.getAllByLabelText("Máy tính").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Ẩn số tiền").length).toBeGreaterThan(0)
  })

  it("hides Máy tính and Ẩn số tiền only when Tài chính, Chi tiêu and Mục tiêu are all off", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({
        modules: [
          { key: "taichinh", label: "Tài chính", hint: "", on: false },
          { key: "chitieu", label: "Chi tiêu", hint: "", on: false },
          { key: "muctieu", label: "Mục tiêu", hint: "", on: false },
        ],
      })
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

  it("lets the 9 bottom-nav links shrink to share a phone-width bar instead of pushing Cài đặt off screen", () => {
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
      "Plan",
      "Làm việc",
      "Cài đặt",
    ])
    for (const link of links) {
      // 9 mục chia đều bề rộng thanh (flex 1 1 0) — mục đang chọn có chữ cũng không phình ra làm các
      // icon khác xô lệch khi chuyển trang; từ md trở lên không co giãn như cũ.
      expect(link).toHaveClass("min-w-0", "flex-1", "basis-0", "px-0.5", "md:flex-none")
      expect(link).not.toHaveClass("flex-auto")
    }
  })

  it("shows only icons in the phone bar, with the label under the current page's icon alone", () => {
    render(<Sidebar />)

    const nav = screen.getByRole("navigation")
    // usePathname được mock là "/overview" → chỉ "Tổng quan" hiện chữ ở điện thoại.
    const active = within(nav).getByRole("link", { name: "Tổng quan" })
    const activeLabel = active.querySelector("span") as HTMLElement
    expect(activeLabel).not.toHaveClass("hidden")
    // Ô ~45px hẹp hơn "Tổng quan": nhãn tràn nhẹ ra 2 bên (ô bên cạnh chỉ có icon nên còn chỗ) thay vì
    // cắt "Tổng …". Ô vẫn min-w-0 basis-0 nên chữ tràn không làm ô phình; ở md vẫn ẩn, lg hiện như cũ.
    expect(activeLabel).toHaveClass("whitespace-nowrap", "md:hidden", "lg:inline")
    expect(activeLabel).not.toHaveClass("truncate")

    for (const name of ["Tài chính", "Chi tiêu", "Nhật ký", "Học tập", "Mục tiêu", "Plan", "Làm việc", "Cài đặt"]) {
      const label = within(nav).getByRole("link", { name }).querySelector("span") as HTMLElement
      // Ẩn ở điện thoại và md, hiện lại ở lg (sidebar có chữ) — tên đọc lên vẫn từ aria-label.
      expect(label).toHaveClass("hidden", "lg:inline")
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

  it("keeps every nav link named after its page when the icon-only sidebar hides the label (768–1023px)", () => {
    render(<Sidebar />)

    const nav = screen.getByRole("navigation")
    // jsdom không nạp Tailwind nên `md:hidden` không có tác dụng ở đây — ẩn nhãn bằng tay, đúng như ở bề rộng md.
    for (const link of within(nav).getAllByRole("link")) {
      const label = link.querySelector("span") as HTMLElement
      label.style.display = "none"
    }

    for (const name of [
      "Tổng quan",
      "Tài chính",
      "Chi tiêu",
      "Nhật ký",
      "Học tập",
      "Mục tiêu",
      "Plan",
      "Làm việc",
      "Cài đặt",
    ]) {
      expect(within(nav).getByRole("link", { name })).toBeInTheDocument()
    }
  })

  it("shows a Làm việc nav link pointing at /work", () => {
    render(<Sidebar />)

    expect(within(screen.getByRole("navigation")).getByRole("link", { name: "Làm việc" })).toHaveAttribute(
      "href",
      "/work"
    )
  })

  it("hides the Làm việc link when its module is turned off in Cài đặt", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({ modules: [{ key: "lamviec", label: "Làm việc", hint: "", on: false }] })
    )

    render(<Sidebar />)

    expect(within(screen.getByRole("navigation")).queryByRole("link", { name: "Làm việc" })).not.toBeInTheDocument()
  })

  it("shows a Plan nav link pointing at /life-plan, right after Mục tiêu", () => {
    render(<Sidebar />)

    const nav = screen.getByRole("navigation")
    expect(within(nav).getByRole("link", { name: "Plan" })).toHaveAttribute("href", "/life-plan")
    const names = within(nav)
      .getAllByRole("link")
      .map((link) => link.getAttribute("aria-label"))
    expect(names.indexOf("Plan")).toBe(names.indexOf("Mục tiêu") + 1)
  })

  it("shows the open Plan page's label under its icon on the phone bar, like every other page", () => {
    navigation.pathname = "/life-plan"
    render(<Sidebar />)

    const link = within(screen.getByRole("navigation")).getByRole("link", { name: "Plan" })
    // "Plan" vừa ô ~40px của thanh dưới — 1 nhãn duy nhất, dùng chung cho điện thoại và lg.
    const labels = link.querySelectorAll("span")
    expect(labels).toHaveLength(1)
    expect(labels[0]).toHaveTextContent("Plan")
    expect(labels[0]).toHaveClass("whitespace-nowrap", "md:hidden", "lg:inline")
  })

  it("hides the Plan link when its module is turned off in Cài đặt", () => {
    window.localStorage.setItem(
      "app-settings",
      JSON.stringify({ modules: [{ key: "kehoach", label: "Plan", hint: "", on: false }] })
    )

    render(<Sidebar />)

    const nav = screen.getByRole("navigation")
    expect(within(nav).queryByRole("link", { name: "Plan" })).not.toBeInTheDocument()
    expect(within(nav).getByRole("link", { name: "Mục tiêu" })).toBeInTheDocument()
  })
})
