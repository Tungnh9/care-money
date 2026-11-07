"use client"

import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"

interface DiscardConfirmProps {
  title: string
  detail: string
  discardLabel: string
  onKeep: () => void
  onDiscard: () => void
}

// Hỏi lại ngay trong form trước khi bỏ chữ/ảnh đang soạn (chạm ra ngoài, Esc hay Huỷ) — thay chỗ hàng nút Huỷ/Lưu,
// không mở thêm 1 hộp thoại chồng lên form. Focus vào "Tiếp tục soạn": lỡ bấm Enter thì vẫn giữ được chữ.
function DiscardConfirm({ title, detail, discardLabel, onKeep, onDiscard }: DiscardConfirmProps) {
  const keepRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    keepRef.current?.focus()
  }, [])

  return (
    <div
      role="alert"
      className="mt-2 rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-do-300)] bg-[var(--ob-do-50)] p-3"
    >
      <p className="text-[14px] font-bold text-[var(--ob-color-expense)]">{title}</p>
      <p className="mt-1 text-[13px] leading-[1.5] text-[var(--ob-color-text-muted)]">{detail}</p>
      <div className="mt-3 flex flex-wrap justify-end gap-[10px]">
        <Button ref={keepRef} variant="primary" size="sm" type="button" onClick={onKeep}>
          Tiếp tục soạn
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onDiscard} className="text-[var(--ob-color-expense)]">
          {discardLabel}
        </Button>
      </div>
    </div>
  )
}

export { DiscardConfirm }
