import { describe, it, expect } from "vitest"

import { nextId } from "../next-id"

describe("nextId", () => {
  it("returns 1 for an empty list", () => {
    expect(nextId([])).toBe(1)
  })

  it("returns the max existing id + 1", () => {
    expect(nextId([{ id: 3 }, { id: 1 }, { id: 7 }])).toBe(8)
  })

  it("never collides even if two items were added in the same millisecond", () => {
    expect(nextId([{ id: 5 }, { id: 5 }])).toBe(6)
  })
})
