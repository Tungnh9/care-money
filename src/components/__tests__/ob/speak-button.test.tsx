import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

import { SpeakButton } from "@/components/ob/speak-button"

describe("SpeakButton", () => {
  let speakSpy: ReturnType<typeof vi.fn>
  let cancelSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    speakSpy = vi.fn()
    cancelSpy = vi.fn()
    vi.stubGlobal("speechSynthesis", { speak: speakSpy, cancel: cancelSpy })
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      vi.fn().mockImplementation((text: string) => ({ text, lang: "" }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("reads the word aloud when clicked", () => {
    render(<SpeakButton word="university" />)

    fireEvent.click(screen.getByRole("button", { name: "Phát âm từ" }))

    expect(cancelSpy).toHaveBeenCalled()
    expect(speakSpy).toHaveBeenCalledTimes(1)
    const utterance = speakSpy.mock.calls[0][0]
    expect(utterance.text).toBe("university")
    expect(utterance.lang).toBe("en-US")
  })

  it("renders a smaller icon when size is sm", () => {
    render(<SpeakButton word="university" size="sm" />)

    const icon = screen.getByRole("button", { name: "Phát âm từ" }).querySelector("svg")
    expect(icon).toHaveAttribute("width", "12")
  })

  it("defaults to the md icon size", () => {
    render(<SpeakButton word="university" />)

    const icon = screen.getByRole("button", { name: "Phát âm từ" }).querySelector("svg")
    expect(icon).toHaveAttribute("width", "16")
  })
})
