"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { Button } from "./button"
import { cn } from "@/lib/utils"

interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  destructive,
}: AlertDialogProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        data-testid="alert-dialog-backdrop"
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--ob-vo-900)]/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        className="relative w-full max-w-[400px] rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] p-6 shadow-[var(--ob-shadow-md)]"
      >
        <div
          id="alert-dialog-title"
          className={cn(
            "mb-2 text-[17px] font-bold",
            destructive && "text-[var(--ob-color-expense)]"
          )}
        >
          {title}
        </div>
        {description ? (
          <p className="mb-5 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">{description}</p>
        ) : null}
        <div className="flex justify-end gap-[10px]">
          <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className={cn(
              destructive &&
                "!border-[var(--ob-color-expense)] !text-[var(--ob-color-expense)] hover:!bg-[var(--ob-color-expense)]/10"
            )}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export { AlertDialog }
