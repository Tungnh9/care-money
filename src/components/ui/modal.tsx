"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

// Phần tử nhận Tab được trong panel — dùng cho cả focus tự động lúc mở lẫn 2 đầu của bẫy Tab. Input bị
// khoá, input type="hidden" và input ẩn tabIndex=-1 (Switch/Checkbox của Base UI render kèm 1 cái) không
// nhận focus được nên không được làm đầu/cuối vòng Tab. Dùng :disabled (không phải [disabled]) để bắt cả
// control nằm trong <fieldset disabled> và phần tử đã khoá nhưng vẫn mang tabindex.
const FOCUSABLE_SELECTOR = [
  "button:not(:disabled)",
  "[href]",
  'input:not(:disabled):not([type="hidden"]):not([tabindex="-1"])',
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[tabindex]:not([tabindex="-1"]):not(:disabled)',
].join(",")

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  role?: "dialog" | "alertdialog"
  ariaLabelledBy?: string
  // id của đoạn mô tả (vd. câu cảnh báo của AlertDialog) — trình đọc màn hình đọc nó cùng tên hộp.
  ariaDescribedBy?: string
  ariaLabel?: string
  backdropTestId?: string
  panelClassName?: string
}

function Modal({
  open,
  onOpenChange,
  children,
  role = "dialog",
  ariaLabelledBy,
  ariaDescribedBy,
  ariaLabel,
  backdropTestId = "modal-backdrop",
  panelClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const pendingRestoreRef = useRef<number | null>(null)

  // Capture whatever had focus right BEFORE this render's content mounts — must happen during
  // render (not in an effect), since a child's `autoFocus` fires during the commit's mutation
  // phase, which always runs before any useEffect, including ours. This is the React-sanctioned
  // "adjust state during render" pattern (setState guarded by a change check), which stays
  // correct and idempotent under Strict Mode's double-render.
  const [wasOpen, setWasOpen] = useState(false)
  const [previouslyFocused, setPreviouslyFocused] = useState<HTMLElement | null>(null)
  if (open && !wasOpen) {
    setPreviouslyFocused(document.activeElement as HTMLElement | null)
  }
  if (open !== wasOpen) setWasOpen(open)

  useEffect(() => {
    if (!open) return

    // A fresh setup means any restore scheduled by an immediately-prior cleanup was Strict
    // Mode's simulated cleanup (mount → cleanup → mount, all synchronous, same open=true) —
    // not a real close. Cancel it so it doesn't steal focus back from this render's content.
    if (pendingRestoreRef.current !== null) {
      window.clearTimeout(pendingRestoreRef.current)
      pendingRestoreRef.current = null
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const autoFocusTimer = window.setTimeout(() => {
      const panel = panelRef.current
      if (!panel || panel.contains(document.activeElement)) return
      panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()
    }, 0)

    return () => {
      window.clearTimeout(autoFocusTimer)
      document.body.style.overflow = previousOverflow
      // Defer the restore instead of calling it here directly: if this cleanup turns out to be
      // Strict Mode's simulated one, the immediately-following re-setup above cancels it before
      // it fires. A real close/unmount has no such re-setup, so it fires and restores focus.
      pendingRestoreRef.current = window.setTimeout(() => {
        pendingRestoreRef.current = null
        previouslyFocused?.focus()
      }, 0)
    }
  }, [open, previouslyFocused])

  useEffect(() => {
    if (!open) return

    function trapTab(e: KeyboardEvent) {
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (!focusable.length) return
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
        onOpenChange(false)
        return
      }
      if (e.key === "Tab") trapTab(e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        data-testid={backdropTestId}
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--ob-vo-900)]/40 backdrop-blur-[7px] backdrop-saturate-[0.9]"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        className={cn(
          // Cao tối đa bằng lớp phủ (màn hình trừ đệm p-4), nội dung cao hơn thì tự cuộn bên trong — điện
          // thoại xoay ngang/cửa sổ thấp vẫn thấy tiêu đề và tới được nút cuối. Cuộn trong hộp chứ không
          // cuộn cả lớp phủ, để nền mờ absolute vẫn phủ kín màn hình và cuộn được ở mọi chỗ trên hộp.
          "relative max-h-full w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]",
          panelClassName
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export { Modal }
export type { ModalProps }
