import { parseFinanceState, type FinanceState } from "@/features/finance/finance-storage"
import { parseJournalState, type JournalState } from "@/features/journal/journal-storage"
import { parseStudyState, type StudyState } from "@/features/study/study-storage"
import { parseBudgetState, type BudgetState } from "@/features/budget/budget-storage"
import { parseNetWorthHistory, type NetWorthHistory } from "@/features/overview/net-worth-history-storage"
import { parseAppSettings, type AppSettings } from "@/lib/settings-storage"
import { dayKey } from "@/lib/date"

const EXPORT_VERSION = 1

interface ExportSnapshot {
  journal: JournalState
  finance: FinanceState
  study: StudyState
  settings: AppSettings
  budget: BudgetState
  netWorthHistory: NetWorthHistory
  goals: GoalsSnapshot
}

interface GoalsSnapshot {
  carFundName: string | null
}

// Bản nhập vào (file hoặc cloud) có thể thiếu `goals` nếu được tạo trước khi có mục này — lúc đó
// `goals` là undefined, nghĩa là "giữ nguyên liên kết đang có trên máy", khác với carFundName null
// ("không gắn quỹ nào").
type ImportedSnapshot = Omit<ExportSnapshot, "goals"> & { goals?: GoalsSnapshot }

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
  | { ok: true; data: ImportedSnapshot; summary: string; exportedAt: string | null }
  | { ok: false; error: string }

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

  const goals = parseGoalsSnapshot(parsed.goals)

  const data: ImportedSnapshot = { journal, finance, study, settings, budget, netWorthHistory, goals }
  const exportedAt = typeof parsed.exportedAt === "string" ? parsed.exportedAt : null
  return { ok: true, data, summary: restoredSummary(data), exportedAt }
}

const UNCOUNTED_SECTIONS = "tiết kiệm, nợ thẻ, mục tiêu"

function snapshotCounts(snapshot: ImportedSnapshot): string {
  return `${snapshot.journal.entries.length} bài nhật ký · ${snapshot.finance.gold.length} lần mua vàng · ${snapshot.study.learned.length} từ đã học`
}

function restoredSummary(snapshot: ImportedSnapshot): string {
  return `${snapshotCounts(snapshot)} · đã khôi phục ${UNCOUNTED_SECTIONS}`
}

function uploadedSummary(snapshot: ImportedSnapshot): string {
  return `${snapshotCounts(snapshot)} · đã tải lên ${UNCOUNTED_SECTIONS}`
}

// Dùng trong hộp xác nhận trước khi thay dữ liệu: đặt số liệu của bản sắp nạp cạnh số liệu trên
// máy, gồm cả khoản chi và quỹ tiết kiệm (2 thứ hay đổi nhất) mà snapshotCounts không đếm.
function restoreCounts(snapshot: ImportedSnapshot): string {
  return [
    `${snapshot.journal.entries.length} bài nhật ký`,
    `${snapshot.budget.expenses.length} khoản chi`,
    `${snapshot.finance.savings.length} quỹ tiết kiệm`,
    `${snapshot.finance.gold.length} lần mua vàng`,
    `${snapshot.study.learned.length} từ đã học`,
  ].join(" · ")
}

export {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  restoreCounts,
  uploadedSummary,
  type ExportPayload,
  type ExportSnapshot,
  type ImportResult,
  type ImportedSnapshot,
}
