interface Profile {
  displayName: string
  greeting: string
}

interface Budget {
  amount: string
  cycleStart: string
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
  budget: Budget
  moods: Mood[]
  modules: ModuleToggle[]
}

const SETTINGS_STORAGE_KEY = "app-settings"

const DEFAULT_PROFILE: Profile = {
  displayName: "Tungnh2k1",
  greeting: "Chào buổi sáng, Tungnh2k1",
}

const DEFAULT_BUDGET: Budget = {
  amount: "20.000.000",
  cycleStart: "1",
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
  { key: "chuoingay", label: "Chuỗi ngày", hint: "Thẻ chuỗi ngày · chip ở đáy sidebar", on: true },
]

const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_PROFILE,
  budget: DEFAULT_BUDGET,
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

function getStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) }
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
  TINT_PALETTE,
  EMOJI_PICKER,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Profile,
  type Budget,
  type Mood,
  type ModuleToggle,
}
