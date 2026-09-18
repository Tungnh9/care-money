"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { MOCK_ACCOUNT } from "@/lib/mock-account"
import { MAX_ATTEMPTS, LOCKOUT_MINUTES } from "@/lib/use-attempt-lockout"

interface ConfirmWipeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLocked: boolean
  remainingAttempts: number
  registerFailure: () => void
  registerSuccess: () => void
}

// Nhận isLocked/remainingAttempts/registerFailure/registerSuccess qua props thay vì tự gọi
// useAttemptLockout ở đây — ResetCard là nơi DUY NHẤT giữ hook này, để trạng thái khoá đồng bộ
// ngay khi vừa khoá (2 instance hook độc lập cùng đọc 1 storageKey sẽ không tự đồng bộ React
// state với nhau, chỉ đồng bộ đúng lúc mount).
function ConfirmWipeModal({
  open,
  onOpenChange,
  onConfirm,
  isLocked,
  remainingAttempts,
  registerFailure,
  registerSuccess,
}: ConfirmWipeModalProps) {
  const [password, setPassword] = useState("")

  if (!open) return null

  function handleConfirm() {
    if (password === MOCK_ACCOUNT.password) {
      registerSuccess()
      setPassword("")
      onConfirm()
      onOpenChange(false)
      return
    }

    const attemptsLeftAfterThis = remainingAttempts - 1
    registerFailure()
    setPassword("")
    if (attemptsLeftAfterThis <= 0) {
      toast.error(`Bạn đã nhập sai quá ${MAX_ATTEMPTS} lần. Tính năng xoá dữ liệu bị khoá tạm ${LOCKOUT_MINUTES} phút.`)
    } else {
      toast.error(`Sai mật khẩu. Còn ${attemptsLeftAfterThis} lần thử.`)
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} ariaLabelledBy="confirm-wipe-title">
      <div id="confirm-wipe-title" className="mb-1 text-[17px] font-bold">
        Xác nhận xoá toàn bộ dữ liệu
      </div>
      <p className="mb-4 text-sm text-[var(--ob-color-text-muted)]">
        Nhập mật khẩu đăng nhập để xác nhận. Hành động này không thể hoàn tác.
      </p>

      <Field
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        autoFocus
        disabled={isLocked}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={isLocked || !password} onClick={handleConfirm}>
          Xác nhận
        </Button>
      </div>
    </Modal>
  )
}

export { ConfirmWipeModal }
