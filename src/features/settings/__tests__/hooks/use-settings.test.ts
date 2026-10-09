import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useSettings } from "../../hooks/use-settings"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, getStoredSettings } from "@/lib/settings-storage"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("useSettings", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.clearAllMocks()
  })

  it("seeds from defaults when localStorage is empty", async () => {
    const { result } = renderHook(() => useSettings())

    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))
  })

  it("updates the profile and persists it to localStorage", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.updateProfile({ displayName: "Tùng" })
    })

    expect(result.current.settings.profile.displayName).toBe("Tùng")
    expect(getStoredSettings().profile.displayName).toBe("Tùng")
  })

  it("toggles a module and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const wasOn = result.current.settings.modules[0].on

    act(() => {
      result.current.toggleModule(0)
    })

    expect(result.current.settings.modules[0].on).toBe(!wasOn)
    expect(getStoredSettings().modules[0].on).toBe(!wasOn)
  })

  it("adds a mood with a tint from the palette and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const countBefore = result.current.settings.moods.length

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳" })
    })

    expect(result.current.settings.moods).toHaveLength(countBefore + 1)
    const added = result.current.settings.moods.at(-1)
    expect(added).toMatchObject({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳", on: true })
    expect(getStoredSettings().moods).toHaveLength(countBefore + 1)
  })

  it("removes a mood and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const countBefore = result.current.settings.moods.length
    const removedLabel = result.current.settings.moods[0].label

    act(() => {
      result.current.removeMood(0)
    })

    expect(result.current.settings.moods).toHaveLength(countBefore - 1)
    expect(result.current.settings.moods.some((m) => m.label === removedLabel)).toBe(false)
    expect(getStoredSettings().moods).toHaveLength(countBefore - 1)
  })

  it("toggles a tag and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const wasOn = result.current.settings.tags[0].on

    act(() => {
      result.current.toggleTag(0)
    })

    expect(result.current.settings.tags[0].on).toBe(!wasOn)
    expect(getStoredSettings().tags[0].on).toBe(!wasOn)
  })

  it("shows a success toast naming the mood when addMood succeeds", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳" })
    })

    expect(toast.success).toHaveBeenCalledWith('Đã thêm tâm trạng "Hào hứng"')
  })

  it("shows an error toast and leaves state unchanged when addMood fails to persist", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const countBefore = result.current.settings.moods.length
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳" })
    })

    expect(toast.error).toHaveBeenCalledWith('Không thể thêm tâm trạng "Hào hứng". Vui lòng thử lại.')
    expect(result.current.settings.moods).toHaveLength(countBefore)
    setItemSpy.mockRestore()
  })

  it("shows a success toast naming the removed mood when removeMood succeeds", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const removedLabel = result.current.settings.moods[0].label

    act(() => {
      result.current.removeMood(0)
    })

    expect(toast.success).toHaveBeenCalledWith(`Đã xoá tâm trạng "${removedLabel}"`)
  })

  it("shows an error toast and leaves state unchanged when removeMood fails to persist", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const countBefore = result.current.settings.moods.length
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota exceeded")
    })

    act(() => {
      result.current.removeMood(0)
    })

    expect(toast.error).toHaveBeenCalledWith("Không thể xoá tâm trạng. Vui lòng thử lại.")
    expect(result.current.settings.moods).toHaveLength(countBefore)
    setItemSpy.mockRestore()
  })

  it("replaces the whole settings object and persists it, e.g. after restoring a backup", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    const restored = { ...DEFAULT_SETTINGS, profile: { ...DEFAULT_SETTINGS.profile, displayName: "Khôi phục" } }

    act(() => {
      result.current.replaceSettings(restored)
    })

    expect(result.current.settings).toEqual(restored)
    expect(getStoredSettings().profile.displayName).toBe("Khôi phục")
  })

  it("getStoredSettings falls back to defaults when localStorage has corrupted JSON", () => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, "{not valid json")

    expect(getStoredSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it("defaults a newly added mood's score to 3 (neutral)", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "Có việc đang mong chờ", emoji: "🥳" })
    })

    expect(result.current.settings.moods.at(-1)?.score).toBe(3)
  })

  it("dismisses an insight by id and persists it", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.dismissInsight("spending-anomaly-2026-09")
    })

    expect(result.current.settings.dismissedInsights).toEqual(["spending-anomaly-2026-09"])
    expect(getStoredSettings().dismissedInsights).toEqual(["spending-anomaly-2026-09"])
  })

  it("does not add the same insight id twice when dismissed more than once", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      result.current.dismissInsight("savings-forecast")
    })
    act(() => {
      result.current.dismissInsight("savings-forecast")
    })

    expect(result.current.settings.dismissedInsights).toEqual(["savings-forecast"])
  })

  it("reloads the shared settings when another tab changes them", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    act(() => {
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...DEFAULT_SETTINGS, profile: { displayName: "Tùng", greeting: "Chào buổi sáng, Tùng" } })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: SETTINGS_STORAGE_KEY }))
    })

    expect(result.current.settings.profile.displayName).toBe("Tùng")
  })

  it("keeps a module another tab turned off when this tab toggles a tag before it has re-read", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    const modules = DEFAULT_SETTINGS.modules.map((m, i) => (i === 0 ? { ...m, on: false } : m))
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, modules }))
    act(() => {
      result.current.toggleTag(0)
    })

    expect(getStoredSettings().modules[0].on).toBe(false)
    expect(getStoredSettings().tags[0].on).toBe(false)
  })

  it("toggles the module shown on screen after restoring a backup made before a newer module existed", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))

    // Bản sao lưu từ trước khi có module "chitieu": thiếu 1 module so với danh sách mặc định hiện tại.
    const olderModules = DEFAULT_SETTINGS.modules.filter((m) => m.key !== "chitieu")
    act(() => {
      result.current.replaceSettings({ ...DEFAULT_SETTINGS, modules: olderModules })
    })

    // Store phải bằng đúng thứ các thao tác ghi đọc ra — nếu không, chỉ số hàng trên màn hình
    // (lấy từ store) lệch với chỉ số trong storage (đã gộp đủ module mặc định).
    expect(result.current.settings.modules).toEqual(getStoredSettings().modules)

    const nhatkyRow = result.current.settings.modules.findIndex((m) => m.key === "nhatky")
    act(() => {
      result.current.toggleModule(nhatkyRow)
    })

    const modules = getStoredSettings().modules
    expect(modules.find((m) => m.key === "nhatky")?.on).toBe(false)
    expect(modules.find((m) => m.key === "chitieu")?.on).toBe(true)
  })

  it("refuses a mood whose name is already taken (ignoring case and spaces) and explains why", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))
    const countBefore = result.current.settings.moods.length

    act(() => {
      result.current.addMood({ label: " vui ", desc: "Trùng tên", emoji: "🥳" })
    })

    expect(toast.error).toHaveBeenCalledWith('Đã có tâm trạng tên "vui". Vui lòng chọn tên khác.')
    expect(toast.success).not.toHaveBeenCalled()
    expect(result.current.settings.moods).toHaveLength(countBefore)
    expect(getStoredSettings().moods).toHaveLength(countBefore)
  })

  it("checks the name against moods another tab just saved, not only this tab's copy", async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current.settings).toEqual(DEFAULT_SETTINGS))
    // Tab khác vừa thêm "Hào hứng" — chưa bắn sự kiện storage nên state của tab này chưa có.
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_SETTINGS,
        moods: [
          ...DEFAULT_SETTINGS.moods,
          { label: "Hào hứng", emoji: "🥳", desc: "", tint: "#FFF0B8", on: true, score: 3 },
        ],
      })
    )

    act(() => {
      result.current.addMood({ label: "Hào hứng", desc: "", emoji: "🥳" })
    })

    expect(toast.error).toHaveBeenCalledWith('Đã có tâm trạng tên "Hào hứng". Vui lòng chọn tên khác.')
    expect(getStoredSettings().moods.filter((m) => m.label === "Hào hứng")).toHaveLength(1)
  })
})
