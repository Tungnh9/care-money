"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CloudVersion } from "../api"
import type { CloudVersionsState } from "../hooks/use-data-management"
import { formatSnapshotTime } from "../snapshot-time"

interface CloudVersionsPanelProps {
  state: CloudVersionsState
  disabled: boolean
  onRestore: (version: CloudVersion) => void
  onClose: () => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`
}

// Các bản đã bị thay mỗi lần tải lên — để lấy lại nếu lỡ ghi đè bản đám mây bằng dữ liệu cũ hơn.
function CloudVersionsPanel({ state, disabled, onRestore, onClose }: CloudVersionsPanelProps) {
  return (
    <div className="mt-[14px] rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          Bản cũ trên đám mây
        </span>
        <button
          type="button"
          aria-label="Đóng danh sách bản cũ"
          onClick={onClose}
          className="flex size-6 flex-none items-center justify-center rounded-full text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-border)]"
        >
          <X size={14} />
        </button>
      </div>
      <p className="mt-1 text-[12.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
        Mỗi lần tải lên, bản đang có trên đám mây được cất lại ở đây (giữ 10 bản gần nhất).
      </p>
      {state.status === "loading" ? (
        <p className="mt-3 text-[13px] text-[var(--ob-color-text-muted)]">Đang tải danh sách…</p>
      ) : state.status === "error" ? (
        <p className="mt-3 text-[13px] text-[var(--ob-color-expense)]">{state.error}</p>
      ) : state.versions.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--ob-color-text-muted)]">
          Chưa có bản cũ nào — bản cũ được cất từ lần tải lên kế tiếp.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {state.versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[var(--ob-color-border)] py-2 first:border-t-0"
            >
              <span className="text-[13px] text-[var(--ob-color-text)]">
                {formatSnapshotTime(version.uploadedAt)}
                <span className="text-[var(--ob-color-text-subtle)]"> · {formatSize(version.size)}</span>
              </span>
              <Button variant="ghost" size="sm" type="button" disabled={disabled} onClick={() => onRestore(version)}>
                Nạp bản này
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { CloudVersionsPanel }
