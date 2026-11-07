import {
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  parseFinanceState,
  type FinanceState,
} from "@/lib/finance/finance-storage"
import {
  JOURNAL_STORAGE_KEY,
  getStoredJournal,
  parseJournalState,
  type JournalState,
} from "@/lib/journal/journal-storage"
import { STUDY_STORAGE_KEY, getStoredStudy, parseStudyState, type StudyState } from "@/lib/study/study-storage"
import { BUDGET_STORAGE_KEY, getStoredBudget, parseBudgetState, type BudgetState } from "@/lib/budget/budget-storage"
import {
  NET_WORTH_HISTORY_KEY,
  getStoredNetWorthHistory,
  parseNetWorthHistory,
  type NetWorthHistory,
} from "@/lib/net-worth/net-worth-history-storage"
import {
  SETTINGS_STORAGE_KEY,
  getStoredSettings,
  parseAppSettings,
  type AppSettings,
} from "@/lib/settings/settings-storage"
import { WORK_STORAGE_KEY, getStoredWork, parseWorkState, type WorkState } from "@/lib/work/work-storage"
import {
  LIFE_PLAN_STORAGE_KEY,
  getStoredLifePlan,
  parseLifePlanState,
  type LifePlanState,
} from "@/lib/life-plan/life-plan-storage"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName } from "@/lib/goals/car-goal-storage"
import { dayKey } from "@/lib/date"

const EXPORT_VERSION = 1

interface ExportSnapshot {
  journal: JournalState
  finance: FinanceState
  study: StudyState
  settings: AppSettings
  budget: BudgetState
  netWorthHistory: NetWorthHistory
  work: WorkState
  lifePlan: LifePlanState
  goals: GoalsSnapshot
}

interface GoalsSnapshot {
  carFundName: string | null
}

// Bản nhập vào (file hoặc cloud) có thể thiếu `goals` nếu được tạo trước khi có mục này — lúc đó
// `goals` là undefined, nghĩa là "giữ nguyên liên kết đang có trên máy", khác với carFundName null
// ("không gắn quỹ nào").
type ImportedSnapshot = Omit<ExportSnapshot, "goals"> & { goals?: GoalsSnapshot }

// Mọi key mà 1 lần nạp bản sao ghi đè (Cài đặt → applySnapshot) — chụp lại chuỗi thô trước khi ghi để trả về
// nguyên trạng nếu 1 lần ghi giữa chừng lỗi, hay khi bấm "Hoàn tác". Cũng là phần dữ liệu mà dấu vân tay sao lưu
// (lib/backup) theo dõi. Thêm 1 lần ghi mới vào applySnapshot thì thêm key của nó vào đây.
const RESTORE_KEYS = [
  JOURNAL_STORAGE_KEY,
  FINANCE_STORAGE_KEY,
  STUDY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  BUDGET_STORAGE_KEY,
  NET_WORTH_HISTORY_KEY,
  WORK_STORAGE_KEY,
  LIFE_PLAN_STORAGE_KEY,
  CAR_GOAL_FUND_KEY,
]

// Toàn bộ dữ liệu trên máy này, đúng phần đi vào file xuất / bản đám mây. Chỉ gọi trên trình duyệt.
function readLocalSnapshot(): ExportSnapshot {
  return {
    journal: getStoredJournal(),
    finance: getStoredFinance(),
    study: getStoredStudy(),
    settings: getStoredSettings(),
    budget: getStoredBudget(),
    netWorthHistory: getStoredNetWorthHistory(),
    work: getStoredWork(),
    lifePlan: getStoredLifePlan(),
    goals: { carFundName: getCarGoalFundName() },
  }
}

// Máy chưa có gì người dùng tự nhập — máy mới, trình duyệt vừa bị xoá dữ liệu, hay vừa "Xoá toàn bộ". Chỉ đếm thứ
// người dùng nhập: cửa hàng vàng/bạc mặc định, cài đặt hay lịch sử tài sản (tự ghi mỗi ngày mở Tổng quan) không tính.
function isSnapshotEmpty(snapshot: ImportedSnapshot): boolean {
  const { journal, finance, study, budget, work, lifePlan } = snapshot
  return (
    journal.entries.length === 0 &&
    finance.savings.length === 0 &&
    finance.cards.length === 0 &&
    finance.gold.length === 0 &&
    finance.goldGifts.length === 0 &&
    finance.goldSales.length === 0 &&
    finance.silver.length === 0 &&
    finance.silverGifts.length === 0 &&
    finance.silverSales.length === 0 &&
    finance.invests.length === 0 &&
    study.learned.length === 0 &&
    budget.expenses.length === 0 &&
    budget.settlements.length === 0 &&
    !budget.salaries.some((salary) => salary.amount > 0) &&
    work.tasks.length === 0 &&
    work.standups.length === 0 &&
    lifePlan.notes.length === 0 &&
    lifePlan.plans.length === 0
  )
}

interface ExportPayload extends ExportSnapshot {
  version: typeof EXPORT_VERSION
  exportedAt: string
}

function buildExportPayload(snapshot: ExportSnapshot, exportedAt: string): ExportPayload {
  return { version: EXPORT_VERSION, exportedAt, ...snapshot }
}

function exportFileName(exportedAt: string): string {
  // Ngày theo giờ máy (như mọi chỗ khác trong app), không theo UTC: trước 7:00 sáng giờ Việt Nam,
  // exportedAt.slice(0, 10) còn là ngày hôm qua — 2 bản sao khác ngày có thể trùng tên.
  return `orange-banana-${dayKey(new Date(exportedAt))}.json`
}

