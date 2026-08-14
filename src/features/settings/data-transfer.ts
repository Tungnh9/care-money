import { DEFAULT_FINANCE_STATE, type FinanceState } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, type JournalState } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, type StudyState } from "@/features/study/study-storage"
import { DEFAULT_SETTINGS, type AppSettings } from "@/lib/settings-storage"

const EXPORT_VERSION = 1

interface ExportSnapshot {
  journal: JournalState
  finance: FinanceState
  study: StudyState
  settings: AppSettings
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

  const financeOverride = isObject(parsed.finance) ? parsed.finance : {}
  const finance: FinanceState = {
    ...DEFAULT_FINANCE_STATE,
    ...financeOverride,
    savings: ensureArray(financeOverride.savings, DEFAULT_FINANCE_STATE.savings),
    cards: ensureArray(financeOverride.cards, DEFAULT_FINANCE_STATE.cards),
    gold: ensureArray(financeOverride.gold, DEFAULT_FINANCE_STATE.gold),
    invests: ensureArray(financeOverride.invests, DEFAULT_FINANCE_STATE.invests),
  }

  const studyOverride = isObject(parsed.study) ? parsed.study : {}
  const study: StudyState = {
    ...DEFAULT_STUDY_STATE,
    ...studyOverride,
    tasks: ensureArray(studyOverride.tasks, DEFAULT_STUDY_STATE.tasks),
    learned: ensureArray(studyOverride.learned, DEFAULT_STUDY_STATE.learned),
  }

  const settingsOverride = isObject(parsed.settings) ? parsed.settings : {}
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...settingsOverride,
    moods: ensureArray(settingsOverride.moods, DEFAULT_SETTINGS.moods),
    modules: ensureArray(settingsOverride.modules, DEFAULT_SETTINGS.modules),
  }

  const summary = `${journal.entries.length} bài nhật ký · ${finance.gold.length} lần mua vàng · đã khôi phục tiết kiệm, nợ thẻ, mục tiêu`

  return { ok: true, data: { journal, finance, study, settings }, summary }
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
