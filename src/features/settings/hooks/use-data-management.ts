"use client"

import { useCallback, useState } from "react"

import { DEFAULT_FINANCE_STATE, getStoredFinance, setStoredFinance } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE, getStoredJournal, setStoredJournal } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE, getStoredStudy, setStoredStudy } from "@/features/study/study-storage"
import { getStoredSettings, type AppSettings } from "@/lib/settings-storage"
import { buildExportPayload, exportFileName, parseImportPayload } from "../data-transfer"

interface ExportedInfo {
  file: string
  size: string
  time: string
}

type ImportedInfo = { ok: true; file: string; summary: string } | { ok: false; error: string }

interface UseDataManagementOptions {
  onImportSettings: (settings: AppSettings) => void
}

function useDataManagement({ onImportSettings }: UseDataManagementOptions) {
  const [exported, setExported] = useState<ExportedInfo | null>(null)
  const [imported, setImported] = useState<ImportedInfo | null>(null)

  const exportData = useCallback(() => {
    const now = new Date()
    const payload = buildExportPayload(
      {
        journal: getStoredJournal(),
        finance: getStoredFinance(),
        study: getStoredStudy(),
        settings: getStoredSettings(),
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
        setStoredJournal(result.data.journal)
        setStoredFinance(result.data.finance)
        setStoredStudy(result.data.study)
        onImportSettings(result.data.settings)
        setImported({ ok: true, file: file.name, summary: result.summary })
      } else {
        setImported({ ok: false, error: result.error })
      }
      setExported(null)
    },
    [onImportSettings]
  )

  const wipeData = useCallback(() => {
    const { goldPrice } = getStoredFinance()
    setStoredJournal(DEFAULT_JOURNAL_STATE)
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, goldPrice })
    setStoredStudy(DEFAULT_STUDY_STATE)
    setExported(null)
    setImported(null)
  }, [])

  return { exported, imported, exportData, importData, wipeData }
}

export { useDataManagement, type ExportedInfo, type ImportedInfo }
