import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react"

import { MoneyVisibilityProvider } from "@/components/money-visibility-provider"
import { ExpenseListCard } from "../../components/expense-list-card"
import { formatMoney } from "@/lib/format"
import { UNTAGGED_EMOJI, UNTAGGED_LABEL, type SettlementListItem } from "@/lib/budget/budget-calculations"
import type { Expense } from "@/lib/budget/types"

const EXPENSES: Expense[] = [
  { id: 2, dayKey: "2026-09-02", amount: 50_000, tag: { label: "Mua sắm", emoji: "🛍️", tint: "#E7F6EF" } },
  { id: 1, dayKey: "2026-09-01", amount: 3_000_000, tag: null, note: "Tiền nhà" },
]

function expandAllDays() {
  for (const header of screen.getAllByTestId("expense-day-header")) {
    if (header.getAttribute("aria-expanded") === "false") fireEvent.click(header)
  }
}

function closing(overrides: Partial<SettlementListItem> = {}): SettlementListItem {
  return {
    id: 1,
    month: "2026-09",
    at: new Date(2026, 8, 30, 21, 0).toISOString(),
    direction: "withdraw",
    amount: 1_500_000,
    fundName: "Dự phòng",
    fundAmountBefore: 10_000_000,
    fundAmountAfter: 8_500_000,
    dayKey: "2026-09-30",
    fundDeleted: false,
    ...overrides,
  }
}

