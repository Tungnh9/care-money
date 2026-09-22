import { notifyDataChanged } from "./data-change-bus"

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
  score: number // 1 (rất tệ) – 5 (rất tốt), dùng để tính tương quan chi tiêu-tâm trạng
}

interface ModuleToggle {
  key: string
  label: string
  hint: string
  on: boolean
}

interface BudgetTag {
  label: string
  emoji: string
  desc: string
  tint: string
  on: boolean
}

interface AppSettings {
  profile: Profile
  moods: Mood[]
  modules: ModuleToggle[]
  tags: BudgetTag[]
  dismissedInsights: string[]
}

const SETTINGS_STORAGE_KEY = "app-settings"

const DEFAULT_PROFILE: Profile = {
  displayName: "Tungnh2k1",
  greeting: "Chào buổi sáng, Tungnh2k1",
}

const DEFAULT_MOODS: Mood[] = [
  { label: "Tuyệt vời", emoji: "😄", desc: "Mọi thứ đều trôi chảy", tint: "#FFF0B8", on: true, score: 5 },
  { label: "Vui", emoji: "🙂", desc: "Tâm trạng tốt, nhẹ người", tint: "#FFE0C7", on: true, score: 4 },
  { label: "Bình yên", emoji: "😌", desc: "Thư thái, không vướng bận", tint: "#E7F6EF", on: true, score: 4 },
  { label: "Bình thường", emoji: "😐", desc: "Không vui cũng không buồn", tint: "#F2E9DC", on: true, score: 3 },
  { label: "Mệt", emoji: "😴", desc: "Cần nghỉ, thiếu năng lượng", tint: "#EAF1FE", on: true, score: 2 },
  { label: "Lo lắng", emoji: "😟", desc: "Có chuyện đang nghĩ", tint: "#F0ECFE", on: false, score: 2 },
  { label: "Buồn", emoji: "😔", desc: "Hôm nay hơi trũng", tint: "#E4E9F2", on: false, score: 1 },
  { label: "Căng thẳng", emoji: "😣", desc: "Áp lực, quá tải", tint: "#FDEBF2", on: false, score: 1 },
]

const DEFAULT_MODULES: ModuleToggle[] = [
  { key: "taichinh", label: "Tài chính", hint: "Mục trên sidebar · thẻ số dư ở Tổng quan", on: true },
  { key: "chitieu", label: "Chi tiêu", hint: "Mục trên sidebar · thẻ chi tiêu ở Tổng quan", on: true },
  { key: "nhatky", label: "Nhật ký", hint: "Mục trên sidebar · thẻ nhật ký gần đây", on: true },
  { key: "hoctap", label: "Học tập", hint: "Mục trên sidebar · thẻ học hôm nay", on: true },
  { key: "muctieu", label: "Mục tiêu", hint: "Mục trên sidebar · thẻ mục tiêu tiết kiệm", on: true },
  { key: "tamtrang", label: "Tâm trạng", hint: "Chip tâm trạng trong màn Nhật ký", on: true },
]

const DEFAULT_TAGS: BudgetTag[] = [
  { label: "Tiền trọ", emoji: "🏠", desc: "Tiền nhà, tiền phòng hàng tháng", tint: "#FFF0B8", on: true },
  { label: "Trả nợ thẻ", emoji: "🏦", desc: "Thanh toán dư nợ thẻ tín dụng", tint: "#FFE0C7", on: true },
  { label: "Mua sắm", emoji: "🛍️", desc: "Quần áo, đồ dùng, linh tinh", tint: "#E7F6EF", on: true },
  { label: "Xăng xe", emoji: "⛽", desc: "Đổ xăng, gửi xe, đi lại", tint: "#EAF1FE", on: true },
  { label: "Hẹn hò", emoji: "❤️", desc: "Đi chơi, ăn uống cùng người yêu", tint: "#FDEBF2", on: true },
  { label: "Ăn uống", emoji: "🍔", desc: "Ăn ngoài, đồ ăn nhanh, giao đồ ăn", tint: "#F0ECFE", on: true },
  { label: "Điện thoại", emoji: "📱", desc: "Cước điện thoại, mua sắm thiết bị", tint: "#E4E9F2", on: true },
  { label: "Quà tặng", emoji: "🎁", desc: "Quà sinh nhật, lễ tết, cưới hỏi", tint: "#FFF0B8", on: true },
  { label: "Sức khoẻ", emoji: "💊", desc: "Thuốc men, khám bệnh", tint: "#FFE0C7", on: true },
  { label: "Giải trí", emoji: "🎬", desc: "Xem phim, chơi game", tint: "#E7F6EF", on: true },
  { label: "Cà phê", emoji: "☕", desc: "Cà phê, trà sữa, đồ uống", tint: "#EAF1FE", on: true },
]

const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_PROFILE,
  moods: DEFAULT_MOODS,
  modules: DEFAULT_MODULES,
  tags: DEFAULT_TAGS,
  dismissedInsights: [],
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
    // Chỉ đọc đúng các field của AppSettings hiện tại — không spread nguyên `parsed`,
    // để field cũ đã xoá khỏi type (vd. "budget") tự rụng thay vì sống mãi trong storage.
    const profile =
      parsed.profile && typeof parsed.profile === "object"
        ? { ...DEFAULT_SETTINGS.profile, ...parsed.profile }
        : DEFAULT_SETTINGS.profile
    // Mood cũ lưu trước tính năng insight thiếu hẳn `score` — backfill 3 (trung tính) cho
    // từng phần tử thiếu, không làm mất cả mảng như 1 validate toàn phần sẽ làm.
    const rawMoods = Array.isArray(parsed.moods) ? parsed.moods : DEFAULT_SETTINGS.moods
    const moods = rawMoods.map((m: Partial<Mood>) => ({
      ...m,
      score: typeof m.score === "number" ? m.score : 3,
    })) as Mood[]
    const tags = Array.isArray(parsed.tags) ? parsed.tags : DEFAULT_SETTINGS.tags
    const dismissedInsights = Array.isArray(parsed.dismissedInsights) ? parsed.dismissedInsights : []
    return { profile, moods, modules: mergeModules(parsed.modules), tags, dismissedInsights }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function setStoredSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  notifyDataChanged()
}

export {
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_MODULES,
  DEFAULT_TAGS,
  TINT_PALETTE,
  EMOJI_PICKER,
  getStoredSettings,
  setStoredSettings,
  type AppSettings,
  type Profile,
  type Mood,
  type ModuleToggle,
  type BudgetTag,
}
