import { z } from "zod"

import { notifyDataChanged } from "./data-change-bus"
import { safeArray } from "./safe-array"

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

// Mọi phần tử mood/tag đi qua schema riêng: phần tử hỏng (vd. null trong 1 file sao lưu sửa tay)
// chỉ bị bỏ riêng nó — trước đây 1 mood null làm getStoredSettings ném lỗi rồi rơi về
// DEFAULT_SETTINGS (mất luôn hồ sơ, nhãn, module), còn 1 tag null lọt vào làm TagsCard sập.
// Field phụ thiếu thì điền mặc định; label/emoji là định danh nên bắt buộc.
const moodSchema: z.ZodType<Mood> = z.object({
  label: z.string(),
  emoji: z.string(),
  desc: z.string().catch(""),
  tint: z.string().catch(TINT_PALETTE[0]),
  on: z.boolean().catch(true),
  // Mood cũ lưu trước tính năng insight thiếu hẳn `score` — điền 3 (trung tính).
  score: z.number().catch(3),
})

const tagSchema: z.ZodType<BudgetTag> = z.object({
  label: z.string(),
  emoji: z.string(),
  desc: z.string().catch(""),
  tint: z.string().catch(TINT_PALETTE[0]),
  on: z.boolean().catch(true),
})

// mergeModules chỉ lấy key/on từ bản lưu — label/hint luôn theo DEFAULT_MODULES.
const storedModuleSchema = z.object({ key: z.string(), on: z.boolean() })

function mergeModules(stored: Pick<ModuleToggle, "key" | "on">[]): ModuleToggle[] {
  // label/hint luôn lấy từ DEFAULT_MODULES (nguồn) — chỉ "on" lấy từ storage.
  // Nếu lưu cả object storage sẽ giữ nguyên bản cũ mãi mãi mỗi khi thêm/sửa module mới,
  // người đang dùng không bao giờ thấy module mới (vd. "chuoingay") xuất hiện.
  return DEFAULT_MODULES.map((def) => {
    const hit = stored.find((m) => m.key === def.key)
    return hit ? { ...def, on: hit.on } : def
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

// Dùng chung cho đọc localStorage và cho data-transfer.ts (nhập file / tải xuống từ cloud), để 2
// đường vào luôn cùng 1 quy tắc — bản nhập vào không reload trang nên phải sạch ngay trong bộ nhớ.
// Chỉ đọc đúng các field của AppSettings hiện tại — field cũ đã xoá khỏi type (vd. "budget") tự
// rụng thay vì sống mãi trong storage.
function parseAppSettings(value: unknown): AppSettings {
  const parsed = isRecord(value) ? value : {}
  const rawProfile = isRecord(parsed.profile) ? parsed.profile : {}
  const profile: Profile = {
    displayName: typeof rawProfile.displayName === "string" ? rawProfile.displayName : DEFAULT_PROFILE.displayName,
    greeting: typeof rawProfile.greeting === "string" ? rawProfile.greeting : DEFAULT_PROFILE.greeting,
  }
  return {
    profile,
    moods: Array.isArray(parsed.moods) ? safeArray(moodSchema, parsed.moods) : DEFAULT_MOODS,
    modules: mergeModules(safeArray(storedModuleSchema, parsed.modules)),
    tags: Array.isArray(parsed.tags) ? safeArray(tagSchema, parsed.tags) : DEFAULT_TAGS,
    dismissedInsights: Array.isArray(parsed.dismissedInsights)
      ? parsed.dismissedInsights.filter((id): id is string => typeof id === "string")
      : [],
  }
}

function getStoredSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return parseAppSettings(JSON.parse(raw))
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
  parseAppSettings,
  type AppSettings,
  type Profile,
  type Mood,
  type ModuleToggle,
  type BudgetTag,
}
