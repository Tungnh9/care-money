import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { speakWord } from "../speak"

describe("speakWord", () => {
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

  it("cancels any in-progress utterance then speaks the word in English", () => {
    speakWord("university")

    expect(cancelSpy).toHaveBeenCalled()
    expect(speakSpy).toHaveBeenCalledTimes(1)
    const utterance = speakSpy.mock.calls[0][0]
    expect(utterance.text).toBe("university")
    expect(utterance.lang).toBe("en-US")
  })

  it("cancels before each call on rapid repeated calls", () => {
    speakWord("one")
    speakWord("two")

    expect(cancelSpy).toHaveBeenCalledTimes(2)
    expect(speakSpy).toHaveBeenCalledTimes(2)
  })

  it("does not throw when the browser has no Web Speech API support", () => {
    vi.unstubAllGlobals()

    expect(() => speakWord("university")).not.toThrow()
  })
})
