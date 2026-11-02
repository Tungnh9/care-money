import { beforeEach, describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { StorageUsage } from "../../components/storage-usage"

const MIB = 1024 * 1024

// Ghi đủ ký tự để localStorage dùng đúng `bytes` byte theo cách Safari tính: (key "k" + giá trị) × 2 byte.
function fillStorage(bytes: number) {
  window.localStorage.setItem("k", "a".repeat(Math.round(bytes / 2) - 1))
}

function usageLine(): HTMLElement {
  return screen.getByText(/^Dữ liệu đang dùng/)
}

function indicator(container: HTMLElement): Element | null {
  return container.querySelector('[data-slot="progress-indicator"]')
}

describe("StorageUsage", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("shows how much of the 5 MB the data uses, in KB under 1 MB, with the share on the bar", () => {
    fillStorage(420 * 1024)

    render(<StorageUsage />)

    expect(usageLine()).toHaveTextContent("Dữ liệu đang dùng 420 KB / 5 MB")
    const bar = screen.getByRole("progressbar", { name: "Dung lượng dữ liệu đã dùng" })
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(8.2, 1)
    expect(screen.getByText("8%")).toBeInTheDocument()
  })

  it("switches to MB with 2 decimals from 1 MB", () => {
    fillStorage(1.5 * MIB)

    render(<StorageUsage />)

    expect(usageLine()).toHaveTextContent("Dữ liệu đang dùng 1,50 MB / 5 MB")
    expect(screen.getByText("30%")).toBeInTheDocument()
  })

  it("says it counts like Safari on iPhone, which holds half of what Chrome does", () => {
    render(<StorageUsage />)

    expect(screen.getByText("Tính như Safari trên iPhone — Chrome chứa gấp đôi")).toBeInTheDocument()
  })

  it("stays in the action colour with no warning below 80%", () => {
    fillStorage(3.9 * MIB)

    const { container } = render(<StorageUsage />)

    expect(screen.getByText("78%")).toBeInTheDocument()
    expect(indicator(container)).toHaveClass("bg-[var(--ob-color-action)]")
    expect(screen.queryByText(/^(Sắp đầy|Đã quá)/)).not.toBeInTheDocument()
  })

  it("turns red from 80% and says to export a copy before Safari runs out of room", () => {
    fillStorage(4 * MIB)

    const { container } = render(<StorageUsage />)

    expect(screen.getByText("80%")).toBeInTheDocument()
    expect(indicator(container)).toHaveClass("bg-[var(--ob-color-expense)]")
    expect(
      screen.getByText("Sắp đầy: Xuất file JSON để giữ 1 bản sao. Quá 5 MB thì Safari trên iPhone không lưu thêm được.")
    ).toBeInTheDocument()
  })

  it("fills the bar and says Safari can no longer save once the data passes 5 MB", () => {
    fillStorage(6 * MIB)

    const { container } = render(<StorageUsage />)

    expect(usageLine()).toHaveTextContent("Dữ liệu đang dùng 6,00 MB / 5 MB")
    expect(screen.getByText("120%")).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Dung lượng dữ liệu đã dùng" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    )
    expect(indicator(container)).toHaveClass("bg-[var(--ob-color-expense)]")
    expect(
      screen.getByText(
        "Đã quá 5 MB: Safari trên iPhone không lưu thêm được (Chrome chứa tới 10 MB). Xuất file JSON để giữ 1 bản sao."
      )
    ).toBeInTheDocument()
  })

  it("updates as soon as the data changes", () => {
    render(<StorageUsage />)
    expect(usageLine()).toHaveTextContent("Dữ liệu đang dùng 0 KB / 5 MB")

    act(() => {
      fillStorage(420 * 1024)
      notifyDataChanged()
    })

    expect(usageLine()).toHaveTextContent("Dữ liệu đang dùng 420 KB / 5 MB")
  })
})
