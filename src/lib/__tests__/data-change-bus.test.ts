import { describe, it, expect, vi } from "vitest"

import { notifyDataChanged, onDataChanged } from "../data-change-bus"

describe("data-change-bus", () => {
  it("calls every registered listener when notified", () => {
    const a = vi.fn()
    const b = vi.fn()
    onDataChanged(a)
    onDataChanged(b)

    notifyDataChanged()

    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it("stops calling a listener after it unsubscribes, without affecting others", () => {
    const a = vi.fn()
    const b = vi.fn()
    const unsubscribeA = onDataChanged(a)
    onDataChanged(b)

    unsubscribeA()
    notifyDataChanged()

    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })

  it("calls a listener again on every notification", () => {
    const listener = vi.fn()
    onDataChanged(listener)

    notifyDataChanged()
    notifyDataChanged()

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
