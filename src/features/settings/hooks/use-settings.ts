"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_SETTINGS,
  TINT_PALETTE,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Budget,
  type Mood,
  type Profile,
} from "@/lib/settings-storage"

function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getStoredSettings())
  }, [])

  const persist = useCallback((next: AppSettings) => {
    setSettings(next)
    setStoredSettings(next)
  }, [])

  const updateProfile = useCallback(
    (profile: Partial<Profile>) => {
      persist({ ...settings, profile: { ...settings.profile, ...profile } })
    },
    [settings, persist]
  )

  const updateBudget = useCallback(
    (budget: Partial<Budget>) => {
      persist({ ...settings, budget: { ...settings.budget, ...budget } })
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
      persist({ ...settings, moods: settings.moods.filter((_, i) => i !== index) })
    },
    [settings, persist]
  )

  const addMood = useCallback(
    (mood: Omit<Mood, "tint" | "on">) => {
      const tint = TINT_PALETTE[settings.moods.length % TINT_PALETTE.length]
      persist({ ...settings, moods: [...settings.moods, { ...mood, tint, on: true }] })
    },
    [settings, persist]
  )

  return {
    settings,
    updateProfile,
    updateBudget,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    replaceSettings: persist,
  }
}

export { useSettings }
