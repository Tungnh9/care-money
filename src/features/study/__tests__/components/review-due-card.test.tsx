import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { ReviewDueCard } from "../../components/review-due-card"
import type { TodayQueue } from "@/lib/study/srs-calculations"
import type { VocabEntry } from "@/lib/study/types"

function vocab(id: string): VocabEntry {
  return { id, word: `word-${id}`, meaning: `nghĩa-${id}`, addedAt: "2026-01-01" }
}

function words(count: number, prefix = ""): VocabEntry[] {
  return Array.from({ length: count }, (_, i) => vocab(`${prefix}${i}`))
}

function reviewsOnly(reviews: VocabEntry[]): TodayQueue {
  return { reviews, fresh: [], newLeft: 0 }
}

// Mô phỏng đúng component cha thật (StudyView): chấm 1 thẻ xong thì từ đó không còn tới hạn nữa.
function DueHarness({ initial }: { initial: TodayQueue }) {
  const [queue, setQueue] = useState(initial)
  return (
    <ReviewDueCard
      queue={queue}
      onGrade={(wordId) =>
        setQueue((q) => ({
          ...q,
          reviews: q.reviews.filter((w) => w.id !== wordId),
          fresh: q.fresh.filter((w) => w.id !== wordId),
        }))
      }
    />
  )
}

// Luôn lật thẻ chưa lật đầu tiên rồi chấm "Nhớ" — mỗi lúc chỉ có đúng 1 thẻ đang lật mà chưa chấm.
function gradeNextShownCard() {
  fireEvent.click(screen.getAllByRole("button", { name: /Hiện nghĩa/ })[0])
  fireEvent.click(screen.getByRole("button", { name: "Nhớ" }))
}

function shownWords() {
  return screen.getAllByText(/^word-/, { selector: "span" }).map((el) => el.textContent)
}

describe("ReviewDueCard", () => {
  it("shows an empty state when there is nothing due", () => {
    render(<ReviewDueCard queue={reviewsOnly([])} onGrade={vi.fn()} />)

    expect(screen.getByText("Không có từ nào cần ôn hôm nay")).toBeInTheDocument()
    expect(screen.getByText("Quay lại vào ngày mai nhé!")).toBeInTheDocument()
  })

  it("says the new words for today are done when the word bank still has more", () => {
    render(<ReviewDueCard queue={{ reviews: [], fresh: [], newLeft: 300 }} onGrade={vi.fn()} />)

    expect(screen.getByText("Đã đủ 10 từ mới hôm nay — mai học tiếp nhé!")).toBeInTheDocument()
  })

  it("shows at most 5 cards even when more words are due, and counts reviews and new words apart", () => {
    render(<ReviewDueCard queue={{ reviews: words(12), fresh: words(10, "n"), newLeft: 300 }} onGrade={vi.fn()} />)

    expect(shownWords()).toHaveLength(5)
    expect(screen.getByText("12 ôn lại · 10 từ mới")).toBeInTheDocument()
  })

  it("puts reviews before new words and tags only the new ones", () => {
    render(<ReviewDueCard queue={{ reviews: words(2), fresh: words(3, "n"), newLeft: 3 }} onGrade={vi.fn()} />)

    expect(shownWords()).toEqual(["word-0", "word-1", "word-n0", "word-n1", "word-n2"])
    const tagged = screen.getAllByText("Mới").map((tag) => tag.previousElementSibling?.textContent)
    expect(tagged).toEqual(["word-n0", "word-n1", "word-n2"])
  })

  it("keeps the Mới tag on a new word after it is graded", () => {
    render(<DueHarness initial={{ reviews: [], fresh: words(2, "n"), newLeft: 2 }} />)

    gradeNextShownCard()

    const card = screen.getByText("word-n0").parentElement!
    expect(within(card).getByText("Mới")).toBeInTheDocument()
  })

  it("grading one card does not remove or reorder the others", () => {
    render(<ReviewDueCard queue={reviewsOnly(words(3))} onGrade={vi.fn()} />)

    gradeNextShownCard()

    expect(shownWords()).toHaveLength(3)
  })

  it("keeps the shown cards frozen even when the parent recomputes a shorter queue after a grade", () => {
    // Cha chấm xong 1 từ thì tính lại hàng chờ (bỏ từ vừa chấm) rồi truyền prop mới xuống. Nếu component tự
    // cắt lại theo hàng chờ sống thay vì đóng băng lúc mount, số thẻ hiển thị sẽ tụt xuống — sai UX.
    const due = words(3)
    const { rerender } = render(<ReviewDueCard queue={reviewsOnly(due)} onGrade={vi.fn()} />)

    rerender(<ReviewDueCard queue={reviewsOnly(due.slice(1))} onGrade={vi.fn()} />)

    expect(shownWords()).toEqual(["word-0", "word-1", "word-2"])
    expect(screen.getByText("2 ôn lại · 0 từ mới")).toBeInTheDocument()
  })

  it("offers the next batch of due words once every shown card is graded", () => {
    render(<DueHarness initial={reviewsOnly(words(12))} />)

    for (let i = 0; i < 4; i++) gradeNextShownCard()
    // Còn 1 thẻ chưa chấm trong lượt này — chưa mời ôn tiếp.
    expect(screen.queryByRole("button", { name: /Ôn tiếp/ })).not.toBeInTheDocument()

    gradeNextShownCard()
    expect(screen.getByText("7 ôn lại · 0 từ mới")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Ôn tiếp 5 từ" }))

    expect(shownWords()).toEqual(["word-5", "word-6", "word-7", "word-8", "word-9"])
    expect(screen.getAllByRole("button", { name: /Hiện nghĩa/ })).toHaveLength(5)
    expect(screen.queryByRole("button", { name: /Ôn tiếp/ })).not.toBeInTheDocument()
  })

  it("moves on from reviews to the new words in the next batch, tagged", () => {
    render(<DueHarness initial={{ reviews: words(5), fresh: words(2, "n"), newLeft: 2 }} />)

    for (let i = 0; i < 5; i++) gradeNextShownCard()
    fireEvent.click(screen.getByRole("button", { name: "Ôn tiếp 2 từ" }))

    expect(shownWords()).toEqual(["word-n0", "word-n1"])
    expect(screen.getAllByText("Mới")).toHaveLength(2)
  })

  it("skips words already graded on this card when showing the next batch", () => {
    // Cha tĩnh: từ đã chấm vẫn nằm trong hàng chờ, nên chỉ riêng gradedIds mới loại chúng khỏi lượt kế.
    render(<ReviewDueCard queue={reviewsOnly(words(12))} onGrade={vi.fn()} />)

    for (let i = 0; i < 5; i++) gradeNextShownCard()
    fireEvent.click(screen.getByRole("button", { name: "Ôn tiếp 5 từ" }))

    expect(shownWords()).toEqual(["word-5", "word-6", "word-7", "word-8", "word-9"])
  })

  it("offers only as many words as are left for the last batch", () => {
    render(<DueHarness initial={reviewsOnly(words(7))} />)

    for (let i = 0; i < 5; i++) gradeNextShownCard()

    expect(screen.getByRole("button", { name: "Ôn tiếp 2 từ" })).toBeInTheDocument()
  })
})