describe("ExpenseListCard", () => {
  beforeEach(() => window.localStorage.clear())

  it("shows the empty state when there are no expenses", () => {
    render(<ExpenseListCard expenses={[]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText(/Chưa có khoản chi nào/)).toBeInTheDocument()
  })

  it("shows the card title", () => {
    render(<ExpenseListCard expenses={[]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("Khoản chi tháng này")).toBeInTheDocument()
  })

  it("renders each expense's amount, tag label (or untagged) and note", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)
    expandAllDays()

    expect(screen.getAllByText("50.000 ₫").length).toBeGreaterThan(0)
    expect(screen.getByText("Mua sắm")).toBeInTheDocument()
    expect(screen.getAllByText("3.000.000 ₫").length).toBeGreaterThan(0)
    expect(screen.getByText("Tiền nhà")).toBeInTheDocument()
    expect(screen.getByText("Không gắn thẻ")).toBeInTheDocument()
  })

  it("asks for confirmation, naming the tag, amount and day, before removing an expense", () => {
    const onRemove = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={onRemove} onEdit={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xoá khoản chi Mua sắm" }))

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Xoá khoản chi?")).toBeInTheDocument()
    expect(within(dialog).getByText("Mua sắm", { selector: "strong" })).toBeInTheDocument()
    expect(dialog).toHaveTextContent(formatMoney(50_000))
    expect(dialog).toHaveTextContent("02/09")
    expect(onRemove).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Xoá" }))

    expect(onRemove).toHaveBeenCalledWith(2)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("hides the amount in the delete confirmation while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />
      </MoneyVisibilityProvider>
    )
    await waitFor(() => expect(screen.queryByText("50.000 ₫")).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "Xoá khoản chi Mua sắm" }))

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent("•••••••• ₫")
    expect(dialog).not.toHaveTextContent("50.000")
  })

  it("keeps the expense when the confirmation is cancelled", () => {
    const onRemove = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={onRemove} onEdit={vi.fn()} />)
    expandAllDays()

    fireEvent.click(screen.getByRole("button", { name: "Xoá khoản chi Không gắn thẻ" }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Huỷ" }))

    expect(onRemove).not.toHaveBeenCalled()
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("calls onEdit with the full expense when its edit button is clicked", () => {
    const onEdit = vi.fn()
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={onEdit} />)

    fireEvent.click(screen.getAllByRole("button", { name: /Sửa/ })[0])

    expect(onEdit).toHaveBeenCalledWith(EXPENSES[0])
  })

  it("groups expenses under a date header per day, most recent day first", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const headers = screen.getAllByTestId("expense-day-header").map((el) => el.textContent)
    expect(headers[0]).toContain("02/09")
    expect(headers[1]).toContain("01/09")
  })

  it("shows each day's subtotal in its header", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByTestId("expense-day-header")).toHaveTextContent(formatMoney(150_000))
  })

  it("gives every row within the same day the same background, alternating per day rather than per row", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rows = screen.getAllByTestId("expense-row")
    const bgClass = [...rows[0].classList].find((c) => c.startsWith("bg-"))
    expect([...rows[1].classList]).toContain(bgClass)
  })

  it("alternates the day block's background between consecutive days", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)
    expandAllDays()

    const rows = screen.getAllByTestId("expense-row")
    const bgClass = [...rows[0].classList].find((c) => c.startsWith("bg-"))
    expect([...rows[1].classList]).not.toContain(bgClass)
  })

  it("gives the header a more distinct background than its own day's transaction rows", () => {
    const sameDay: Expense[] = [{ id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null }]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const header = screen.getByTestId("expense-day-header")
    const row = screen.getByTestId("expense-row")
    const headerBg = [...header.classList].find((c) => c.startsWith("bg-"))
    const rowBg = [...row.classList].find((c) => c.startsWith("bg-"))
    expect(headerBg).not.toBe(rowBg)
  })

  it("adds a divider between consecutive rows in the same day, but not after the last one", () => {
    const sameDay: Expense[] = [
      { id: 1, dayKey: "2026-09-01", amount: 100_000, tag: null },
      { id: 2, dayKey: "2026-09-01", amount: 50_000, tag: null },
    ]
    render(<ExpenseListCard expenses={sameDay} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rows = screen.getAllByTestId("expense-row")
    expect(rows[0].className).toContain("border-b")
    expect(rows[1].className).not.toContain("border-b")
  })

  it("names and badges untagged rows exactly like the tag charts do", () => {
    render(
      <ExpenseListCard
        expenses={[{ id: 1, dayKey: "2026-09-01", amount: 10_000, tag: null }]}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    )

    const row = screen.getByTestId("expense-row")
    expect(row).toHaveTextContent(UNTAGGED_LABEL)
    expect(row).toHaveTextContent(UNTAGGED_EMOJI)
  })

  it("opens only the most recent day; older days show just the date, total and item count", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const [latest, older] = screen.getAllByTestId("expense-day-header")
    expect(latest).toHaveAttribute("aria-expanded", "true")
    expect(older).toHaveAttribute("aria-expanded", "false")
    expect(older).toHaveTextContent("01/09")
    expect(older).toHaveTextContent(formatMoney(3_000_000))
    expect(older).toHaveTextContent("1 khoản")

    const [latestRows, olderRows] = screen.getAllByTestId("expense-day-rows")
    expect(latestRows).not.toHaveAttribute("inert")
    expect(latestRows).toHaveClass("grid-rows-[1fr]")
    expect(olderRows).toHaveAttribute("inert")
    expect(olderRows).toHaveClass("grid-rows-[0fr]")
    expect(within(olderRows).getByText("Tiền nhà")).toBeInTheDocument()
  })

  it("expands and collapses a day when its header is clicked", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)
    const [latest, older] = screen.getAllByTestId("expense-day-header")
    const [latestRows, olderRows] = screen.getAllByTestId("expense-day-rows")

    fireEvent.click(older)
    expect(older).toHaveAttribute("aria-expanded", "true")
    expect(olderRows).not.toHaveAttribute("inert")
    expect(olderRows).toHaveClass("grid-rows-[1fr]")

    fireEvent.click(older)
    expect(olderRows).toHaveAttribute("inert")

    fireEvent.click(latest)
    expect(latest).toHaveAttribute("aria-expanded", "false")
    expect(latestRows).toHaveAttribute("inert")
  })

  it("keeps a day open by date, not position, when a newer day appears above it", () => {
    const { rerender } = render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)
    fireEvent.click(screen.getAllByTestId("expense-day-header")[1])

    const newer: Expense = { id: 3, dayKey: "2026-09-03", amount: 20_000, tag: null, note: "Cà phê" }
    rerender(<ExpenseListCard expenses={[newer, ...EXPENSES]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const headers = screen.getAllByTestId("expense-day-header")
    expect(headers.map((h) => h.getAttribute("aria-expanded"))).toEqual(["true", "false", "true"])
    const rows = screen.getAllByTestId("expense-day-rows")
    expect(rows.map((r) => r.hasAttribute("inert"))).toEqual([false, true, false])
  })

  it("shows the month's settlements in a 'Chốt sổ' block above the first day", () => {
    render(<ExpenseListCard expenses={EXPENSES} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const block = screen.getByTestId("closing-block")
    expect(within(block).getByText("Chốt sổ")).toBeInTheDocument()
    const firstDay = screen.getAllByTestId("expense-day-header")[0]
    expect(block.compareDocumentPosition(firstDay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("has no 'Chốt sổ' block when nothing was settled this month", () => {
    render(<ExpenseListCard expenses={EXPENSES} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.queryByTestId("closing-block")).not.toBeInTheDocument()
  })

  it("describes a withdrawal: settled month, fund, day, balances and a red minus amount", () => {
    render(<ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const row = screen.getByTestId("settlement-row")
    expect(within(row).getByText("Tất toán tháng 9")).toBeInTheDocument()
    expect(within(row).getByText("Rút từ sổ Dự phòng · 30/09")).toBeInTheDocument()
    expect(within(row).getByText("10.000.000 ₫ → 8.500.000 ₫")).toHaveAttribute("aria-hidden", "true")
    expect(within(row).getByText("Số dư sổ từ 10.000.000 ₫ thành 8.500.000 ₫")).toBeInTheDocument()
    expect(within(row).getByText("− 1.500.000 ₫")).toHaveStyle({ color: "var(--ob-color-expense)" })
  })

  it("keeps the screen-reader sentence outside the aria-hidden 'before → after' text", () => {
    render(<ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const sentence = screen.getByText("Số dư sổ từ 10.000.000 ₫ thành 8.500.000 ₫")
    expect(sentence).toHaveClass("sr-only")
    expect(sentence.closest('[aria-hidden="true"]')).toBeNull()
  })

  it("describes a deposit with a green plus amount", () => {
    const deposit = closing({ direction: "deposit", amount: 300_000, fundName: "Du lịch", fundAmountBefore: 100_000, fundAmountAfter: 400_000 })
    render(<ExpenseListCard expenses={[]} settlements={[deposit]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const row = screen.getByTestId("settlement-row")
    expect(within(row).getByText("Nạp vào sổ Du lịch · 30/09")).toBeInTheDocument()
    expect(within(row).getByText("+ 300.000 ₫")).toHaveStyle({ color: "var(--ob-color-income)" })
  })

  it("labels a late settlement with the day it was made", () => {
    const late = closing({ month: "2026-08", dayKey: "2026-09-02", at: new Date(2026, 8, 2, 9).toISOString() })
    render(<ExpenseListCard expenses={[]} settlements={[late]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const row = screen.getByTestId("settlement-row")
    expect(within(row).getByText("Tất toán tháng 8")).toBeInTheDocument()
    expect(within(row).getByText("Rút từ sổ Dự phòng · bấm ngày 02/09")).toBeInTheDocument()
  })

  it("adds the year when the settled month is in another year", () => {
    const lastYear = closing({ month: "2025-12", dayKey: "2026-01-05", at: new Date(2026, 0, 5, 9).toISOString() })
    render(<ExpenseListCard expenses={[]} settlements={[lastYear]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(within(screen.getByTestId("settlement-row")).getByText("Tất toán tháng 12, 2025")).toBeInTheDocument()
  })

  it.each(["garbage", "2026-13", "2026-9"])("titles a settlement whose month %j is not a year-month just 'Tất toán'", (month) => {
    render(<ExpenseListCard expenses={[]} settlements={[closing({ month })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(within(screen.getByTestId("settlement-row")).getByText("Tất toán")).toBeInTheDocument()
  })

  it("marks a fund that no longer exists", () => {
    render(<ExpenseListCard expenses={[]} settlements={[closing({ fundDeleted: true })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    expect(screen.getByText("Rút từ sổ Dự phòng (đã xoá) · 30/09")).toBeInTheDocument()
  })

  it("keeps the settlements in the order given and offers no buttons on them", () => {
    const rows = [closing({ id: 2, fundName: "Mua xe" }), closing({ id: 1 })]
    render(<ExpenseListCard expenses={[]} settlements={rows} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const rendered = screen.getAllByTestId("settlement-row")
    expect(rendered.map((r) => within(r).getByText(/^Rút từ sổ/).textContent)).toEqual([
      "Rút từ sổ Mua xe · 30/09",
      "Rút từ sổ Dự phòng · 30/09",
    ])
    rendered.forEach((r) => expect(within(r).queryAllByRole("button")).toHaveLength(0))
  })

  it("leaves the day groups, their totals and counts as they were", () => {
    render(<ExpenseListCard expenses={EXPENSES} settlements={[closing({ dayKey: "2026-09-02" })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const headers = screen.getAllByTestId("expense-day-header")
    expect(headers).toHaveLength(2)
    // Nhóm 02/09 là nhóm duy nhất mà tất toán lọt vào sẽ làm đổi. getByText khớp CẢ chuỗi (toHaveTextContent chỉ khớp
    // một phần: "1.550.000 ₫" vẫn chứa "50.000 ₫"), còn "· 1 khoản" bắt thêm một khoản chi giả trong nhóm.
    expect(within(headers[0]).getByText(formatMoney(50_000))).toBeInTheDocument()
    expect(headers[0]).toHaveTextContent("· 1 khoản")
    expect(headers[1]).toHaveTextContent("1 khoản")
  })

  it("masks every amount in the block while money is hidden", async () => {
    window.localStorage.setItem("hide-money", "1")
    render(
      <MoneyVisibilityProvider>
        <ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />
      </MoneyVisibilityProvider>
    )

    const row = screen.getByTestId("settlement-row")
    await waitFor(() => expect(within(row).getByText("− •••••••• ₫")).toBeInTheDocument())
    expect(row.textContent).not.toMatch(/\d{1,3}(\.\d{3})+/)
  })

  it("still shows the empty-state sentence under the block when no expense is recorded yet", () => {
    render(<ExpenseListCard expenses={[]} settlements={[closing()]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const block = screen.getByTestId("closing-block")
    const empty = screen.getByText(/Chưa có khoản chi nào/)
    expect(block.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(block).not.toContainElement(empty)
  })

  it("wraps a long unbroken fund name inside the row instead of widening the page", () => {
    const longName = "QuỹDựPhòngKhẩnCấpChoCảGiaĐìnhNămNay"
    render(<ExpenseListCard expenses={[]} settlements={[closing({ fundName: longName })]} onRemove={vi.fn()} onEdit={vi.fn()} />)

    const line = screen.getByText(`Rút từ sổ ${longName} · 30/09`)
    expect(line).toHaveClass("wrap-anywhere")
    expect(line.parentElement).toHaveClass("min-w-0")
  })

  describe("card-linked expenses", () => {
    const SWIPE_TAG = { label: "Quẹt thẻ", emoji: "🧾", tint: "#F0ECFE" }
    const PAY_TAG = { label: "Trả nợ thẻ", emoji: "🏦", tint: "#FFE0C7" }
    const SWIPE: Expense = {
      id: 3,
      dayKey: "2026-09-03",
      amount: 500_000,
      tag: SWIPE_TAG,
      card: { kind: "swipe", cardName: "Visa" },
    }

    it("shows a swipe as 0 out of its amount", () => {
      render(<ExpenseListCard expenses={[SWIPE]} onRemove={vi.fn()} onEdit={vi.fn()} />)

      expect(screen.getByText(`${formatMoney(0)} / ${formatMoney(500_000)}`)).toBeInTheDocument()
    })

    it("leaves swipes out of the day total but counts them in the number of expenses", () => {
      const normal: Expense = { id: 4, dayKey: "2026-09-03", amount: 100_000, tag: null }
      render(<ExpenseListCard expenses={[SWIPE, normal]} onRemove={vi.fn()} onEdit={vi.fn()} />)

      const header = screen.getByTestId("expense-day-header")
      expect(header).toHaveTextContent(formatMoney(100_000))
      expect(header).not.toHaveTextContent(formatMoney(600_000))
      expect(screen.getAllByTestId("expense-row")).toHaveLength(2)
      expect(header).toHaveTextContent("2 khoản")
    })

    it("shows which card a linked expense went on, or that the card was deleted", () => {
      const orphan: Expense = { ...SWIPE, id: 5, card: { kind: "swipe", cardName: null } }
      render(<ExpenseListCard expenses={[SWIPE, orphan]} onRemove={vi.fn()} onEdit={vi.fn()} />)

      expect(screen.getByText("Thẻ Visa")).toBeInTheDocument()
      expect(screen.getByText("Thẻ đã xoá")).toBeInTheDocument()
    })

    it("tells how the card debt will change before deleting a linked expense", () => {
      const payment: Expense = {
        id: 6,
        dayKey: "2026-09-03",
        amount: 200_000,
        tag: PAY_TAG,
        card: { kind: "payment", cardName: "Master" },
      }
      const orphan: Expense = { ...SWIPE, id: 7, card: { kind: "swipe", cardName: null } }
      render(<ExpenseListCard expenses={[SWIPE, payment, orphan]} onRemove={vi.fn()} onEdit={vi.fn()} />)

      fireEvent.click(screen.getAllByRole("button", { name: "Xoá khoản chi Quẹt thẻ" })[0])
      expect(screen.getByRole("alertdialog")).toHaveTextContent(`Nợ thẻ "Visa" sẽ giảm ${formatMoney(500_000)}.`)
      fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Huỷ" }))

      fireEvent.click(screen.getByRole("button", { name: "Xoá khoản chi Trả nợ thẻ" }))
      expect(screen.getByRole("alertdialog")).toHaveTextContent(`Nợ thẻ "Master" sẽ tăng ${formatMoney(200_000)}.`)
      fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Huỷ" }))

      fireEvent.click(screen.getAllByRole("button", { name: "Xoá khoản chi Quẹt thẻ" })[1])
      expect(screen.getByRole("alertdialog")).not.toHaveTextContent("Nợ thẻ")
    })

    it("puts the amount in one wrapping column with the label, so a 320px phone never pushes Sửa/Xoá out of the row", () => {
      render(<ExpenseListCard expenses={[SWIPE]} onRemove={vi.fn()} onEdit={vi.fn()} />)

      const amount = screen.getByText(`${formatMoney(0)} / ${formatMoney(500_000)}`)
      // Không còn cột số tiền cứng (flex-none + max-w-[40%]) giành chỗ của nhãn và nút: số tiền co và tự ngắt.
      expect(amount).toHaveClass("min-w-0", "wrap-anywhere")
      expect(amount).not.toHaveClass("flex-none")
      expect(amount.className).not.toMatch(/max-w-/)

      const column = amount.parentElement!
      expect(column).toHaveClass("flex", "flex-wrap", "min-w-0", "flex-1")
      const label = screen.getByText("Quẹt thẻ")
      expect(column).toContainElement(label)
      expect(label.parentElement).toHaveClass("min-w-0")
      expect(column).toContainElement(screen.getByText("Thẻ Visa"))

      const row = screen.getByTestId("expense-row")
      expect(row).toContainElement(column)
      expect(screen.getByRole("button", { name: "Xoá khoản chi Quẹt thẻ" }).parentElement).toHaveClass("flex-none")
    })

    it("hides both amounts of a swipe while money is hidden", async () => {
      window.localStorage.setItem("hide-money", "1")
      render(
        <MoneyVisibilityProvider>
          <ExpenseListCard expenses={[SWIPE]} onRemove={vi.fn()} onEdit={vi.fn()} />
        </MoneyVisibilityProvider>
      )

      await waitFor(() => expect(screen.queryByText(/500\.000/)).not.toBeInTheDocument())
      expect(screen.getByText(`${formatMoney(0, true)} / ${formatMoney(500_000, true)}`)).toBeInTheDocument()
      expect(document.body).not.toHaveTextContent("500.000")

      fireEvent.click(screen.getByRole("button", { name: "Xoá khoản chi Quẹt thẻ" }))
      expect(screen.getByRole("alertdialog")).not.toHaveTextContent("500.000")
    })
  })
})
