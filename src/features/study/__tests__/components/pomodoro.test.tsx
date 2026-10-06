import { StrictMode } from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { Pomodoro } from "../../components/pomodoro"
import { POMODORO_STORAGE_KEY } from "../../pomodoro-storage"

describe("Pomodoro", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 29, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts at 25:00 in work mode with no sessions yet", () => {
    const { container } = render(<Pomodoro />)

    expect(screen.getByText("25:00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument()
    expect(screen.getByText("Chưa có phiên nào hôm nay")).toBeInTheDocument()
    expect(container.querySelector('[data-pose="sleep"]')).toBeInTheDocument()
  })

  it("shows the focus mascot while running, and the banana mascot on break", () => {
    const { container } = render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 1000)
    expect(container.querySelector('[data-pose="focus"]')).toBeInTheDocument()

    fireClickAndAdvance("Sang nghỉ 5 phút", 0)
    expect(container.querySelector('[data-pose="banana"]')).toBeInTheDocument()
  })

  it("counts down once started, and can be paused", () => {
    render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 1000)
    expect(screen.getByText("24:59")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tạm dừng" })).toBeInTheDocument()

    act(() => {
      screen.getByRole("button", { name: "Tạm dừng" }).click()
    })
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText("24:59")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Bắt đầu" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeInTheDocument()
  })

  it("resets back to the full duration and stops running", () => {
    render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 3000)
    expect(screen.getByText("24:57")).toBeInTheDocument()

    act(() => {
      screen.getByRole("button", { name: "Đặt lại" }).click()
    })

    expect(screen.getByText("25:00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument()
  })

  it("switches between work and break mode manually", () => {
    render(<Pomodoro />)

    act(() => {
      screen.getByRole("button", { name: "Sang nghỉ 5 phút" }).click()
    })

    expect(screen.getByText("05:00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sang học 25 phút" })).toBeInTheDocument()
  })

  it("switches to break and counts a session once the work timer runs out", () => {
    render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)

    expect(screen.getByText("05:00")).toBeInTheDocument()
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Bắt đầu" })).toBeInTheDocument()
  })

  it("keeps counting down the running timer across a remount, accounting for time elapsed while away", () => {
    const { unmount } = render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 10_000)
    expect(screen.getByText("24:50")).toBeInTheDocument()

    unmount()
    act(() => {
      vi.advanceTimersByTime(20_000)
    })

    render(<Pomodoro />)

    expect(screen.getByText("24:30")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tạm dừng" })).toBeInTheDocument()
  })

  it("does not advance a paused timer across a remount", () => {
    const { unmount } = render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 3000)
    act(() => {
      screen.getByRole("button", { name: "Tạm dừng" }).click()
    })

    unmount()
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    render(<Pomodoro />)

    expect(screen.getByText("24:57")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tiếp tục" })).toBeInTheDocument()
  })

  it("resumes from the paused time after a long pause", () => {
    render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 5000)
    expect(screen.getByText("24:55")).toBeInTheDocument()

    act(() => {
      screen.getByRole("button", { name: "Tạm dừng" }).click()
    })
    // Dừng 10 phút thật — đồng hồ trôi nhưng bộ đếm đang tạm dừng thì không được trôi theo.
    vi.setSystemTime(Date.now() + 10 * 60 * 1000)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText("24:55")).toBeInTheDocument()

    fireClickAndAdvance("Tiếp tục", 1000)

    expect(screen.getByText("24:54")).toBeInTheDocument()
  })

  it("carries the session count across a remount", () => {
    const { unmount } = render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()

    unmount()
    render(<Pomodoro />)

    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
  })

  it("catches up with the real clock when the browser throttled the ticks of a hidden tab", () => {
    render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 1000)
    expect(screen.getByText("24:59")).toBeInTheDocument()

    // Tab ẩn: 10 phút thật trôi qua mà setInterval không được chạy lần nào (Chrome bóp nhịp, điện
    // thoại khoá màn hình) — setSystemTime dời đồng hồ mà không bắn timer nào.
    vi.setSystemTime(Date.now() + 10 * 60 * 1000)
    act(() => {
      vi.advanceTimersByTime(1000) // đúng 1 tick
    })

    expect(screen.getByText("14:58")).toBeInTheDocument()
  })

  it("shows the right time as soon as the tab becomes visible again, without waiting for a tick", () => {
    render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 1000)

    vi.setSystemTime(Date.now() + 5 * 60 * 1000)
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(screen.getByText("19:59")).toBeInTheDocument()
  })

  it("switches to break once the real clock passes the end of the session, even if only one tick fires", () => {
    render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 1000)

    vi.setSystemTime(Date.now() + 30 * 60 * 1000)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText("05:00")).toBeInTheDocument()
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
  })

  it("counts one finished session as one, even under React Strict Mode", () => {
    render(
      <StrictMode>
        <Pomodoro />
      </StrictMode>
    )

    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)

    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
  })

  it("starts a new day with no sessions counted, then counts that day's first session as 1", () => {
    vi.setSystemTime(new Date(2026, 8, 28, 9, 0))
    const { unmount } = render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
    unmount()

    vi.setSystemTime(new Date(2026, 8, 29, 9, 0))
    render(<Pomodoro />)
    expect(screen.getByText("Chưa có phiên nào hôm nay")).toBeInTheDocument()

    // Phiên hôm qua kết thúc ở chế độ nghỉ — quay lại học rồi xong 1 phiên mới của hôm nay.
    fireClickAndAdvance("Sang học 25 phút", 0)
    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
  })

  it("does not count a session that finished yesterday while the page was closed as one of today's", () => {
    vi.setSystemTime(new Date(2026, 8, 28, 23, 0))
    const { unmount } = render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 1000)
    unmount()

    vi.setSystemTime(new Date(2026, 8, 29, 9, 0))
    render(<Pomodoro />)

    // Phiên hết giờ lúc 23:25 ngày 28 — là phiên của hôm qua.
    expect(screen.getByText("05:00")).toBeInTheDocument()
    expect(screen.getByText("Chưa có phiên nào hôm nay")).toBeInTheDocument()
  })

  it("counts a session that ends after midnight for the new day", () => {
    vi.setSystemTime(new Date(2026, 8, 28, 23, 30))
    render(<Pomodoro />)
    fireClickAndAdvance("Bắt đầu", 1000)

    // Tab ẩn qua nửa đêm: phiên thật ra hết giờ lúc 23:55 ngày 28, nhưng chỉ phát hiện ra lúc 00:10 ngày 29.
    vi.setSystemTime(new Date(2026, 8, 29, 0, 10))
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(screen.getByText("05:00")).toBeInTheDocument()
    expect(screen.getByText("Chưa có phiên nào hôm nay")).toBeInTheDocument()
  })

  it("keeps the time of a timer saved before sessions were tied to a day, but not its stale session count", () => {
    window.localStorage.setItem(
      POMODORO_STORAGE_KEY,
      JSON.stringify({ mode: "work", left: 600, running: false, rounds: 4, updatedAt: 0 })
    )

    render(<Pomodoro />)

    expect(screen.getByText("10:00")).toBeInTheDocument()
    expect(screen.getByText("Chưa có phiên nào hôm nay")).toBeInTheDocument()
  })
})

function fireClickAndAdvance(buttonName: string, ms: number) {
  act(() => {
    screen.getByRole("button", { name: buttonName }).click()
  })
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}
