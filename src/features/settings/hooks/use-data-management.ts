"use client"

import { useCallback, useState } from "react"

import { getStoredFinance, type FinanceState } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, getStoredJournal, type JournalState } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, getStoredStudy, type StudyState } from "@/features/study/study-storage"
import { DEFAULT_BUDGET_STATE, getStoredBudget, type BudgetState } from "@/features/budget/budget-storage"
import {
  DEFAULT_NET_WORTH_HISTORY,
  getStoredNetWorthHistory,
  type NetWorthHistory,
} from "@/features/overview/net-worth-history-storage"
import { getStoredSettings, type AppSettings } from "@/lib/settings-storage"
import { pushSnapshot, pullSnapshot } from "../api"
import { buildExportPayload, exportFileName, parseImportPayload } from "../data-transfer"

interface ExportedInfo {
  file: string
  size: string
  time: string
}

type ImportedInfo = { ok: true; file: string; summary: string } | { ok: false; error: string }
type SyncResult = { ok: true; summary: string } | { ok: false; error: string }

interface UseDataManagementOptions {
  onReplaceJournal: (journal: JournalState) => void
  onReplaceFinance: (finance: FinanceState) => void
  onReplaceStudy: (study: StudyState) => void
  onReplaceSettings: (settings: AppSettings) => void
  onReplaceBudget: (budget: BudgetState) => void
  onReplaceNetWorthHistory: (history: NetWorthHistory) => void
}

function useDataManagement({
  onReplaceJournal,
  onReplaceFinance,
  onReplaceStudy,
  onReplaceSettings,
  onReplaceBudget,
  onReplaceNetWorthHistory,
}: UseDataManagementOptions) {
  const [exported, setExported] = useState<ExportedInfo | null>(null)
  const [imported, setImported] = useState<ImportedInfo | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  const pushToCloud = useCallback(async (secret: string) => {
    setSyncing(true)
    const payload = buildExportPayload(
      {
        journal: getStoredJournal(),
        finance: getStoredFinance(),
        study: getStoredStudy(),
        settings: getStoredSettings(),
        budget: getStoredBudget(),
        netWorthHistory: getStoredNetWorthHistory(),
      },
      new Date().toISOString()
    )
    const result = await pushSnapshot(secret, payload)
    setSyncResult(result)
    setSyncing(false)
  }, [])

  const pullFromCloud = useCallback(
    async (secret: string) => {
      setSyncing(true)
      const result = await pullSnapshot(secret)
      if (result.ok) {
        onReplaceJournal(result.data.journal)
        onReplaceFinance(result.data.finance)
        onReplaceStudy(result.data.study)
        onReplaceSettings(result.data.settings)
        onReplaceBudget(result.data.budget)
        onReplaceNetWorthHistory(result.data.netWorthHistory)
        setSyncResult({ ok: true, summary: result.summary })
      } else {
        setSyncResult({ ok: false, error: result.error })
      }
      setSyncing(false)
    },
    [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings, onReplaceBudget, onReplaceNetWorthHistory]
  )

  const exportData = useCallback(() => {
    const now = new Date()
    const payload = buildExportPayload(
      {
        journal: getStoredJournal(),
        finance: getStoredFinance(),
        study: getStoredStudy(),
        settings: getStoredSettings(),
        budget: getStoredBudget(),
        netWorthHistory: getStoredNetWorthHistory(),
      },
      now.toISOString()
    )
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const name = exportFileName(payload.exportedAt)
    const link = document.createElement("a")
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    setExported({
      file: name,
      size: `${(blob.size / 1024).toFixed(1).replace(".", ",")} KB`,
      time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    })
    setImported(null)
  }, [])

  const importData = useCallback(
    async (file: File) => {
      const result = parseImportPayload(await file.text())

      if (result.ok) {
        onReplaceJournal(result.data.journal)
        onReplaceFinance(result.data.finance)
        onReplaceStudy(result.data.study)
        onReplaceSettings(result.data.settings)
        onReplaceBudget(result.data.budget)
        onReplaceNetWorthHistory(result.data.netWorthHistory)
        setImported({ ok: true, file: file.name, summary: result.summary })
      } else {
        setImported({ ok: false, error: result.error })
      }
      setExported(null)
    },
    [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceSettings, onReplaceBudget, onReplaceNetWorthHistory]
  )

  const wipeData = useCallback(() => {
    const { goldStores } = getStoredFinance()
    onReplaceJournal(DEFAULT_JOURNAL_STATE)
    onReplaceFinance({ savings: [], cards: [], gold: [], invests: [], goldStores })
    onReplaceStudy(DEFAULT_STUDY_STATE)
    onReplaceBudget(DEFAULT_BUDGET_STATE)
    onReplaceNetWorthHistory(DEFAULT_NET_WORTH_HISTORY)
    setExported(null)
    setImported(null)
  }, [onReplaceJournal, onReplaceFinance, onReplaceStudy, onReplaceBudget, onReplaceNetWorthHistory])

  return {
    exported,
    imported,
    exportData,
    importData,
    wipeData,
    syncing,
    syncResult,
    pushToCloud,
    pullFromCloud,
  }
}

export { useDataManagement, type ExportedInfo, type ImportedInfo, type SyncResult }
