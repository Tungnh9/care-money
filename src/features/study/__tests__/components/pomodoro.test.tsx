import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { Pomodoro } from "../../components/pomodoro"

describe("Pomodoro", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
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

  it("carries the session count across a remount", () => {
    const { unmount } = render(<Pomodoro />)

    fireClickAndAdvance("Bắt đầu", 25 * 60 * 1000)
    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()

    unmount()
    render(<Pomodoro />)

    expect(screen.getByText("Đã xong 1 phiên hôm nay")).toBeInTheDocument()
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
