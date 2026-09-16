"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAttemptLockout, MAX_ATTEMPTS, LOCKOUT_MINUTES } from "@/lib/use-attempt-lockout"
import { ConfirmWipeModal } from "./confirm-wipe-modal"

const RESET_LOCKOUT_STORAGE_KEY = "reset-lockout"

interface ResetCardProps {
  counts: string[]
  onWipe: () => void
  onExport: () => void
}

function ResetCard({ counts, onWipe, onExport }: ResetCardProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { isLocked, remainingAttempts, registerFailure, registerSuccess } = useAttemptLockout(
    RESET_LOCKOUT_STORAGE_KEY
  )

  // Khoá xảy ra ngay khi đang ở step 1 (modal xác nhận mở) — nếu không reset ngay lúc này, step/
  // confirmOpen vẫn giữ nguyên "1"/true suốt 10 phút khoá; đến lúc tự mở khoá lại (component vẫn
  // đang mounted, vd. để nguyên tab), card sẽ rơi thẳng vào nhánh step===1 và tự bật lại modal xin
  // mật khẩu mà không do người dùng bấm gì — reset về đầu ngay khi khoá để tránh việc đó. Điều
  // chỉnh synchronously ngay trong render (giống pattern wasOpen ở Modal/SettleMonthModal), không
  // dùng useEffect, để tránh cascading render không cần thiết.
  const [wasLocked, setWasLocked] = useState(false)
  if (isLocked && !wasLocked) {
    setStep(0)
    setConfirmOpen(false)
  }
  if (isLocked !== wasLocked) setWasLocked(isLocked)

  function handleConfirmedWipe() {
    try {
      onWipe()
      toast.success("Đã xoá toàn bộ dữ liệu.")
      setStep(2)
    } catch {
      toast.error("Xoá dữ liệu thất bại. Vui lòng thử lại.")
    }
  }

  if (isLocked) {
    return (
      <Card label="Bắt đầu lại" className="min-w-0 flex-[1_1_300px]">
        <div className="flex items-start gap-[11px] rounded-[var(--ob-radius-md)] bg-[#FDEBF2] px-[15px] py-[13px] text-[#B92E63]">
          <AlertTriangle size={18} className="mt-[1px] flex-none" />
          <div className="text-[13.5px] leading-[1.5]">
            Tính năng này đang bị khoá do nhập sai mật khẩu quá {MAX_ATTEMPTS} lần. Vui lòng thử lại sau{" "}
            {LOCKOUT_MINUTES} phút.
          </div>
        </div>
      </Card>
    )
  }

  if (step === 2) {
    return (
      <Card label="Bắt đầu lại" className="min-w-0 flex-[1_1_300px]">
        <div className="flex items-start gap-[11px]">
          <span className="flex size-[38px] flex-none items-center justify-center">
            <Image src="/assets/icons/check.svg" width={36} height={36} alt="" />
          </span>
          <div className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            <strong className="font-bold text-[var(--ob-color-text)]">Đã xoá sạch.</strong>
            <br />
            Nhật ký, vàng, đầu tư, tiết kiệm, nợ thẻ, chuỗi ngày và số đã học đều về 0 — bắt đầu lại từ
            Tổng quan.
          </div>
        </div>
      </Card>
    )
  }

  if (step === 1) {
    return (
      <Card label="Bắt đầu lại" className="min-w-0 flex-[1_1_300px]">
        <div className="mb-4 flex items-start gap-[11px] rounded-[var(--ob-radius-md)] bg-[#FDEBF2] px-[15px] py-[13px] text-[#B92E63]">
          <AlertTriangle size={18} className="mt-[1px] flex-none" />
          <div className="text-[13.5px] leading-[1.5]">
            {counts.length ? (
              <>
                Sẽ xoá <strong className="font-bold">{counts.join(", ")}</strong>. Không khôi phục được — nên
                xuất một bản sao trước.
              </>
            ) : (
              "Không còn gì để xoá."
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="!border-[var(--ob-color-expense)] !text-[var(--ob-color-expense)]"
            onClick={() => setConfirmOpen(true)}
          >
            Xoá vĩnh viễn
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              setStep(0)
              onExport()
            }}
          >
            Xuất bản sao trước
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => setStep(0)}>
            Huỷ
          </Button>
        </div>

        <ConfirmWipeModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleConfirmedWipe}
          isLocked={isLocked}
          remainingAttempts={remainingAttempts}
          registerFailure={registerFailure}
          registerSuccess={registerSuccess}
        />
      </Card>
    )
  }

  return (
    <Card label="Bắt đầu lại" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.
      </p>
      <p className="mb-[14px] text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]">
        Cần nhập lại mật khẩu đăng nhập để xác nhận. Nhập sai quá {MAX_ATTEMPTS} lần sẽ khoá tính năng này trong{" "}
        {LOCKOUT_MINUTES} phút.
      </p>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="!border-[var(--ob-color-expense)] !text-[var(--ob-color-expense)]"
        onClick={() => setStep(1)}
      >
        Xoá toàn bộ dữ liệu
      </Button>
    </Card>
  )
}

export { ResetCard }
