import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useEffect } from "react"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useNetWorthHistory } from "@/lib/net-worth/use-net-worth-history"
import { NET_WORTH_HISTORY_KEY, getStoredNetWorthHistory, setStoredNetWorthHistory } from "@/lib/net-worth/net-worth-history-storage"

describe("useNetWorthHistory", () => {
  beforeEach(() => {
    window.localStorage.clear()
    // recordSnapshot ghi theo dayKey() của đồng hồ thật — ghim "hôm nay" để kết quả không đổi theo ngày
    // chạy, và test "replaces (not duplicates)…" không hỏng khi chạy vắt qua nửa đêm (2 lần
    // recordSnapshot rơi vào 2 ngày khác nhau thì thành 2 bản ghi).
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 25, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
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
    expect(result.current.history[0].date).toBe("2026-09-25")
    expect(getStoredNetWorthHistory()).toHaveLength(1)
  })

  it("replaces (not duplicates) today's snapshot when called again with different values", () => {
    // Lần gọi thứ 2 trong CÙNG 1 ngày với giá trị KHÁC phải ghi đè, không được cộng thêm bản
    // ghi mới — đây chính là cơ chế "tự sửa" cho trường hợp lần gọi đầu trong ngày mang giá trị
    // sai/chưa hydrate xong (net-worth-history-calculations.ts's appendSnapshot).
    const { result } = renderHook(() => useNetWorthHistory())

    act(() => {
      result.current.recordSnapshot(10_000_000, 5_000_000)
    })
    act(() => {
      result.current.recordSnapshot(20_000_000, 9_000_000)
    })

    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].net).toBe(20_000_000)
    expect(result.current.history[0].savingsTotal).toBe(9_000_000)
    expect(result.current.history[0].date).toBe("2026-09-25")
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
    expect(getStoredNetWorthHistory()[3]).toEqual({ date: "2026-09-25", net: 9_999_999, savingsTotal: 8_888_888 })
  })
})

describe("useNetWorthHistory — dữ liệu do tab khác ghi", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 8, 20, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("builds on a snapshot another tab recorded instead of overwriting it", async () => {
    const { result } = renderHook(() => useNetWorthHistory())
    await waitFor(() => expect(result.current.history).toEqual([]))

    act(() => {
      window.localStorage.setItem(
        NET_WORTH_HISTORY_KEY,
        JSON.stringify([{ date: "2026-09-19", net: 1, savingsTotal: 1 }])
      )
      window.dispatchEvent(new StorageEvent("storage", { key: NET_WORTH_HISTORY_KEY }))
    })
    expect(result.current.history).toHaveLength(1)

    act(() => {
      result.current.recordSnapshot(5, 5)
    })

    expect(getStoredNetWorthHistory()).toEqual([
      { date: "2026-09-19", net: 1, savingsTotal: 1 },
      { date: "2026-09-20", net: 5, savingsTotal: 5 },
    ])
  })
})
