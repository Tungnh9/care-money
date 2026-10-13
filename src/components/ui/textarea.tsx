import * as React from "react"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: React.ReactNode
  hint?: React.ReactNode
}

// Ô nhiều dòng cùng khung với Field (viền, bo góc, nền, viền focus) — dùng cho ghi chú dài như standup.
// Gợi ý nằm ngoài <label> và nối bằng aria-describedby: tên ô chỉ là nhãn, gợi ý được đọc như mô tả.
function Textarea({ className, label, hint, rows = 4, ...props }: TextareaProps) {
  const hintId = React.useId()
  return (
    <div className={className}>
      <label className="block">
        {label ? (
          <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
            {label}
          </span>
        ) : null}
        <textarea
          data-slot="textarea"
          rows={rows}
          aria-describedby={hint ? hintId : undefined}
          className="block w-full min-w-0 resize-y rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] px-[14px] py-[11px] [font:var(--ob-text-body)] text-[15px] text-[var(--ob-color-text)] outline-none transition-colors duration-[var(--ob-dur-fast)] placeholder:text-[var(--ob-color-text-subtle)] focus:border-[var(--ob-color-focus)] disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
      </label>
      {hint ? (
        <span id={hintId} className="mt-1.5 block text-xs text-[var(--ob-color-text-subtle)]">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

export { Textarea }
