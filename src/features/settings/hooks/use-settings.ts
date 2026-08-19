"use client"

import { useCallback, useEffect } from "react"
import { create } from "zustand"

import {
  DEFAULT_SETTINGS,
  TINT_PALETTE,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Mood,
  type Profile,
} from "@/lib/settings-storage"
import { toast } from "sonner"

interface SettingsStore {
  settings: AppSettings
  setSettings: (next: AppSettings) => void
}

const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (next) => {
    setStoredSettings(next)
    set({ settings: next })
  },
}))

function useSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const setSettings = useSettingsStore((s) => s.setSettings)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // Không gate "chỉ hydrate 1 lần": mỗi component mount (sidebar, settings,
    // tổng quan...) đều tự đồng bộ store dùng chung theo giá trị mới nhất.
    useSettingsStore.setState({ settings: getStoredSettings() })
  }, [])

  const persist = useCallback((next: AppSettings) => setSettings(next), [setSettings])

  const updateProfile = useCallback(
    (profile: Partial<Profile>) => {
      persist({ ...settings, profile: { ...settings.profile, ...profile } })
    },
    [settings, persist]
  )

  const toggleModule = useCallback(
    (index: number) => {
      persist({
        ...settings,
        modules: settings.modules.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [settings, persist]
  )

  const toggleMood = useCallback(
    (index: number) => {
      persist({
        ...settings,
        moods: settings.moods.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [settings, persist]
  )

  const removeMood = useCallback(
    (index: number) => {
      const label = settings.moods[index]?.label
      try {
        persist({ ...settings, moods: settings.moods.filter((_, i) => i !== index) })
        toast.success(label ? `Đã xoá tâm trạng "${label}"` : "Đã xoá tâm trạng")
      } catch {
        toast.error("Không thể xoá tâm trạng. Vui lòng thử lại.")
      }
    },
    [settings, persist]
  )

  const addMood = useCallback(
    (mood: Omit<Mood, "tint" | "on">) => {
      try {
        const tint = TINT_PALETTE[settings.moods.length % TINT_PALETTE.length]
        persist({ ...settings, moods: [...settings.moods, { ...mood, tint, on: true }] })
        toast.success(`Đã thêm tâm trạng "${mood.label}"`)
      } catch {
        toast.error(`Không thể thêm tâm trạng "${mood.label}". Vui lòng thử lại.`)
      }
    },
    [settings, persist]
  )

  return {
    settings,
    updateProfile,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    replaceSettings: persist,
  }
}

export { useSettings }
