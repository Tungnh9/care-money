import { describe, it, expect } from "vitest"

import { dayKey, pickDaily, seedFrom } from "../daily-pick"

describe("dayKey", () => {
  it("formats as yyyy-mm-dd with zero-padded month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20")
  })
})

describe("seedFrom", () => {
  it("is deterministic for the same string", () => {
    expect(seedFrom("2026-08-14|vocab")).toBe(seedFrom("2026-08-14|vocab"))
  })

  it("differs for different strings", () => {
    expect(seedFrom("2026-08-14|vocab")).not.toBe(seedFrom("2026-08-15|vocab"))
  })
})

describe("pickDaily", () => {
  const list = Array.from({ length: 50 }, (_, i) => `item-${i}`)

  it("returns exactly n items when the list is large enough", () => {
    const picked = pickDaily(list, 5, "2026-08-14", "vocab")
    expect(picked).toHaveLength(5)
  })

  it("never picks the same item twice in one call", () => {
    const picked = pickDaily(list, 10, "2026-08-14", "vocab")
    expect(new Set(picked).size).toBe(picked.length)
  })

  it("returns the same picks for the same day and salt", () => {
    const first = pickDaily(list, 5, "2026-08-14", "vocab")
    const second = pickDaily(list, 5, "2026-08-14", "vocab")
    expect(second).toEqual(first)
  })

  it("returns different picks for a different day", () => {
    const day1 = pickDaily(list, 5, "2026-08-14", "vocab")
    const day2 = pickDaily(list, 5, "2026-08-15", "vocab")
    expect(day2).not.toEqual(day1)
  })

  it("returns different picks for a different salt on the same day", () => {
    const vocabPick = pickDaily(list, 5, "2026-08-14", "vocab")
    const grammarPick = pickDaily(list, 5, "2026-08-14", "grammar")
    expect(grammarPick).not.toEqual(vocabPick)
  })

  it("caps the result at the list length when n exceeds it", () => {
    const picked = pickDaily(list, 1000, "2026-08-14", "vocab")
    expect(picked).toHaveLength(list.length)
    expect(new Set(picked).size).toBe(list.length)
  })
})
