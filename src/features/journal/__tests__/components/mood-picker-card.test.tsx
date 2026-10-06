import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import type { Mood } from "@/lib/settings-storage"
import { MoodPickerCard } from "../../components/mood-picker-card"

const MOODS: Mood[] = [
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt", tint: "#FFE0C7", on: true, score: 4 },
  { label: "Mệt", emoji: "😴", desc: "Thiếu năng lượng", tint: "#EAF1FE", on: true, score: 2 },
  { label: "Buồn", emoji: "😔", desc: "Hơi trũng", tint: "#E4E9F2", on: false, score: 1 },
]

describe("MoodPickerCard", () => {
  it("tells screen readers which chip is selected with aria-pressed", () => {
    render(<MoodPickerCard moods={MOODS} selected="Vui" onSelect={vi.fn()} />)

    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Vui")
    expect(screen.getByText("Mệt").closest("button")).toHaveAttribute("aria-pressed", "false")
  })

  it("does not show a switched-off mood when no entry needs it", () => {
    render(<MoodPickerCard moods={MOODS} selected="" onSelect={vi.fn()} />)

    expect(screen.queryByText("Buồn")).not.toBeInTheDocument()
  })

  it("still shows the edited entry's mood after it was switched off, selected and clearable", () => {
    const onSelect = vi.fn()
    const entryMood = { emoji: "😔", label: "Buồn", tint: "#E4E9F2", score: 1 }
    render(<MoodPickerCard moods={MOODS} selected="Buồn" onSelect={onSelect} entryMood={entryMood} />)

    const chip = screen.getByRole("button", { pressed: true })
    expect(chip).toHaveTextContent("Buồn")

    fireEvent.click(chip)
    expect(onSelect).toHaveBeenCalledWith("")
  })

  it("still shows the edited entry's mood after it was deleted from Settings", () => {
    const entryMood = { emoji: "🥳", label: "Phấn khích", tint: "#FFF0B8", score: 5 }
    render(<MoodPickerCard moods={MOODS} selected="Phấn khích" onSelect={vi.fn()} entryMood={entryMood} />)

    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("🥳Phấn khích")
  })

  it("does not repeat the entry's mood when it is still switched on", () => {
    const entryMood = { emoji: "🙂", label: "Vui", tint: "#FFE0C7", score: 4 }
    render(<MoodPickerCard moods={MOODS} selected="Vui" onSelect={vi.fn()} entryMood={entryMood} />)

    expect(screen.getAllByText("Vui")).toHaveLength(1)
  })
})
