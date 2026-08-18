import * as React from "react"

import { cn } from "@/lib/utils"

interface FigureProps {
  value: React.ReactNode
  unit?: React.ReactNode
  delta?: React.ReactNode
  direction?: "up" | "down"
  caption?: React.ReactNode
  size?: "lg" | "sm"
  className?: string
}

function Figure({
  value,
  unit,
  delta,
  direction = "up",
  caption,
  size = "lg",
  className,
}: FigureProps) {
  const up = direction === "up"
  return (
    <div className={className}>
      <div
        className={cn(
          "[font-family:var(--ob-font-num)] font-bold leading-none tracking-[-0.02em] whitespace-nowrap tabular-nums",
          size === "lg"
            ? "text-[clamp(20px,13cqi,36px)]"
            : "text-[length:var(--ob-size-num)]"
        )}
      >
        {value}
        {unit ? <span className="opacity-50">{unit}</span> : null}
      </div>
      {delta || caption ? (
        <div className="mt-[var(--ob-space-3)] flex items-center gap-[var(--ob-space-2)] text-[13.5px]">
          {delta ? (
            <span
              className={cn(
                "font-bold",
                up ? "text-[var(--ob-la-300)]" : "text-[var(--ob-do-300)]"
              )}
            >
              {up ? "▲" : "▼"} {delta}
            </span>
          ) : null}
          {caption ? <span className="opacity-[.72]">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { Figure }
export type { FigureProps }
