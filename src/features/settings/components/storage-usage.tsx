"use client"

import { Progress } from "@/components/ui/progress"
import {
  LOCAL_STORAGE_QUOTA_BYTES,
  LOCAL_STORAGE_QUOTA_MB,
  STORAGE_WARN_RATIO,
  formatStorageSize,
} from "../storage-usage"
import { useStorageUsage } from "../hooks/use-storage-usage"

const QUOTA_LABEL = `${LOCAL_STORAGE_QUOTA_MB} MB`

// Dòng "Dữ liệu đang dùng X / 5 MB" đầu thẻ Dữ liệu — để biết trước nhiều năm khi nào bộ nhớ trình duyệt sắp đầy.
// Trên Chrome số có thể vượt 5 MB (Chrome chứa gấp đôi): khi đó thanh đầy và báo là đã quá sức chứa của iPhone.
function StorageUsage() {
  const bytes = useStorageUsage()
  const ratio = bytes === null ? 0 : bytes / LOCAL_STORAGE_QUOTA_BYTES
  const warning =
    ratio >= 1
      ? `Đã quá ${QUOTA_LABEL}: Safari trên iPhone không lưu thêm được (Chrome chứa tới ${2 * LOCAL_STORAGE_QUOTA_MB} MB). Xuất file JSON để giữ 1 bản sao.`
      : ratio >= STORAGE_WARN_RATIO
        ? `Sắp đầy: Xuất file JSON để giữ 1 bản sao. Quá ${QUOTA_LABEL} thì Safari trên iPhone không lưu thêm được.`
        : null

  return (
    <div>
      <span className="mb-1 block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Dung lượng trên máy
      </span>
      <p className="mb-[10px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Dữ liệu đang dùng{" "}
        <strong className="font-bold text-[var(--ob-color-text)] [font-family:var(--ob-font-num)]">
          {bytes === null ? "…" : formatStorageSize(bytes)}
        </strong>{" "}
        / {QUOTA_LABEL}
      </p>
      <Progress
        aria-label="Dung lượng dữ liệu đã dùng"
        value={Math.min(ratio * 100, 100)}
        tone={warning ? "expense" : "action"}
        label="Tính như Safari trên iPhone — Chrome chứa gấp đôi"
        hint={bytes === null ? null : `${Math.round(ratio * 100)}%`}
      />
      {warning ? (
        <p className="mt-[10px] text-[13.5px] leading-[1.5] text-[var(--ob-color-expense)]">{warning}</p>
      ) : null}
    </div>
  )
}

export { StorageUsage }
