"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { AlertTriangle, Check, Copy } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { onDataChanged } from "@/lib/data-change-bus"
import { getSyncSecret, setSyncSecret } from "@/lib/sync-secret-storage"
import { getAutoBackupStatus, type AutoBackupStatus } from "../auto-backup-storage"
import type { ExportedInfo, ImportedInfo, PendingRestore, SyncResult } from "../hooks/use-data-management"

function formatAutoBackupTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
  return `${time} ngày ${date}`
}

// Có cả năm (khác formatAutoBackupTime): bản sao cũ cả năm trời vẫn phải nhận ra được là cũ.
function formatSnapshotTime(iso: string | null): string {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return "không rõ thời điểm"
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  return `${time} ngày ${date}`
}

interface DataCardProps {
  exported: ExportedInfo | null
  imported: ImportedInfo | null
  syncing: boolean
  syncResult: SyncResult | null
  pendingRestore: PendingRestore | null
  onExport: () => void
  onImport: (file: File) => void
  onPushToCloud: (secret: string) => void
  onPullFromCloud: (secret: string) => void
  onConfirmRestore: () => void
  onCancelRestore: () => void
}

function DataCard({
  exported,
  imported,
  syncing,
  syncResult,
  pendingRestore,
  onExport,
  onImport,
  onPushToCloud,
  onPullFromCloud,
  onConfirmRestore,
  onCancelRestore,
}: DataCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [secret, setSecret] = useState("")
  const [copied, setCopied] = useState(false)
  const [autoBackup, setAutoBackup] = useState<AutoBackupStatus | null>(null)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecret(getSyncSecret())
    setAutoBackup(getAutoBackupStatus())
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

  return (
    <Card label="Dữ liệu" className="min-w-0 flex-[1_1_300px]">
      <div>
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
          <Button
            variant="ghost"
            size="sm"
            type="button"
            disabled={syncing}
            onClick={() => fileRef.current?.click()}
          >
            Nhập từ file
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        {imported ? (
          <div
            className="mt-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] px-[15px] py-[13px] text-[13.5px] leading-[1.5]"
            style={{
              background: imported.ok ? "#E7F6EF" : "#FDEBF2",
              color: imported.ok ? "#0E7A50" : "#B92E63",
            }}
          >
            {imported.ok ? (
              <Check size={17} className="mt-[1px] flex-none" />
            ) : (
              <AlertTriangle size={17} className="mt-[1px] flex-none" />
            )}
            <div>
              {imported.ok ? (
                <>
                  <strong className="font-bold">Đã nạp {imported.file}</strong>
                  <br />
                  {imported.summary}
                </>
              ) : (
                <>
                  <strong className="font-bold">Không đọc được file</strong>
                  <br />
                  {imported.error}
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 border-t border-[var(--ob-color-border)] pt-4">
        <span className="mb-1 block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Đồng bộ đám mây
        </span>
        <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
          Tuỳ chọn — đồng bộ dữ liệu giữa các thiết bị của bạn. Chỉ bạn giữ secret bên dưới.
        </p>
        {autoBackup ? (
          <p className="mb-[14px] text-[13px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
            {/* Tạm ngưng tự động tải lên (2026-09-22) — nghi ngờ 2 máy ghi đè dữ liệu của nhau vì
                cơ chế hiện tại chỉ tự động TẢI LÊN, không tự động tải xuống hay gộp dữ liệu, nên
                máy nào tải lên sau sẽ âm thầm xoá mất thay đổi máy kia chưa kịp tải xuống. Trước
                khi bật lại: xác nhận đã có tải xuống tự động (hoặc gộp dữ liệu) để tránh mất dữ
                liệu tương tự. */}
            Tự động sao lưu: <strong className="font-semibold">tạm ngưng</strong> — dùng nút &quot;Tải
            lên&quot;/&quot;Tải xuống&quot; bên dưới để đồng bộ thủ công.
            {autoBackup.lastSyncedAt ? (
              <> Lần tự động gần nhất: {formatAutoBackupTime(autoBackup.lastSyncedAt)}.</>
            ) : null}
            {autoBackup.lastError ? (
              <span className="mt-1 block text-[var(--ob-color-expense)]">
                Lần gần nhất lỗi: {autoBackup.lastError}
              </span>
            ) : null}
          </p>
        ) : null}
        <Field
          label="Secret đồng bộ"
          type="password"
          placeholder="Nhập secret để đồng bộ giữa các thiết bị"
          value={secret}
          onChange={(e) => handleSecretChange(e.target.value)}
          suffix={
            <button
              type="button"
              onClick={handleCopySecret}
              disabled={!secret}
              aria-label={copied ? "Đã copy" : "Copy secret"}
              className="flex items-center justify-center disabled:opacity-40"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
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
        </div>
        {syncResult ? (
          <div
            className="mt-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] px-[15px] py-[13px] text-[13.5px] leading-[1.5]"
            style={{
              background: syncResult.ok ? "#E7F6EF" : "#FDEBF2",
              color: syncResult.ok ? "#0E7A50" : "#B92E63",
            }}
          >
            {syncResult.ok ? (
              <Check size={17} className="mt-[1px] flex-none" />
            ) : (
              <AlertTriangle size={17} className="mt-[1px] flex-none" />
            )}
            <div>
              {syncResult.ok ? (
                <>
                  <strong className="font-bold">Đã đồng bộ</strong>
                  <br />
                  {syncResult.summary}
                </>
              ) : (
                <>
                  <strong className="font-bold">Đồng bộ không thành công</strong>
                  <br />
                  {syncResult.error}
                </>
              )}
            </div>
          </div>
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
                {pendingRestore.source === "cloud" ? "Bản trên đám mây" : `File ${pendingRestore.fileName}`} được tạo lúc{" "}
                <strong className="font-bold">{formatSnapshotTime(pendingRestore.exportedAt)}</strong>
              </span>
              <span className="mt-2 block">Bản sắp nạp: {pendingRestore.incomingCounts}</span>
              <span className="block">Trên máy này: {pendingRestore.localCounts}</span>
              <span className="mt-2 block">
                Toàn bộ dữ liệu trên máy này sẽ bị thay bằng bản đó và không hoàn tác được. Nếu chưa chắc, hãy
                Huỷ rồi bấm &quot;Xuất file JSON&quot; trước.
              </span>
            </>
          ) : null
        }
        confirmLabel="Thay dữ liệu"
        destructive
        onConfirm={onConfirmRestore}
      />
    </Card>
  )
}

export { DataCard }
