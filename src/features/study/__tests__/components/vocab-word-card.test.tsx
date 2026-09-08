import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { VocabWordCard } from "../../components/vocab-word-card"
import type { VocabEntry } from "../../types"

const WITH_IMAGE: VocabEntry = {
  id: "v-0010",
  word: "university",
  pos: "n.",
  phonetic: "/ˌjuːnɪˈvɜːsəti/",
  meaning: "trường đại học",
  addedAt: "2026-08-11",
  image: "/assets/vocab/v-0010.jpg",
}

const NO_IMAGE: VocabEntry = {
  id: "v-0005",
  word: "talk about",
  pos: "v. phr.",
  phonetic: "/tɔːk əˈbaʊt/",
  meaning: "nói về",
  addedAt: "2026-08-11",
}

describe("VocabWordCard", () => {
  it("renders the entry's image with the word as alt text when entry.image is set", () => {
    render(<VocabWordCard entry={WITH_IMAGE} learned={false} onToggleLearned={vi.fn()} />)

    const img = screen.getByAltText("university") as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain("v-0010.jpg")
  })

  it("shows a placeholder (no broken image) when entry.image is not set", () => {
    render(<VocabWordCard entry={NO_IMAGE} learned={false} onToggleLearned={vi.fn()} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByTestId("vocab-image-placeholder")).toBeInTheDocument()
  })

  it("renders the word, phonetic, part of speech and meaning", () => {
    render(<VocabWordCard entry={WITH_IMAGE} learned={false} onToggleLearned={vi.fn()} />)

    expect(screen.getByText("university")).toBeInTheDocument()
    expect(screen.getByText("/ˌjuːnɪˈvɜːsəti/")).toBeInTheDocument()
    expect(screen.getByText("n.")).toBeInTheDocument()
    expect(screen.getByText("trường đại học")).toBeInTheDocument()
  })

  it("renders the example sentence only when present", () => {
    const { rerender } = render(
      <VocabWordCard entry={{ ...WITH_IMAGE, example: "I study at a university." }} learned={false} onToggleLearned={vi.fn()} />
    )
    expect(screen.getByText("I study at a university.")).toBeInTheDocument()

    rerender(<VocabWordCard entry={WITH_IMAGE} learned={false} onToggleLearned={vi.fn()} />)
    expect(screen.queryByText("I study at a university.")).not.toBeInTheDocument()
  })

  it("shows the unmarked tick with the mark-as-learned label when not learned", () => {
    render(<VocabWordCard entry={WITH_IMAGE} learned={false} onToggleLearned={vi.fn()} />)

    const button = screen.getByRole("button", { name: "Đánh dấu đã học" })
    expect(button).toHaveAttribute("aria-pressed", "false")
  })

  it("shows the marked tick with the unmark label when learned", () => {
    render(<VocabWordCard entry={WITH_IMAGE} learned={true} onToggleLearned={vi.fn()} />)

    const button = screen.getByRole("button", { name: "Bỏ đánh dấu đã học" })
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("calls onToggleLearned with the entry's id when the tick is clicked", () => {
    const onToggleLearned = vi.fn()
    render(<VocabWordCard entry={WITH_IMAGE} learned={false} onToggleLearned={onToggleLearned} />)

    fireEvent.click(screen.getByRole("button", { name: "Đánh dấu đã học" }))

    expect(onToggleLearned).toHaveBeenCalledWith("v-0010")
  })
})
