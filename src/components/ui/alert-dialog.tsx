"use client"

import type { ReactNode } from "react"

import { Button } from "./button"
import { Modal } from "./modal"
import { cn } from "@/lib/utils"
import { useT } from "@/components/locale-provider"

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
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive,
}: AlertDialogProps) {
  const t = useT()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      role="alertdialog"
      ariaLabelledBy="alert-dialog-title"
      backdropTestId="alert-dialog-backdrop"
    >
      <div
        id="alert-dialog-title"
        className={cn("mb-2 text-[17px] font-bold", destructive && "text-[var(--ob-color-expense)]")}
      >
        {title}
      </div>
      {description ? (
        <p className="mb-5 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">{description}</p>
      ) : null}
      <div className="flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          {cancelLabel ?? t("common.cancel")}
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
          {confirmLabel ?? t("common.confirm")}
        </Button>
      </div>
    </Modal>
  )
}

export { AlertDialog }
