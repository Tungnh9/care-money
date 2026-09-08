import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"

import { OnThisDayCard } from "../../components/on-this-day-card"
import type { OnThisDayResult } from "../../journal-calculations"

describe("OnThisDayCard", () => {
  it("renders the label, date/time, mood and full text of the matched entry", () => {
    const result: OnThisDayResult = {
      label: "1 năm trước",
      entry: {
        id: 1,
        text: "Hôm nay trời đẹp, mình đi dạo công viên.",
        time: "20:15",
        date: "10/08",
        words: 8,
        mood: { emoji: "🙂", label: "Vui", tint: "#FFE0C7" },
      },
    }
    render(<OnThisDayCard result={result} />)

    expect(screen.getByText("1 năm trước, bạn đã viết")).toBeInTheDocument()
    expect(screen.getByText("10/08 · 20:15")).toBeInTheDocument()
    expect(screen.getByText("Vui")).toBeInTheDocument()
    expect(screen.getByText("🙂")).toBeInTheDocument()
    expect(
      screen.getByText("Hôm nay trời đẹp, mình đi dạo công viên.")
    ).toBeInTheDocument()
  })

  it("shows the full entry text without truncation, even when it's long", () => {
    const longText = "a".repeat(300)
    const result: OnThisDayResult = {
      label: "1 tháng trước",
      entry: { id: 1, text: longText, time: "08:00", date: "01/08", words: 1, mood: null },
    }
    render(<OnThisDayCard result={result} />)

    expect(screen.getByText(longText)).toBeInTheDocument()
  })

  it("falls back to a neutral emoji and no mood label when the entry has no mood", () => {
    const result: OnThisDayResult = {
      label: "1 tuần trước",
      entry: { id: 1, text: "Không có tâm trạng", time: "07:00", date: "03/08", words: 3, mood: null },
    }
    render(<OnThisDayCard result={result} />)

    expect(screen.getByText("📝")).toBeInTheDocument()
  })
})
