"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

function groupVN(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString("vi-VN") : ""
}

interface FieldProps
  extends Omit<React.ComponentProps<"input">, "value" | "prefix" | "suffix"> {
  label?: React.ReactNode
  hint?: React.ReactNode
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  numeric?: boolean
  group?: boolean
  value?: string | number
}

function Field({
  className,
  label,
  hint,
  prefix,
  suffix,
  numeric,
  group,
  value,
  onChange,
  ...props
}: FieldProps) {
  const shown = group ? groupVN(value) : value
  const handleChange =
    group && onChange
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const digits = e.target.value.replace(/\D/g, "")
          onChange({ target: { value: digits } } as React.ChangeEvent<HTMLInputElement>)
        }
      : onChange

  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
          {label}
        </span>
      ) : null}
      <span className="flex min-h-[var(--ob-hit-min)] items-center gap-[var(--ob-space-2)] rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-[14px]">
        {prefix ? (
          <span className="text-sm text-[var(--ob-color-text-subtle)]">{prefix}</span>
        ) : null}
        <Input
          value={shown}
          onChange={handleChange}
          inputMode={numeric ? "numeric" : undefined}
          className={cn(
            "flex-1 py-[11px]",
            numeric
              ? "[font:var(--ob-text-num)] text-[18px] tabular-nums"
              : "[font:var(--ob-text-body)] text-[15px]"
          )}
          {...props}
        />
        {suffix ? (
          <span className="text-sm text-[var(--ob-color-text-subtle)]">{suffix}</span>
        ) : null}
      </span>
      {hint ? (
        <span className="mt-1.5 block text-xs text-[var(--ob-color-text-subtle)]">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export { Field, groupVN }
