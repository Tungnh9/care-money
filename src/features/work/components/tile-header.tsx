import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface TileHeaderProps {
  id: string
  icon: ReactNode
  // Nền/màu của ô icon 36px, mặc định nền lõm.
  iconClassName?: string
  label: string
  count?: number
  action?: ReactNode
}

// Đầu mỗi ô Bento, cùng kiểu trang Tổng quan: ô icon, nhãn chữ nhỏ viết hoa (là tên của ô), số đếm, nút link.
function TileHeader({ id, icon, iconClassName, label, count, action }: TileHeaderProps) {
  return (
    <div className="mb-4 flex min-h-9 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-9 flex-none place-items-center rounded-[12px] bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
          iconClassName
        )}
      >
        {icon}
      </span>
      <h2
        id={id}
        className="min-w-0 truncate [font:var(--ob-text-micro-wrap)] text-[var(--ob-color-text-muted)] uppercase tracking-[var(--ob-track-micro)]"
      >
        {label}
      </h2>
      {count !== undefined ? (
        <span className="rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-surface-sunken)] px-[7px] py-px font-[family-name:var(--ob-font-num)] text-xs font-bold text-[var(--ob-color-text-subtle)]">
          {count}
        </span>
      ) : null}
      {action ? <div className="ml-auto flex-none">{action}</div> : null}
    </div>
  )
}

interface TileLinkProps {
  onClick: () => void
  children: ReactNode
  label?: string
}

// "Báo cáo →", "Xem tất cả 8 →" ở góc phải đầu ô. Vùng bấm cao 44px.
function TileLink({ onClick, children, label }: TileLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="-my-2 inline-flex min-h-[var(--ob-hit-min)] items-center gap-1 text-[13px] font-bold whitespace-nowrap text-[var(--ob-color-action-strong)] hover:underline"
    >
      {children}
      <span aria-hidden="true">→</span>
    </button>
  )
}

const EMPTY_CLASS = "text-[13.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]"

export { EMPTY_CLASS, TileHeader, TileLink }
