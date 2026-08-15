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
  invalid?: boolean
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
  invalid,
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
      <span
        className={cn(
          "flex min-h-[var(--ob-hit-min)] items-center gap-[var(--ob-space-2)] rounded-[var(--ob-radius-md)] border-[1.5px] bg-[var(--ob-color-surface)] px-[14px] transition-colors duration-[var(--ob-dur-fast)]",
          invalid
            ? "border-[var(--ob-color-expense)]"
            : "border-[var(--ob-color-border)] focus-within:border-[var(--ob-color-focus)]"
        )}
      >
        {prefix ? (
          <span className="text-sm text-[var(--ob-color-text-subtle)]">{prefix}</span>
        ) : null}
        <Input
          value={shown}
          onChange={handleChange}
          inputMode={numeric ? "numeric" : undefined}
          aria-invalid={invalid || undefined}
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
        <span
          className={cn(
            "mt-1.5 block text-xs",
            invalid ? "text-[var(--ob-color-expense)]" : "text-[var(--ob-color-text-subtle)]"
          )}
        >
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export { Field, groupVN }
