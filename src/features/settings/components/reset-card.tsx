"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface ResetCardProps {
  counts: string[]
  onWipe: () => void
  onExport: () => void
}

function ResetCard({ counts, onWipe, onExport }: ResetCardProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0)

  if (step === 2) {
    return (
      <Card label="Bắt đầu lại">
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
      <Card label="Bắt đầu lại">
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
            onClick={() => {
              onWipe()
              setStep(2)
            }}
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
      </Card>
    )
  }

  return (
    <Card label="Bắt đầu lại">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Xoá sạch chi tiêu, nhật ký và chuỗi ngày. Không khôi phục được.
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
