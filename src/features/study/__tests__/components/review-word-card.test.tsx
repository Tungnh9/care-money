import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { ReviewWordCard } from "../../components/review-word-card"
import type { VocabEntry } from "../../types"

const ENTRY: VocabEntry = {
  id: "v-0001",
  word: "hello",
  meaning: "xin chào",
  addedAt: "2026-01-01",
}

describe("ReviewWordCard", () => {
  it("hides the meaning until 'Hiện nghĩa' is clicked", () => {
    render(<ReviewWordCard entry={ENTRY} onGrade={vi.fn()} />)

    expect(screen.queryByText("xin chào")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Hiện nghĩa/ }))
    expect(screen.getByText("xin chào")).toBeInTheDocument()
  })

  it("calls onGrade with the picked grade after revealing", () => {
    const onGrade = vi.fn()
    render(<ReviewWordCard entry={ENTRY} onGrade={onGrade} />)

    fireEvent.click(screen.getByRole("button", { name: /Hiện nghĩa/ }))
    fireEvent.click(screen.getByRole("button", { name: "Nhớ" }))

    expect(onGrade).toHaveBeenCalledWith("v-0001", "good")
  })

  it("shows a graded state and hides the grade buttons after grading", () => {
    render(<ReviewWordCard entry={ENTRY} onGrade={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: /Hiện nghĩa/ }))
    fireEvent.click(screen.getByRole("button", { name: "Dễ" }))

    expect(screen.queryByRole("button", { name: "Dễ" })).not.toBeInTheDocument()
    expect(screen.getByText(/Đã chấm: Dễ/)).toBeInTheDocument()
  })
})
