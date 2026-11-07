"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { Check, Copy } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { onDataChanged } from "@/lib/data-change-bus"
import { getSyncSecret, setSyncSecret } from "@/lib/sync-secret-storage"
import type { CloudVersion } from "../api"
import type {
  CloudVersionsState,
  ExportedInfo,
  ImportedInfo,
  PendingRestore,
  PushConflict,
  RestoreUndo,
  SyncResult,
} from "../hooks/use-data-management"
import { formatSnapshotTime } from "../snapshot-time"
import { BackupStatusLine } from "./backup-status-line"
import { CloudVersionsPanel } from "./cloud-versions-panel"
import { ResultBanner } from "./result-banner"
import { StorageUsage } from "./storage-usage"

interface DataCardProps {
  exported: ExportedInfo | null
  imported: ImportedInfo | null
  syncing: boolean
  syncResult: SyncResult | null
  pendingRestore: PendingRestore | null
  restoreUndo: RestoreUndo | null
  pushConflict: PushConflict | null
  cloudVersions: CloudVersionsState | null
  onExport: () => void
  onImport: (file: File) => void
  onPushToCloud: (secret: string, force?: boolean) => void
  onPullFromCloud: (secret: string) => void
  onConfirmRestore: (keepLocal?: boolean) => void
  onCancelRestore: () => void
  onUndoRestore: () => void
  onCancelPushConflict: () => void
  onLoadCloudVersions: (secret: string) => void
  onCloseCloudVersions: () => void
  onPullCloudVersion: (secret: string, version: CloudVersion) => void
}

function restoreSourceLabel(pending: PendingRestore): string {
  if (pending.source === "file") return `File ${pending.fileName}`
  return pending.old ? "Bản cũ trên đám mây" : "Bản trên đám mây"
}

