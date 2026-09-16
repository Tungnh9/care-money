import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

import { useAttemptLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES } from "../use-attempt-lockout"

describe("useAttemptLockout", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts unlocked with the full number of attempts remaining", async () => {
    const { result } = renderHook(() => useAttemptLockout("test-lockout"))

    await waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))
    expect(result.current.isLocked).toBe(false)
  })

  it("decrements remaining attempts on each failure", async () => {
    const { result } = renderHook(() => useAttemptLockout("test-lockout"))
    await waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))

    act(() => result.current.registerFailure())

    expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS - 1)
    expect(result.current.isLocked).toBe(false)
  })

  it("locks once failures reach MAX_ATTEMPTS", async () => {
    const { result } = renderHook(() => useAttemptLockout("test-lockout"))
    await waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))

    act(() => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) result.current.registerFailure()
    })

    expect(result.current.isLocked).toBe(true)
    expect(result.current.remainingAttempts).toBe(0)
  })

  it("resets attempts and unlocks on success", async () => {
    const { result } = renderHook(() => useAttemptLockout("test-lockout"))
    await waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))

    act(() => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) result.current.registerFailure()
    })
    expect(result.current.isLocked).toBe(true)

    act(() => result.current.registerSuccess())

    expect(result.current.isLocked).toBe(false)
    expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS)
  })

  it("auto-unlocks once the lockout window elapses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { result } = renderHook(() => useAttemptLockout("test-lockout"))
    await vi.waitFor(() => expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS))

    act(() => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) result.current.registerFailure()
    })
    expect(result.current.isLocked).toBe(true)

    act(() => {
      vi.advanceTimersByTime(LOCKOUT_MINUTES * 60 * 1000 + 1)
    })

    expect(result.current.isLocked).toBe(false)
    expect(result.current.remainingAttempts).toBe(MAX_ATTEMPTS)
  })

  it("keeps separate lockout state for different storage keys", async () => {
    const login = renderHook(() => useAttemptLockout("login-lockout-test"))
    const reset = renderHook(() => useAttemptLockout("reset-lockout-test"))
    await waitFor(() => expect(login.result.current.remainingAttempts).toBe(MAX_ATTEMPTS))
    await waitFor(() => expect(reset.result.current.remainingAttempts).toBe(MAX_ATTEMPTS))

    act(() => {
      for (let i = 0; i < MAX_ATTEMPTS; i++) login.result.current.registerFailure()
    })

    expect(login.result.current.isLocked).toBe(true)
    expect(reset.result.current.isLocked).toBe(false)
    expect(reset.result.current.remainingAttempts).toBe(MAX_ATTEMPTS)
  })

  it("persists attempts across remounts via localStorage", async () => {
    const first = renderHook(() => useAttemptLockout("persist-lockout-test"))
    await waitFor(() => expect(first.result.current.remainingAttempts).toBe(MAX_ATTEMPTS))
    act(() => first.result.current.registerFailure())
    first.unmount()

    const second = renderHook(() => useAttemptLockout("persist-lockout-test"))

    await waitFor(() => expect(second.result.current.remainingAttempts).toBe(MAX_ATTEMPTS - 1))
  })
})
