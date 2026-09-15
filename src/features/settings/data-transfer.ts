import { parseFinanceState, type FinanceState } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, type JournalState } from "@/features/journal/journal-storage"
import { parseStudyState, type StudyState } from "@/features/study/study-storage"
import { parseBudgetState, type BudgetState } from "@/features/budget/budget-storage"
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings-storage"

const EXPORT_VERSION = 1

interface ExportSnapshot {
  journal: JournalState
  finance: FinanceState
  study: StudyState
  settings: AppSettings
  budget: BudgetState
}

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
  | { ok: true; data: ExportSnapshot; summary: string }
  | { ok: false; error: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback
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

  const journalOverride = isObject(parsed.journal) ? parsed.journal : {}
  const journal: JournalState = {
    ...DEFAULT_JOURNAL_STATE,
    ...journalOverride,
    entries: ensureArray(journalOverride.entries, DEFAULT_JOURNAL_STATE.entries),
  }

  const finance: FinanceState = parseFinanceState(isObject(parsed.finance) ? parsed.finance : {})

  const study: StudyState = parseStudyState(isObject(parsed.study) ? parsed.study : {})

  const budget: BudgetState = parseBudgetState(isObject(parsed.budget) ? parsed.budget : {})

  const settingsOverride = isObject(parsed.settings) ? parsed.settings : {}
  const profileOverride = isObject(settingsOverride.profile) ? settingsOverride.profile : {}
  // Chỉ build đúng 3 field của AppSettings hiện tại — không spread nguyên settingsOverride,
  // để field cũ đã xoá khỏi type (vd. "budget") không theo file backup cũ sống lại.
  const settings: AppSettings = {
    profile: { ...DEFAULT_SETTINGS.profile, ...profileOverride },
    moods: ensureArray(settingsOverride.moods, DEFAULT_SETTINGS.moods),
    modules: ensureArray(settingsOverride.modules, DEFAULT_SETTINGS.modules),
    tags: ensureArray(settingsOverride.tags, DEFAULT_SETTINGS.tags),
  }

  const summary = `${journal.entries.length} bài nhật ký · ${finance.gold.length} lần mua vàng · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu`

  return { ok: true, data: { journal, finance, study, settings, budget }, summary }
}

export {
  EXPORT_VERSION,
  buildExportPayload,
  exportFileName,
  parseImportPayload,
  type ExportPayload,
  type ExportSnapshot,
  type ImportResult,
}
