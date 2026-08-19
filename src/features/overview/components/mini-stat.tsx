import Image from "next/image"
import type { ReactNode } from "react"

interface MiniStatProps {
  icon: string
  label: string
  value: string
  hint?: ReactNode
  color?: string
}

function MiniStat({ icon, label, value, hint, color }: MiniStatProps) {
  return (
    <div className="flex min-w-0 flex-[1_1_150px] items-start gap-[11px]">
      <span className="flex size-8 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] bg-[var(--ob-color-surface-sunken)]">
        <Image src={`/assets/icons/${icon}.svg`} width={19} height={19} alt="" />
      </span>
      <div className="min-w-0">
        <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          {label}
        </div>
        <div
          className="text-[15px] font-bold [font-family:var(--ob-font-num)] whitespace-nowrap"
          style={{ color: color || "var(--ob-color-text)" }}
        >
          {value}
        </div>
        {hint ? (
          <div className="mt-[3px] text-[11.5px] text-[var(--ob-color-text-subtle)]">{hint}</div>
        ) : null}
      </div>
    </div>
  )
}

export { MiniStat }
