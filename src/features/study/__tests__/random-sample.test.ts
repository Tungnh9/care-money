import { describe, it, expect } from "vitest"

import { sampleWithRng } from "../random-sample"

describe("sampleWithRng", () => {
  it("returns exactly n items with no duplicates, using the given rng", () => {
    const pool = Array.from({ length: 10 }, (_, i) => i)
    const result = sampleWithRng(pool, 5, Math.random)

    expect(result).toHaveLength(5)
    expect(new Set(result).size).toBe(5)
  })

  it("returns the whole list when n exceeds the pool size", () => {
    const pool = [1, 2, 3]
    const result = sampleWithRng(pool, 100, Math.random)

    expect(result).toHaveLength(3)
    expect(new Set(result).size).toBe(3)
  })

  it("returns an empty array when the pool is empty", () => {
    expect(sampleWithRng([], 5, Math.random)).toEqual([])
  })

  it("is deterministic when given a deterministic rng", () => {
    const pool = ["a", "b", "c", "d"]
    let seed = 0
    const rng = () => {
      seed += 1
      return (seed % 10) / 10
    }
    const first = sampleWithRng(pool, 4, rng)

    seed = 0
    const second = sampleWithRng(pool, 4, rng)

    expect(second).toEqual(first)
  })
})
