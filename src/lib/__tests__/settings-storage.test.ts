import { describe, it, expect, beforeEach } from "vitest"

import {
  DEFAULT_MODULES,
  SETTINGS_STORAGE_KEY,
  getStoredSettings,
  setStoredSettings,
  DEFAULT_SETTINGS,
} from "../settings-storage"

describe("getStoredSettings", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("backfills a module added after the user's data was first saved", () => {
    // Giả lập bản lưu cũ chưa có module "muctieu" (thêm sau này).
    const oldModules = DEFAULT_MODULES.filter((m) => m.key !== "muctieu")
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, modules: oldModules })
    )

    const settings = getStoredSettings()

    const muctieu = settings.modules.find((m) => m.key === "muctieu")
    expect(muctieu).toBeDefined()
    expect(muctieu?.on).toBe(true)
    expect(settings.modules).toHaveLength(DEFAULT_MODULES.length)
  })

  it("keeps the user's on/off choice for a module that already exists in storage", () => {
    const modules = DEFAULT_MODULES.map((m) => (m.key === "taichinh" ? { ...m, on: false } : m))
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, modules })
    )

    const settings = getStoredSettings()

    expect(settings.modules.find((m) => m.key === "taichinh")?.on).toBe(false)
  })

  it("always uses the current label/hint copy, not whatever was frozen in storage", () => {
    const modules = DEFAULT_MODULES.map((m) =>
      m.key === "muctieu" ? { ...m, label: "Nhãn cũ", hint: "Gợi ý cũ" } : m
    )
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, modules })
    )

    const settings = getStoredSettings()

    const muctieu = settings.modules.find((m) => m.key === "muctieu")
    expect(muctieu?.label).toBe("Mục tiêu")
  })

  it("drops module keys that no longer exist in the source list", () => {
    const modules = [...DEFAULT_MODULES, { key: "obsolete", label: "Cũ", hint: "", on: true }]
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, modules })
    )

    const settings = getStoredSettings()

    expect(settings.modules.some((m) => m.key === "obsolete")).toBe(false)
  })

  it("round-trips through setStoredSettings without losing modules", () => {
    setStoredSettings(DEFAULT_SETTINGS)

    expect(getStoredSettings().modules).toEqual(DEFAULT_MODULES)
  })

  it("drops legacy fields no longer part of AppSettings (e.g. old budget) instead of carrying them forever", () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...DEFAULT_SETTINGS, budget: { amount: "20.000.000", cycleStart: "1" } })
    )

    const settings = getStoredSettings()

    expect(settings).not.toHaveProperty("budget")
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })
})
