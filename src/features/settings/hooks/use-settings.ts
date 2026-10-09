"use client"

import { useCallback, useEffect } from "react"
import { create } from "zustand"

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  TINT_PALETTE,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Mood,
  type Profile,
} from "@/lib/settings-storage"
import { useStorageSync } from "@/lib/use-storage-sync"
import { toast } from "sonner"

interface SettingsStore {
  settings: AppSettings
  setSettings: (next: AppSettings) => void
}

const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (next) => {
    setStoredSettings(next)
    // Nạp lại từ storage thay vì đặt thẳng `next`: getStoredSettings() chuẩn hoá dữ liệu (vd. gộp
    // đủ module mặc định theo đúng thứ tự khi bản nhập từ file cũ còn thiếu module) và mọi thao
    // tác ghi bên dưới dựng từ chính bản đọc đó — store phải bằng đúng thứ chúng đọc, nếu không
    // chỉ số hàng trên màn hình (lấy từ store) lệch với chỉ số trong storage.
    set({ settings: getStoredSettings() })
  },
}))

// Hàm cấp module (không phải closure) nên luôn ổn định — useStorageSync không phải đăng ký lại
// mỗi lần render. Chỉ đọc storage rồi nạp vào store dùng chung, không ghi gì.
function reloadSettingsFromStorage() {
  useSettingsStore.setState({ settings: getStoredSettings() })
}

function useSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const setSettings = useSettingsStore((s) => s.setSettings)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // Không gate "chỉ hydrate 1 lần": mỗi component mount (sidebar, settings,
    // tổng quan...) đều tự đồng bộ store dùng chung theo giá trị mới nhất.
    reloadSettingsFromStorage()
  }, [])

  // Tab khác đổi cài đặt (hay 1 lần nhập file/tải xuống) → nạp lại store dùng chung.
  useStorageSync(SETTINGS_STORAGE_KEY, reloadSettingsFromStorage)

  const persist = useCallback((next: AppSettings) => setSettings(next), [setSettings])

  // Mọi thao tác ghi dựng từ getStoredSettings() đọc tươi, không từ `settings` của lần render
  // hiện tại — tab khác có thể vừa đổi module/mood/nhãn mà tab này chưa kịp nhận sự kiện.

  const updateProfile = useCallback(
    (profile: Partial<Profile>) => {
      const current = getStoredSettings()
      persist({ ...current, profile: { ...current.profile, ...profile } })
    },
    [persist]
  )

  const toggleModule = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        modules: current.modules.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [persist]
  )

  const toggleMood = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        moods: current.moods.map((m, i) => (i === index ? { ...m, on: !m.on } : m)),
      })
    },
    [persist]
  )

  const removeMood = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      const label = current.moods[index]?.label
      try {
        persist({ ...current, moods: current.moods.filter((_, i) => i !== index) })
        toast.success(label ? `Đã xoá tâm trạng "${label}"` : "Đã xoá tâm trạng")
      } catch {
        toast.error("Không thể xoá tâm trạng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const addMood = useCallback(
    (mood: Omit<Mood, "tint" | "on" | "score">) => {
      const current = getStoredSettings()
      // Nhật ký nhận diện mood bằng tên — 2 mood trùng tên thì chip mới không bao giờ chọn riêng được
      // (bài lưu luôn lấy mood đầu tiên). So không phân biệt hoa/thường, sau khi bỏ dấu cách 2 đầu.
      const label = mood.label.trim()
      if (current.moods.some((m) => m.label.trim().toLowerCase() === label.toLowerCase())) {
        toast.error(`Đã có tâm trạng tên "${label}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        const tint = TINT_PALETTE[current.moods.length % TINT_PALETTE.length]
        persist({ ...current, moods: [...current.moods, { ...mood, tint, on: true, score: 3 }] })
        toast.success(`Đã thêm tâm trạng "${mood.label}"`)
      } catch {
        toast.error(`Không thể thêm tâm trạng "${mood.label}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const toggleTag = useCallback(
    (index: number) => {
      const current = getStoredSettings()
      persist({
        ...current,
        tags: current.tags.map((t, i) => (i === index ? { ...t, on: !t.on } : t)),
      })
    },
    [persist]
  )

  const dismissInsight = useCallback(
    (id: string) => {
      const current = getStoredSettings()
      if (current.dismissedInsights.includes(id)) return
      persist({ ...current, dismissedInsights: [...current.dismissedInsights, id] })
    },
    [persist]
  )

  return {
    settings,
    updateProfile,
    toggleModule,
    toggleMood,
    removeMood,
    addMood,
    toggleTag,
    dismissInsight,
    replaceSettings: persist,
  }
}

export { useSettings }
