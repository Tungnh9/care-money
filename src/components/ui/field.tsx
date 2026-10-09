"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { groupVN, pastedMoneyDigits } from "@/lib/format"
import { Input } from "@/components/ui/input"

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
  // Đang bật "Ẩn số tiền": ô đã điền sẵn chỉ hiện "••••••••"; bấm vào ô (focus) mới hiện số thật để
  // sửa, rời ô (blur) thì che lại. Ô rỗng vẫn hiện placeholder của nơi dùng.
  masked?: boolean
}

const MASKED_PLACEHOLDER = "••••••••"

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
  masked,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  onPaste,
  ...props
}: FieldProps) {
  const [focused, setFocused] = React.useState(false)
  const formatted = group ? groupVN(value) : value
  const masking = !!masked && !focused && String(formatted ?? "") !== ""
  const shown = masking ? "" : formatted
  const handleChange =
    group && onChange
      ? (e: React.ChangeEvent<HTMLInputElement>) => {
          const digits = e.target.value.replace(/\D/g, "")
          onChange({ target: { value: digits } } as React.ChangeEvent<HTMLInputElement>)
        }
      : onChange
  // Dán số tiền chép từ sao kê/hoá đơn ("1.500.000,00"): handleChange chỉ lọc chữ số trên cả chuỗi
  // nên ",00" dính vào thành 150.000.000 đ. Ô tiền tự xử lý lần dán — bỏ phần lẻ rồi mới lấy chữ số,
  // thay đúng vùng đang chọn — và trả về đúng dạng chuỗi chữ số như handleChange.
  const handlePaste =
    group && onChange
      ? (e: React.ClipboardEvent<HTMLInputElement>) => {
          onPaste?.(e)
          if (e.defaultPrevented) return
          e.preventDefault()
          const input = e.currentTarget
          const start = input.selectionStart ?? input.value.length
          const end = input.selectionEnd ?? input.value.length
          const pasted = pastedMoneyDigits(e.clipboardData.getData("text/plain"))
          const digits = (input.value.slice(0, start) + pasted + input.value.slice(end)).replace(/\D/g, "")
          onChange({ target: { value: digits } } as React.ChangeEvent<HTMLInputElement>)
        }
      : onPaste

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
        <Input
          value={shown}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          placeholder={masking ? MASKED_PLACEHOLDER : placeholder}
          inputMode={numeric ? "numeric" : undefined}
          aria-invalid={invalid || undefined}
          className={cn(
            "order-none flex-1 py-[11px]",
            numeric
              ? "[font:var(--ob-text-num)] text-[18px] tabular-nums"
              : "[font:var(--ob-text-body)] text-[15px]"
          )}
          {...props}
        />
        {prefix ? (
          <span className="order-first flex items-center self-stretch text-sm text-[var(--ob-color-text-subtle)]">
            {prefix}
          </span>
        ) : null}
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
