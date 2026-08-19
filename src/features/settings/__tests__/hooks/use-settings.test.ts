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
})
