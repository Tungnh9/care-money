"use client"

import { CEFR_LEVELS, type CefrLevel } from "@/lib/study/cefr"
import { cn } from "@/lib/utils"

interface LevelFilterProps {
  // Số từ của mỗi cấp trong phạm vi đang xem (cả kho, hay 1 chủ đề) — chỉ cấp có từ.
  counts: { level: CefrLevel; count: number }[]
  // Cấp đang lọc; null = tất cả.
  active: CefrLevel | null
  onChange: (level: CefrLevel | null) => void
}

const CHIP =
  "inline-flex min-h-[var(--ob-hit-min)] items-center rounded-[var(--ob-radius-pill)] border-[1.5px] px-[14px] text-[13px] font-semibold whitespace-nowrap tabular-nums transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]"
const CHIP_ON = "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
const CHIP_OFF = "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"

// Dải nút lọc theo cấp độ CEFR. Cấp đang lọc vẫn hiện (kèm 0) dù phạm vi đang xem không có từ ở cấp đó — để thấy
// mình đang lọc gì, và chuyển sang cấp khác hay "Tất cả" ngay tại đó.
function LevelFilter({ counts, active, onChange }: LevelFilterProps) {
  const items = CEFR_LEVELS.flatMap((level) => {
    const found = counts.find((item) => item.level === level)
    if (found) return [found]
    return level === active ? [{ level, count: 0 }] : []
  })

  return (
    <div className="mb-5">
      <div role="group" aria-label="Lọc theo cấp độ" className="flex flex-wrap gap-[6px]">
        <button
          type="button"
          aria-pressed={active === null}
          onClick={() => onChange(null)}
          className={cn(CHIP, active === null ? CHIP_ON : CHIP_OFF)}
        >
          Tất cả
        </button>
        {items.map(({ level, count }) => (
          <button
            key={level}
            type="button"
            aria-pressed={active === level}
            onClick={() => onChange(level)}
            className={cn(CHIP, active === level ? CHIP_ON : CHIP_OFF)}
          >
            {`${level} · ${count}`}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">
        A1–A2: cơ bản · B1–B2: trung cấp · C1–C2: nâng cao
      </p>
    </div>
  )
}

export { LevelFilter }
