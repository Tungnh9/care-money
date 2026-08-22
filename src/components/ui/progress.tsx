"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends Omit<ProgressPrimitive.Root.Props, "children"> {
  track?: string
  tone?: "reward" | "action" | "expense"
  label?: React.ReactNode
  hint?: React.ReactNode
}

function Progress({
  className,
  value,
  track,
  tone = "reward",
  label,
  hint,
  ...props
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value ?? 0))
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={pct}
      className={cn(className)}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="h-2 overflow-hidden rounded-[var(--ob-radius-pill)]"
        style={{ background: track || "var(--ob-color-border)" }}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn(
            "h-full [transition:width_var(--ob-dur-slow)_var(--ob-ease-out)]",
            tone === "reward"
              ? "bg-[var(--ob-color-reward)]"
              : tone === "expense"
                ? "bg-[var(--ob-color-expense)]"
                : "bg-[var(--ob-color-action)]"
          )}
        />
      </ProgressPrimitive.Track>
      {label || hint ? (
        <div className="mt-[var(--ob-space-2)] flex justify-between text-xs opacity-[.72]">
          <span>{label}</span>
          <span>{hint}</span>
        </div>
      ) : null}
    </ProgressPrimitive.Root>
  )
}

export { Progress }
