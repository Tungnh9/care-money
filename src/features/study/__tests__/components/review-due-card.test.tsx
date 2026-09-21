import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ReviewDueCard } from "../../components/review-due-card"
import type { VocabEntry } from "../../types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

describe("ReviewDueCard", () => {
  it("shows an empty state when there is nothing due", () => {
    render(<ReviewDueCard dueWords={[]} onGrade={vi.fn()} />)

    expect(screen.getByText("Không có từ nào cần ôn hôm nay")).toBeInTheDocument()
  })

  it("shows at most 5 cards even when more words are due, and reports the true total", () => {
    const dueWords = Array.from({ length: 12 }, (_, i) => vocab(`${i}`))
    render(<ReviewDueCard dueWords={dueWords} onGrade={vi.fn()} />)

    expect(screen.getAllByText(/^word-/, { selector: "span" })).toHaveLength(5)
    expect(screen.getByText("12 từ đang chờ")).toBeInTheDocument()
  })

  it("grading one card does not remove or reorder the others", () => {
    const dueWords = Array.from({ length: 3 }, (_, i) => vocab(`${i}`))
    render(<ReviewDueCard dueWords={dueWords} onGrade={vi.fn()} />)

    const revealButtons = screen.getAllByRole("button", { name: /Hiện nghĩa/ })
    fireEvent.click(revealButtons[0])
    fireEvent.click(screen.getByRole("button", { name: "Nhớ" }))

    expect(screen.getAllByText(/^word-/, { selector: "span" })).toHaveLength(3)
  })

  it("keeps the shown cards frozen even when the parent recomputes a shorter dueWords after a grade", () => {
    // Mô phỏng đúng kịch bản component cha thật (Task 6) sẽ làm: chấm 1 từ xong, cha tính lại
    // dueWords (bỏ từ vừa chấm ra) rồi truyền prop mới xuống. Nếu component tự re-slice theo
    // dueWords sống thay vì đóng băng lúc mount, số thẻ hiển thị sẽ tụt xuống — sai UX.
    const dueWords = Array.from({ length: 3 }, (_, i) => vocab(`${i}`))
    const { rerender } = render(<ReviewDueCard dueWords={dueWords} onGrade={vi.fn()} />)

    expect(screen.getAllByText(/^word-/, { selector: "span" })).toHaveLength(3)

    // Cha "chấm xong từ 0" nên nó không còn tới hạn nữa -> dueWords mới chỉ còn 2 từ.
    const shrunkDueWords = dueWords.slice(1)
    rerender(<ReviewDueCard dueWords={shrunkDueWords} onGrade={vi.fn()} />)

    const shownWords = screen.getAllByText(/^word-/, { selector: "span" }).map((el) => el.textContent)
    expect(shownWords).toEqual(["word-0", "word-1", "word-2"])
    expect(screen.getByText("2 từ đang chờ")).toBeInTheDocument()
  })
})
