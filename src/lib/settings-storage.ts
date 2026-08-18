interface Profile {
  displayName: string
  greeting: string
}

interface Mood {
  label: string
  emoji: string
  desc: string
  tint: string
  on: boolean
}

interface ModuleToggle {
  key: string
  label: string
  hint: string
  on: boolean
}

interface AppSettings {
  profile: Profile
  moods: Mood[]
  modules: ModuleToggle[]
}

const SETTINGS_STORAGE_KEY = "app-settings"

const DEFAULT_PROFILE: Profile = {
  displayName: "Tungnh2k1",
  greeting: "Chào buổi sáng, Tungnh2k1",
}

const DEFAULT_MOODS: Mood[] = [
  { label: "Tuyệt vời", emoji: "😄", desc: "Mọi thứ đều trôi chảy", tint: "#FFF0B8", on: true },
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt, nhẹ người", tint: "#FFE0C7", on: true },
  { label: "Bình yên", emoji: "😌", desc: "Thư thái, không vướng bận", tint: "#E7F6EF", on: true },
  { label: "Bình thường", emoji: "😐", desc: "Không vui cũng không buồn", tint: "#F2E9DC", on: true },
  { label: "Mệt", emoji: "😴", desc: "Cần nghỉ, thiếu năng lượng", tint: "#EAF1FE", on: true },
  { label: "Lo lắng", emoji: "😟", desc: "Có chuyện đang nghĩ", tint: "#F0ECFE", on: false },
  { label: "Buồn", emoji: "😔", desc: "Hôm nay hơi trũng", tint: "#E4E9F2", on: false },
  { label: "Căng thẳng", emoji: "😣", desc: "Áp lực, quá tải", tint: "#FDEBF2", on: false },
]

const DEFAULT_MODULES: ModuleToggle[] = [
  { key: "taichinh", label: "Tài chính", hint: "Mục trên sidebar · thẻ số dư ở Tổng quan", on: true },
  { key: "nhatky", label: "Nhật ký", hint: "Mục trên sidebar · thẻ nhật ký gần đây", on: true },
  { key: "hoctap", label: "Học tập", hint: "Mục trên sidebar · thẻ học hôm nay", on: true },
  { key: "muctieu", label: "Mục tiêu", hint: "Mục trên sidebar · thẻ mục tiêu tiết kiệm", on: true },
  { key: "tamtrang", label: "Tâm trạng", hint: "Chip tâm trạng trong màn Nhật ký", on: true },
]

const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_PROFILE,
  moods: DEFAULT_MOODS,
  modules: DEFAULT_MODULES,
}

const TINT_PALETTE = [
  "#FFF0B8",
  "#FFE0C7",
  "#E7F6EF",
  "#EAF1FE",
  "#F0ECFE",
  "#FDEBF2",
  "#F2E9DC",
  "#E4E9F2",
]

const EMOJI_PICKER = ["😄", "🙂", "😌", "😐", "😴", "😟", "😔", "😣", "🥳", "🤯", "🤒", "😍"]

function mergeModules(stored: ModuleToggle[] | undefined): ModuleToggle[] {
  // label/hint luôn lấy từ DEFAULT_MODULES (nguồn) — chỉ "on" lấy từ storage.
  // Nếu lưu cả object storage sẽ giữ nguyên bản cũ mãi mãi mỗi khi thêm/sửa module mới,
  // người đang dùng không bao giờ thấy module mới (vd. "chuoingay") xuất hiện.
  return DEFAULT_MODULES.map((def) => {
    const hit = stored?.find((m) => m.key === def.key)
    return hit ? { ...def, on: hit.on } : def
  })
}

function getStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed, modules: mergeModules(parsed.modules) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function setStoredSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export {
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_MODULES,
  TINT_PALETTE,
  EMOJI_PICKER,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Profile,
  type Mood,
  type ModuleToggle,
}
