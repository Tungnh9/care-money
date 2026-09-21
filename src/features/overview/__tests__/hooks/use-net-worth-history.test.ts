import { describe, it, expect, beforeEach } from "vitest"
import { useEffect } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useNetWorthHistory } from "../../hooks/use-net-worth-history"
import { getStoredNetWorthHistory, setStoredNetWorthHistory } from "../../net-worth-history-storage"

describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts empty and records a snapshot for today", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
    expect(result.current.history[0].savingsTotal).toBe(5_000_000)
    expect(getStoredNetWorthHistory()).toHaveLength(1)
  })

  it("does not record a second snapshot for the same day", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })
    act(() => {
      result.current.recordSnapshot(20_000_000, 9_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(10_000_000)
  })

  it("preserves and appends to pre-existing history when a consumer calls recordSnapshot from its own mount effect", async () => {
    // Mô phỏng đúng cách overview-view.tsx dùng hook này: gọi recordSnapshot ngay trong
    // 1 useEffect KHÁC của chính component gọi — effect đó chạy CÙNG 1 lượt passive-effects
    // với effect hydrate bên trong hook này (thứ tự hook: useNetWorthHistory() trước, effect
    // của consumer sau). Đây là quy hồi test cho 1 bug thật đã tìm thấy: nếu recordSnapshot đọc
    // `history` qua closure của lượt render đó (rỗng, vì effect hydrate chưa kịp set) thay vì 1
    // ref cập nhật đồng bộ, nó sẽ ghi đè mất lịch sử THẬT vừa hydrate xong — cả trong state lẫn
    // localStorage — xuống còn đúng 1 bản ghi của "hôm nay" mỗi lần tải lại trang.
    setStoredNetWorthHistory([
      { date: "2026-09-18", net: 1, savingsTotal: 1 },
      { date: "2026-09-19", net: 2, savingsTotal: 2 },
      { date: "2026-09-20", net: 3, savingsTotal: 3 },
    ])

    const { result } = renderHook(() => {
      const api = useNetWorthHistory()
      const { recordSnapshot } = api
      useEffect(() => {
        recordSnapshot(9_999_999, 8_888_888)
      }, [recordSnapshot])
      return api
    })

    await waitFor(() => expect(result.current.history.length).toBeGreaterThan(0))

    expect(result.current.history).toHaveLength(4)
    expect(getStoredNetWorthHistory()).toHaveLength(4)
    expect(getStoredNetWorthHistory().slice(0, 3)).toEqual([
      { date: "2026-09-18", net: 1, savingsTotal: 1 },
      { date: "2026-09-19", net: 2, savingsTotal: 2 },
      { date: "2026-09-20", net: 3, savingsTotal: 3 },
    ])
  })
})
