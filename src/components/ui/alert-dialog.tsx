"use client"

import { useId } from "react"
import type { ReactNode } from "react"

import { Button } from "./button"
import { Modal } from "./modal"
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
  // id riêng cho từng hộp: 2 hộp xác nhận có thể mở cùng lúc (vd. cloud pull async xong khi 1 hộp khác đang mở).
  const id = useId()
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      role="alertdialog"
      ariaLabelledBy={`${id}-title`}
      // Câu cảnh báo ("... sẽ không thể hoàn tác") phải được đọc trước khi người dùng bấm xác nhận —
      // focus tự động rơi vào nút "Huỷ", nên chỉ tên hộp thôi là chưa đủ.
      ariaDescribedBy={description ? `${id}-description` : undefined}
      backdropTestId="alert-dialog-backdrop"
    >
      <div
        id={`${id}-title`}
        className={cn("mb-2 text-[17px] font-bold", destructive && "text-[var(--ob-color-expense)]")}
      >
        {title}
      </div>
      {description ? (
        <p id={`${id}-description`} className="mb-5 text-sm leading-[1.6] text-[var(--ob-color-text-muted)]">
          {description}
        </p>
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
    </Modal>
  )
}

export { AlertDialog }
