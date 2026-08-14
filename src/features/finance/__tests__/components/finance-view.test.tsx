import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { formatMoney } from "@/lib/format"
import { FinanceView } from "../../components/finance-view"

describe("FinanceView", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("adding a savings fund updates the net-worth card's figure and the Tiết kiệm pillar", () => {
    render(<FinanceView />)

    const netSection = screen.getByText("Tài sản ròng").closest("section") as HTMLElement
    expect(within(netSection).getByText(formatMoney(0))).toBeInTheDocument()
    expect(screen.getByText("Chưa có quỹ nào")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Thêm quỹ tiết kiệm" }))
    fireEvent.change(screen.getByLabelText("Tên quỹ"), {
      target: { value: "Quỹ khẩn cấp" },
    })
    fireEvent.change(screen.getByLabelText("Số tiền hiện có", { exact: false }), {
      target: { value: "3000000" },
    })
    fireEvent.change(screen.getByLabelText("Mục tiêu", { exact: false }), {
      target: { value: "5000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    expect(within(netSection).getByText(formatMoney(3_000_000))).toBeInTheDocument()

    // "Tiết kiệm" cũng xuất hiện trong chú giải màu của NetWorthCard và trong nút Tabs —
    // chỉ span nhãn Card (class "uppercase") mới là tiêu đề PillarCard thật sự.
    const pillarLabel = screen
      .getAllByText("Tiết kiệm")
      .find((el) => el.tagName === "SPAN" && el.className.includes("uppercase")) as HTMLElement
    const pillarSection = pillarLabel.closest("section") as HTMLElement
    expect(within(pillarSection).getByText(formatMoney(3_000_000))).toBeInTheDocument()
    expect(within(pillarSection).getByText("1 quỹ đang chạy")).toBeInTheDocument()
  })

  it("setting the gold price and adding a purchase produces the correct P&L figure on the Tích lũy vàng tab", () => {
    render(<FinanceView />)

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))

    fireEvent.change(screen.getByLabelText("Giá vàng hôm nay (mỗi phân)", { exact: false }), {
      target: { value: "900000" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Thêm lần mua vàng" }))
    fireEvent.change(screen.getByLabelText("Ngày mua", { exact: false }), {
      target: { value: "10/08/2026" },
    })
    fireEvent.change(screen.getByLabelText("Khối lượng (phân)", { exact: false }), {
      target: { value: "10" },
    })
    fireEvent.change(screen.getByLabelText("Giá mua (mỗi phân)", { exact: false }), {
      target: { value: "800000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Thêm" }))

    // vốn 10 phân * 800.000 = 8.000.000, giá trị 10 phân * 900.000 = 9.000.000 => lãi 1.000.000
    // Con số này hiện cả ở khối lãi/lỗ tổng và ở dòng giao dịch trong bảng (chỉ có 1 giao dịch).
    expect(screen.getAllByText(`+ ${formatMoney(1_000_000)}`)).toHaveLength(2)
    expect(
      screen.getByText(`Bạn đang lãi ${formatMoney(1_000_000)} so với giá vốn nhờ giá vàng tăng.`)
    ).toBeInTheDocument()
  })

  it("switches through all four tabs and renders each tab's distinctive content", () => {
    render(<FinanceView />)

    expect(
      screen.getByText("Chưa có quỹ tiết kiệm nào. Thêm quỹ đầu tiên để bắt đầu theo dõi mục tiêu.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Nợ thẻ tín dụng" }))
    expect(
      screen.getByText("Chưa có thẻ tín dụng nào. Thêm thẻ đầu tiên để theo dõi dư nợ và hạn trả.")
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Tích lũy vàng" }))
    expect(screen.getByText("Giá thị trường hôm nay")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Đầu tư" }))
    expect(screen.getByRole("button", { name: "Thêm khoản đầu tư" })).toBeInTheDocument()
  })
})
