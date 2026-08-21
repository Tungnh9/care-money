"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { cva } from "class-variance-authority"
import { Delete, Eraser, X, type LucideIcon } from "lucide-react"

import { Monkey } from "@/components/ob/monkey"
import { cn } from "@/lib/utils"
import { useCalculator, type HistoryItem } from "../hooks/use-calculator"

interface CalculatorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type KeyKind = "n" | "op" | "fn" | "eq"

interface CalcKey {
  key: string
  kind: KeyKind
  icon?: LucideIcon
  label?: string
}

// Đúng thứ tự bàn phím trong file thiết kế tham khảo: 5 hàng x 4 cột.
const KEYS: CalcKey[] = [
  { key: "C", kind: "fn", icon: Eraser, label: "Xoá hết" },
  { key: "( )", kind: "fn" },
  { key: "%", kind: "fn" },
  { key: "÷", kind: "op" },
  { key: "7", kind: "n" },
  { key: "8", kind: "n" },
  { key: "9", kind: "n" },
  { key: "×", kind: "op" },
  { key: "4", kind: "n" },
  { key: "5", kind: "n" },
  { key: "6", kind: "n" },
  { key: "−", kind: "op" },
  { key: "1", kind: "n" },
  { key: "2", kind: "n" },
  { key: "3", kind: "n" },
  { key: "+", kind: "op" },
  { key: "0", kind: "n" },
  { key: ",", kind: "n" },
  { key: "⌫", kind: "fn", icon: Delete, label: "Xoá một kí tự" },
  { key: "=", kind: "eq" },
]

/** Bàn phím thật gõ ký hiệu ASCII, quy đổi về ký hiệu hiển thị mà evalExpr hiểu. */
const KEYBOARD_SYMBOL_MAP: Record<string, string> = { "*": "×", "/": "÷", "-": "−" }

const FOCUSABLE_SELECTOR = 'button:not([disabled]),[href],input,[tabindex]:not([tabindex="-1"])'

// Tông màu theo "kind" — không có tông đỏ riêng cho fn (C, ⌫, ( ), %).
const calcKeyVariants = cva(
  "ob-calc-key flex min-h-[52px] items-center justify-center rounded-[var(--ob-radius-md)] text-[18px] [font-family:var(--ob-font-num)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      kind: {
        n: "border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] text-[var(--ob-color-text)]",
        op: "bg-[var(--ob-color-action-soft)] font-bold text-[var(--ob-color-action-strong)]",
        fn: "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
        eq: "bg-[var(--ob-color-action)] font-bold text-[var(--ob-color-on-action)]",
      },
    },
  }
)

function CalculatorModal({ open, onOpenChange }: CalculatorModalProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const { expr, out, error, history, push, back, clear, equals, restoreFromHistory, insertParen } =
    useCalculator()

  // Mở: nhớ phần tử đang focus, khoá scroll body, focus vào nút Đóng sau 1 tick.
  // Đóng: trả lại scroll body, focus lại đúng phần tử đã lưu trước khi mở.
  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const timer = window.setTimeout(() => closeRef.current?.focus(), 0)

    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus()
    }
  }, [open])

  // Đóng modal thì reset lại "0" cho lần mở sau (giữ hành vi từ bản cũ).
  useEffect(() => {
    if (!open) clear()
  }, [open, clear])

  useEffect(() => {
    if (!open) return

    function trapTab(e: KeyboardEvent) {
      const box = boxRef.current
      if (!box) return
      const focusable = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onOpenChange(false)
        return
      }
      if (e.key === "Tab") {
        trapTab(e)
        return
      }
      if (e.key === "Enter" || e.key === "=") {
        e.preventDefault()
        equals()
        return
      }
      if (e.key === "Backspace") {
        e.preventDefault()
        back()
        return
      }
      if (e.key === "Delete" || e.key === "c" || e.key === "C") {
        e.preventDefault()
        clear()
        return
      }
      if (e.key === "." || e.key === ",") {
        e.preventDefault()
        push(",")
        return
      }
      if (/^[0-9+\-*/()%]$/.test(e.key)) {
        e.preventDefault()
        push(KEYBOARD_SYMBOL_MAP[e.key] ?? e.key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange, equals, back, clear, push])

  if (!open) return null

  function hit(key: string) {
    if (key === "C") {
      clear()
      return
    }
    if (key === "( )") {
      insertParen()
      return
    }
    if (key === "⌫") {
      back()
      return
    }
    if (key === "=") {
      equals()
      return
    }
    push(key)
  }

  function handleRestore(item: HistoryItem) {
    restoreFromHistory(item)
  }

  return createPortal(
    <div
      className="ob-calc-veil"
      role="dialog"
      aria-modal="true"
      aria-label="Máy tính"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div className="ob-calc-box" ref={boxRef}>
        <div className="ob-calc-head mb-[14px] flex items-center gap-[11px]">
          <Monkey pose="calc" size={46} />
          <div>
            <div className="text-[15px] font-bold text-[var(--ob-color-text)]">Máy tính</div>
            <div className="text-[12px] text-[var(--ob-color-text-muted)]">
              Gõ bàn phím cũng được · Esc để đóng
            </div>
          </div>
          <button
            type="button"
            ref={closeRef}
            aria-label="Đóng"
            onClick={() => onOpenChange(false)}
            className="ml-auto inline-flex h-9 w-9 flex-none items-center justify-center rounded-[var(--ob-radius-pill)] text-[var(--ob-color-text-muted)] outline-none [transition:background_var(--ob-dur-fast)_var(--ob-ease-out)] hover:bg-[var(--ob-color-surface-sunken)] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {history.length ? (
          <div className="ob-calc-hist" data-testid="calculator-history">
            {history.map((item, index) => (
              <button
                key={`${item.m}-${index}`}
                type="button"
                data-testid="calculator-history-item"
                aria-label={`Nạp lại ${item.q} bằng ${item.a}`}
                onClick={() => handleRestore(item)}
                className="flex items-center gap-2 rounded-[var(--ob-radius-md)] px-[10px] py-[6px] text-left outline-none hover:bg-[var(--ob-color-surface-sunken)] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--ob-color-text-muted)]">
                  {item.q}
                </span>
                <span className="ml-auto flex-none text-[12.5px] font-bold text-[var(--ob-color-text)]">
                  = {item.a}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div
          data-testid="calculator-out-box"
          className={cn(
            "ob-calc-out mb-[14px] rounded-[var(--ob-radius-md)] bg-[var(--ob-vo-900)] px-[16px] py-[12px] text-right",
            error && "ob-calc-shake"
          )}
        >
          <div
            dir="rtl"
            className="truncate text-[12.5px] text-[var(--ob-vo-300)]"
          >
            <span dir="ltr" data-testid="calculator-expr">
              {expr || " "}
            </span>
          </div>
          <div
            aria-live="polite"
            dir="rtl"
            className={cn(
              "truncate font-bold [font-family:var(--ob-font-num)] [font-size:clamp(22px,9cqi,30px)]",
              error ? "text-[var(--ob-do-300)]" : "text-[var(--ob-kem)]"
            )}
          >
            <span dir="ltr" data-testid="calculator-result">
              {error ? "Sai cú pháp" : out}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {KEYS.map(({ key, kind, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => hit(key)}
              aria-label={label}
              className={calcKeyVariants({ kind })}
            >
              {Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : key}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

export { CalculatorModal }
export type { CalculatorModalProps }