// exportedAt: thời điểm bản sao được tạo (null nếu file sửa tay không có) — để hộp xác nhận cho
// người dùng thấy bản sắp thay dữ liệu trên máy cũ hay mới.
type ImportResult =
  { ok: true; data: ImportedSnapshot; summary: string; exportedAt: string | null } | { ok: false; error: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function parseGoalsSnapshot(value: unknown): GoalsSnapshot | undefined {
  if (!isObject(value)) return undefined
  const { carFundName } = value
  if (carFundName === null || typeof carFundName === "string") return { carFundName }
  return undefined
}

function parseImportPayload(raw: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: "File không phải JSON hợp lệ." }
  }

  if (!isObject(parsed) || parsed.version !== EXPORT_VERSION) {
    return { ok: false, error: "Không phải bản sao Orange Banana (thiếu version 1)." }
  }

  // Cùng 1 bộ parse với getStoredJournal — 1 bài null trong file sửa tay chỉ bị bỏ riêng nó, thay
  // vì được lưu rồi làm sập /journal và /overview ở mọi lần mở sau.
  const journal: JournalState = parseJournalState(parsed.journal)

  const finance: FinanceState = parseFinanceState(isObject(parsed.finance) ? parsed.finance : {})

  const study: StudyState = parseStudyState(isObject(parsed.study) ? parsed.study : {})

  const budget: BudgetState = parseBudgetState(isObject(parsed.budget) ? parsed.budget : {})

  // Field thêm sau (v1 chưa có) — backup cũ không có key này tự fallback về mảng rỗng, không
  // cần bump EXPORT_VERSION, giống cách "budget" đã được thêm trước đó.
  const netWorthHistory: NetWorthHistory = parseNetWorthHistory(parsed.netWorthHistory)

  // Cùng 1 bộ parse với getStoredSettings (lọc từng mood/tag, gộp module theo DEFAULT_MODULES) —
  // bản nhập vào không reload trang, nên phải sạch ngay trong bộ nhớ chứ không đợi lần đọc sau.
  const settings: AppSettings = parseAppSettings(parsed.settings)

  // Thêm sau (v1 chưa có) — bản sao cũ không có "work" thì về trống, giống budget/netWorthHistory.
  const work: WorkState = parseWorkState(parsed.work)

  // Cũng thêm sau như "work": bản sao cũ không có "lifePlan" thì về trống. Cùng 1 bộ parse với
  // getStoredLifePlan — ghi chép hay ảnh hỏng chỉ bị bỏ riêng nó, ghi chép trỏ tới kế hoạch không có trong
  // bản sao thì bỏ gắn. Bản sao chỉ mang mã ảnh; ảnh nằm trên Cloudinary nên khôi phục ở máy khác vẫn xem được.
  const lifePlan: LifePlanState = parseLifePlanState(parsed.lifePlan)

  const goals = parseGoalsSnapshot(parsed.goals)

  const data: ImportedSnapshot = { journal, finance, study, settings, budget, netWorthHistory, work, lifePlan, goals }
  const exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : null
  return { ok: true, data, summary: restoredSummary(data), exportedAt }
}

const UNCOUNTED_SECTIONS = "tiết kiệm, nợ thẻ, mục tiêu"

// Dòng tóm tắt sau khi tải lên / tải xuống / nhập file. Lần mua bạc đứng ngay sau vàng — tích lũy bạc thêm
// sau, trước đó dòng này không nhắc tới bạc nên người dùng không biết bạc đã được đồng bộ hay chưa.
function snapshotCounts(snapshot: ImportedSnapshot): string {
  return [
    `${snapshot.journal.entries.length} bài nhật ký`,
    `${snapshot.finance.gold.length} lần mua vàng`,
    `${snapshot.finance.silver.length} lần mua bạc`,
    `${snapshot.study.learned.length} từ đã học`,
  ].join(" · ")
}

function restoredSummary(snapshot: ImportedSnapshot): string {
  return `${snapshotCounts(snapshot)} · đã khôi phục ${UNCOUNTED_SECTIONS}`
}

function uploadedSummary(snapshot: ImportedSnapshot): string {
  return `${snapshotCounts(snapshot)} · đã tải lên ${UNCOUNTED_SECTIONS}`
}

// Dùng trong hộp xác nhận trước khi thay dữ liệu: đặt số liệu của bản sắp nạp cạnh số liệu trên
// máy, gồm cả khoản chi và quỹ tiết kiệm (2 thứ hay đổi nhất) mà snapshotCounts không đếm, và lần mua
// bạc — bản sao lưu từ trước khi có bạc sẽ hiện "0 lần mua bạc", để không lỡ tay xoá bạc đang có. Ghi chép
// và kế hoạch trang Plan cũng vậy: bản sao từ trước khi có trang này hiện "0 ghi chép Plan · 0 kế hoạch".
function restoreCounts(snapshot: ImportedSnapshot): string {
  return [
    `${snapshot.journal.entries.length} bài nhật ký`,
    `${snapshot.budget.expenses.length} khoản chi`,
    `${snapshot.finance.savings.length} quỹ tiết kiệm`,
    `${snapshot.finance.gold.length} lần mua vàng`,
    `${snapshot.finance.silver.length} lần mua bạc`,
    `${snapshot.study.learned.length} từ đã học`,
    `${snapshot.work.tasks.length} việc`,
    `${snapshot.lifePlan.notes.length} ghi chép Plan`,
    `${snapshot.lifePlan.plans.length} kế hoạch`,
  ].join(" · ")
}

export {
  EXPORT_VERSION,
  RESTORE_KEYS,
  buildExportPayload,
  exportFileName,
  isSnapshotEmpty,
  parseImportPayload,
  readLocalSnapshot,
  restoreCounts,
  uploadedSummary,
  type ExportPayload,
  type ExportSnapshot,
  type ImportResult,
  type ImportedSnapshot,
}
