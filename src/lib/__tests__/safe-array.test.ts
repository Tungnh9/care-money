import { describe, it, expect } from "vitest"
import { z } from "zod"

import { safeArray } from "../safe-array"

const schema = z.object({ id: z.number(), label: z.string().catch("") })

describe("safeArray", () => {
  it("returns an empty array when the value is not an array", () => {
    expect(safeArray(schema, "x")).toEqual([])
    expect(safeArray(schema, undefined)).toEqual([])
    expect(safeArray(schema, { id: 1 })).toEqual([])
  })

  it("drops only the elements that fail the schema, keeping the rest in order", () => {
    expect(safeArray(schema, [{ id: 1, label: "a" }, null, { label: "thiếu id" }, { id: 2, label: "b" }])).toEqual([
      { id: 1, label: "a" },
      { id: 2, label: "b" },
    ])
  })

  it("returns the parsed element: unknown fields dropped, .catch() fields filled in", () => {
    expect(safeArray(schema, [{ id: 1, extra: true }])).toEqual([{ id: 1, label: "" }])
  })
})