function DataCard({
  exported,
  imported,
  syncing,
  syncResult,
  pendingRestore,
  restoreUndo,
  pushConflict,
  cloudVersions,
  onExport,
  onImport,
  onPushToCloud,
  onPullFromCloud,
  onConfirmRestore,
  onCancelRestore,
  onUndoRestore,
  onCancelPushConflict,
  onLoadCloudVersions,
  onCloseCloudVersions,
  onPullCloudVersion,
}: DataCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [secret, setSecret] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecret(getSyncSecret())
  }, [])

  useEffect(() => {
    // Đăng xuất (kể cả ở tab khác) hay xoá toàn bộ dữ liệu đều gỡ secret khỏi máy — ô nhập phải
    // trống theo, không giữ bản cũ trong state để còn bấm "Tải lên"/"Copy" được. Luôn đọc lại thay
    // vì dùng useStorageSync: gõ trong ô này (setSyncSecret) cố ý không báo data-change-bus, nên
    // mốc "chuỗi thô lần trước" của useStorageSync sẽ cũ. Đọc lại khi đang gõ vẫn vô hại — storage
    // luôn giữ đúng chữ vừa gõ.
    function reloadSecret() {
      setSecret(getSyncSecret())
    }
    const unsubscribe = onDataChanged(reloadSecret)
    window.addEventListener("storage", reloadSecret)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", reloadSecret)
    }
  }, [])

  function handleSecretChange(value: string) {
    setSecret(value)
    setSyncSecret(value)
  }

  async function handleCopySecret() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onImport(file)
    event.target.value = ""
  }

  // Nút "Hoàn tác" dưới banner của đúng nguồn vừa nạp (file hay đám mây).
  function undoAction(source: RestoreUndo["source"]) {
    if (restoreUndo?.source !== source || restoreUndo.status !== "ready") return null
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button variant="secondary" size="sm" type="button" onClick={onUndoRestore}>
          Hoàn tác
        </Button>
        <span className="text-[12.5px]">Được tới khi bạn sửa dữ liệu hay rời trang Cài đặt.</span>
      </div>
    )
  }

  const undone = (source: RestoreUndo["source"]) => restoreUndo?.source === source && restoreUndo.status === "done"

  return (
    <Card id="data" label="Dữ liệu" className="min-w-0 flex-[1_1_300px] scroll-mt-[76px]">
      <StorageUsage />
      <BackupStatusLine />

      <div className="mt-5 border-t border-[var(--ob-color-border)] pt-4">
        <span className="mb-1 block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Sao lưu file
        </span>
        <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
          Không cần mạng hay tài khoản — luôn hoạt động, kể cả khi mất kết nối.
        </p>
        {exported ? (
          <div className="mb-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] bg-[#E7F6EF] px-[15px] py-[13px] text-[#0E7A50]">
            <Check size={18} className="mt-[1px] flex-none" />
            <div className="text-[13.5px] leading-[1.5]">
              <strong className="font-bold">Đã tải {exported.file}</strong>
              <br />
              {exported.size} · {exported.time} · kiểm tra thư mục Tải xuống
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-[10px]">
          <Button variant="secondary" size="sm" type="button" onClick={onExport}>
            Xuất file JSON
          </Button>
          <Button variant="ghost" size="sm" type="button" disabled={syncing} onClick={() => fileRef.current?.click()}>
            Nhập từ file
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        {undone("file") ? (
          <ResultBanner ok title="Đã hoàn tác lần nạp">
            Dữ liệu trên máy đã về như trước khi nạp file.
          </ResultBanner>
        ) : imported ? (
          !imported.ok ? (
            <ResultBanner ok={false} title="Nhập file không thành công">
              {imported.error}
            </ResultBanner>
          ) : (
            <ResultBanner ok title={`Đã nạp ${imported.file}`} action={undoAction("file")}>
              {imported.summary}
            </ResultBanner>
          )
        ) : null}
      </div>

      <div className="mt-5 border-t border-[var(--ob-color-border)] pt-4">
        <span className="mb-1 block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Đồng bộ đám mây
        </span>
        <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
          Tuỳ chọn — đồng bộ dữ liệu giữa các thiết bị của bạn. Chỉ bạn giữ secret bên dưới.
        </p>
        <Field
          label="Secret đồng bộ"
          type="password"
          placeholder="Nhập secret để đồng bộ giữa các thiết bị"
          value={secret}
          onChange={(e) => handleSecretChange(e.target.value)}
          suffix={
            <ActionTooltip label={copied ? "Đã copy" : "Copy secret"} disabledReason={"Chưa có secret để copy."}>
              <button
                type="button"
                onClick={handleCopySecret}
                disabled={!secret}
                aria-label={copied ? "Đã copy" : "Copy secret"}
                className="flex items-center justify-center disabled:opacity-40"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </ActionTooltip>
          }
        />
        <div className="mt-[10px] flex flex-wrap gap-[10px]">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            disabled={!secret || syncing}
            onClick={() => onPushToCloud(secret)}
          >
            {syncing ? "Đang đồng bộ…" : "Tải lên"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={!secret || syncing}
            onClick={() => onPullFromCloud(secret)}
          >
            {syncing ? "Đang đồng bộ…" : "Tải xuống"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={!secret || cloudVersions?.status === "loading"}
            onClick={() => onLoadCloudVersions(secret)}
          >
            Bản cũ
          </Button>
        </div>
        {undone("cloud") ? (
          <ResultBanner ok title="Đã hoàn tác lần tải xuống">
            Dữ liệu trên máy đã về như trước khi tải xuống.
          </ResultBanner>
        ) : syncResult ? (
          !syncResult.ok ? (
            <ResultBanner ok={false} title="Đồng bộ không thành công">
              {syncResult.error}
            </ResultBanner>
          ) : (
            <ResultBanner ok title="Đã đồng bộ" action={undoAction("cloud")}>
              {syncResult.summary}
            </ResultBanner>
          )
        ) : null}
        {cloudVersions ? (
          <CloudVersionsPanel
            state={cloudVersions}
            disabled={!secret || syncing}
            onRestore={(version) => onPullCloudVersion(secret, version)}
            onClose={onCloseCloudVersions}
          />
        ) : null}
      </div>

      <AlertDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => {
          if (!open) onCancelRestore()
        }}
        title="Thay dữ liệu trên máy này?"
        description={
          pendingRestore ? (
            <>
              <span className="block">
                {restoreSourceLabel(pendingRestore)} được tạo lúc{" "}
                <strong className="font-bold">{formatSnapshotTime(pendingRestore.exportedAt)}</strong>
              </span>
              <span className="mt-2 block">Bản sắp nạp: {pendingRestore.incomingCounts}</span>
              <span className="block">Trên máy này: {pendingRestore.localCounts}</span>
              {pendingRestore.localOnly ? (
                <span className="mt-2 block font-semibold text-[var(--ob-color-expense)]">
                  Chỉ có trên máy này, bản sắp nạp không có: {pendingRestore.localOnly}. Chọn &quot;Nạp và giữ&quot; để
                  gộp chúng vào bản sắp nạp.
                </span>
              ) : null}
              <span className="mt-2 block">
                Toàn bộ dữ liệu trên máy này sẽ bị thay bằng bản đó. Hoàn tác được ngay sau khi nạp, tới khi bạn sửa dữ
                liệu hay rời trang Cài đặt — nếu chưa chắc, hãy Huỷ rồi bấm &quot;Xuất file JSON&quot; trước.
              </span>
            </>
          ) : null
        }
        extraAction={
          pendingRestore?.localOnly ? { label: "Nạp và giữ", onClick: () => onConfirmRestore(true) } : undefined
        }
        confirmLabel="Thay dữ liệu"
        destructive
        onConfirm={() => onConfirmRestore(false)}
      />

      <AlertDialog
        open={pushConflict !== null}
        onOpenChange={(open) => {
          if (!open) onCancelPushConflict()
        }}
        title={pushConflict?.hasBase ? "Máy khác đã tải lên sau lần đồng bộ trước" : "Đám mây đang có 1 bản khác"}
        description={
          pushConflict ? (
            <>
              <span className="block">
                Bản trên đám mây được tải lên lúc{" "}
                <strong className="font-bold">{formatSnapshotTime(pushConflict.cloudUploadedAt)}</strong>
                {pushConflict.hasBase
                  ? ", sau lần đồng bộ trước của máy này."
                  : ", và máy này chưa tải bản đó xuống lần nào."}
              </span>
              <span className="mt-2 block">
                Tải lên bây giờ sẽ thay bản đó bằng dữ liệu trên máy này — những gì máy kia thêm mà máy này chưa có sẽ
                không còn trong bản mới nhất (vẫn lấy lại được ở &quot;Bản cũ&quot;). Nên tải xuống trước.
              </span>
            </>
          ) : null
        }
        extraAction={{ label: "Tải xuống trước", onClick: () => onPullFromCloud(secret) }}
        confirmLabel="Vẫn tải lên"
        destructive
        onConfirm={() => onPushToCloud(secret, true)}
      />
    </Card>
  )
}

export { DataCard }
