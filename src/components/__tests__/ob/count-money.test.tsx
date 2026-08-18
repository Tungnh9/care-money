import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, renderHook, act, screen } from "@testing-library/react"

import { useCountUp, CountMoney } from "@/components/ob/count-money"

describe("useCountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it("starts at 0 and settles on the target value", () => {
    const { result } = renderHook(() => useCountUp(1000, 400))

    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(1000)
  })

  it("skips animation when the target is 0", () => {
    const { result } = renderHook(() => useCountUp(0))

    expect(result.current).toBe(0)
  })

  it("jumps straight to the target when prefers-reduced-motion is set", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true })
    )

    const { result } = renderHook(() => useCountUp(1000, 400))

    expect(result.current).toBe(1000)
  })
})

describe("CountMoney", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the formatted money value once the animation settles", () => {
    render(<CountMoney value={20_000_000} />)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText(/20\.000\.000/)).toBeInTheDocument()
  })
})
