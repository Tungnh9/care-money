import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"

import { useSettings } from "../../hooks/use-settings"
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, getStoredSettings } from "@/lib/settings-storage"

describe("useSettings", () => {
  beforeEach(() => {
    window.localStorage.clear()
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
