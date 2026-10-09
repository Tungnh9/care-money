import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ReviewDueCard } from "../../components/review-due-card"
import type { VocabEntry } from "@/lib/study/types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

// Mô phỏng đúng component cha thật (StudyView): chấm 1 thẻ xong thì từ đó không còn tới hạn nữa.
function DueHarness({ initial }: { initial: VocabEntry[] }) {
  const [due, setDue] = useState(initial)
  return <ReviewDueCard dueWords={due} onGrade={(wordId) => setDue((words) => words.filter((w) => w.id !== wordId))} />
}

// Luôn lật thẻ chưa lật đầu tiên rồi chấm "Nhớ" — mỗi lúc chỉ có đúng 1 thẻ đang lật mà chưa chấm.
function gradeNextShownCard() {
  fireEvent.click(screen.getAllByRole("button", { name: /Hiện nghĩa/ })[0])
  fireEvent.click(screen.getByRole("button", { name: "Nhớ" }))
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

  it("offers the next batch of due words once every shown card is graded", () => {
    render(<DueHarness initial={Array.from({ length: 12 }, (_, i) => vocab(`${i}`))} />)

    for (let i = 0; i < 4; i++) gradeNextShownCard()
    // Còn 1 thẻ chưa chấm trong lượt này — chưa mời ôn tiếp.
    expect(screen.queryByRole("button", { name: /Ôn tiếp/ })).not.toBeInTheDocument()

    gradeNextShownCard()
    expect(screen.getByText("7 từ đang chờ")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Ôn tiếp 5 từ" }))

    const shownWords = screen.getAllByText(/^word-/, { selector: "span" }).map((el) => el.textContent)
    expect(shownWords).toEqual(["word-5", "word-6", "word-7", "word-8", "word-9"])
    expect(screen.getAllByRole("button", { name: /Hiện nghĩa/ })).toHaveLength(5)
    expect(screen.queryByRole("button", { name: /Ôn tiếp/ })).not.toBeInTheDocument()
  })

  it("skips words already graded on this card when showing the next batch", () => {
    // Cha tĩnh: từ đã chấm vẫn nằm trong dueWords, nên chỉ riêng gradedIds mới loại chúng khỏi lượt kế.
    const dueWords = Array.from({ length: 12 }, (_, i) => vocab(`${i}`))
    render(<ReviewDueCard dueWords={dueWords} onGrade={vi.fn()} />)

    for (let i = 0; i < 5; i++) gradeNextShownCard()
    fireEvent.click(screen.getByRole("button", { name: "Ôn tiếp 5 từ" }))

    const shownWords = screen.getAllByText(/^word-/, { selector: "span" }).map((el) => el.textContent)
    expect(shownWords).toEqual(["word-5", "word-6", "word-7", "word-8", "word-9"])
  })

  it("offers only as many words as are left for the last batch", () => {
    render(<DueHarness initial={Array.from({ length: 7 }, (_, i) => vocab(`${i}`))} />)

    for (let i = 0; i < 5; i++) gradeNextShownCard()

    expect(screen.getByRole("button", { name: "Ôn tiếp 2 từ" })).toBeInTheDocument()
  })
})
