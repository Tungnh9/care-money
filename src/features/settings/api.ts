import { parseImportPayload, type ExportPayload, type ImportResult } from "./data-transfer"
import { translateDefault } from "@/lib/i18n"
import type { TranslationFn } from "@/lib/i18n"

type PushResult = { ok: true; summary: string } | { ok: false; error: string }

function mapErrorStatus(status: number, serverError: string | undefined, t: TranslationFn): string {
  if (status === 401) return t("settings.data.wrongSecret")
  if (status === 404) return t("settings.data.noRemoteBackup")
  return serverError ?? t("settings.data.syncFailedMessage")
}

async function pushSnapshot(
  secret: string,
  payload: ExportPayload,
  t: TranslationFn = translateDefault
): Promise<PushResult> {
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload),
    })
    const json = await response.json().catch(() => ({}))

    if (!response.ok) {
      return { ok: false, error: mapErrorStatus(response.status, json.error, t) }
    }
    return { ok: true, summary: json.summary }
  } catch {
    return { ok: false, error: t("settings.data.connectionFailed") }
  }
}

async function pullSnapshot(secret: string, t: TranslationFn = translateDefault): Promise<ImportResult> {
  try {
    const response = await fetch("/api/sync", {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
    })

    if (!response.ok) {
      const json = await response.json().catch(() => ({}))
      return { ok: false, error: mapErrorStatus(response.status, json.error, t) }
    }
    return parseImportPayload(await response.text(), t)
  } catch {
    return { ok: false, error: t("settings.data.connectionFailed") }
  }
}

export { pushSnapshot, pullSnapshot, type PushResult }
