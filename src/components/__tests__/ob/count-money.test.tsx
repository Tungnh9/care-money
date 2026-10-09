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

  it("still animates once the real value arrives after mounting at 0 (vd. dữ liệu từ localStorage nạp trễ)", () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 400), {
      initialProps: { target: 0 },
    })

    expect(result.current).toBe(0)

    rerender({ target: 2000 })
    // Vừa reset để bắt đầu đếm lại từ 0, chưa nhảy thẳng lên target.
    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe(2000)
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

  it("sizes the figure for the final amount from the first frame, so the text doesn't shrink while counting up", () => {
    render(<CountMoney value={1_234_567_890} />)

    // Đang đếm từ 0: chữ chỉ là "0 ₫" nhưng cỡ chữ đã tính cho "1.234.567.890 ₫" (15 ký tự) —
    // nếu đếm theo chuỗi đang hiện, chữ sẽ co nhỏ dần theo từng chữ số mới xuất hiện.
    expect(screen.getByText("0 ₫").style.getPropertyValue("--ob-figure-chars")).toBe("15")

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.getByText("1.234.567.890 ₫").style.getPropertyValue("--ob-figure-chars")).toBe("15")
  })
})
