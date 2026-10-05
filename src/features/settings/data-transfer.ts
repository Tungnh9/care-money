import { parseFinanceState, type FinanceState } from "@/features/finance/finance-storage"
import { parseJournalState, type JournalState } from "@/features/journal/journal-storage"
import { parseStudyState, type StudyState } from "@/features/study/study-storage"
import { parseBudgetState, type BudgetState } from "@/features/budget/budget-storage"
import { parseNetWorthHistory, type NetWorthHistory } from "@/features/overview/net-worth-history-storage"
import { DEFAULT_SETTINGS, type AppSettings, type Mood } from "@/lib/settings-storage"

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
  return `orange-banana-${exportedAt.slice(0, 10)}.json`
}

type ImportResult =
  | { ok: true; data: ImportedSnapshot; summary: string }
  | { ok: false; error: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
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

  const settingsOverride = isObject(parsed.settings) ? parsed.settings : {}
  const profileOverride = isObject(settingsOverride.profile) ? settingsOverride.profile : {}
  // Chỉ build đúng các field của AppSettings hiện tại — không spread nguyên settingsOverride,
  // để field cũ đã xoá khỏi type (vd. "budget") không theo file backup cũ sống lại.
  // Mood cũ lưu trước tính năng insight thiếu hẳn `score` — backfill 3 (trung tính) cho từng
  // phần tử thiếu, đúng quy tắc getStoredSettings() đã áp dụng. Không backfill ở đây thì mood
  // thiếu score sống thẳng vào state trong bộ nhớ (import không reload trang), và bài nhật ký
  // ghi trong phiên đó sẽ lưu `score: undefined` — bị JSON.stringify rụng mất vĩnh viễn.
  const rawMoods = ensureArray(settingsOverride.moods, DEFAULT_SETTINGS.moods)
  const moods = rawMoods.map((m: Partial<Mood>) => ({
    ...m,
    score: typeof m.score === "number" ? m.score : 3,
  })) as Mood[]

  const settings: AppSettings = {
    profile: { ...DEFAULT_SETTINGS.profile, ...profileOverride },
    moods,
    modules: ensureArray(settingsOverride.modules, DEFAULT_SETTINGS.modules),
    tags: ensureArray(settingsOverride.tags, DEFAULT_SETTINGS.tags),
    dismissedInsights: ensureArray(settingsOverride.dismissedInsights, DEFAULT_SETTINGS.dismissedInsights),
  }

  const goals = parseGoalsSnapshot(parsed.goals)

  const data: ImportedSnapshot = { journal, finance, study, settings, budget, netWorthHistory, goals }
  return { ok: true, data, summary: restoredSummary(data) }
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

export {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  uploadedSummary,
  type ExportPayload,
  type ExportSnapshot,
  type ImportResult,
}
