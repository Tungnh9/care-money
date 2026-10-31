"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { isTargetMonth, isTargetYear } from "@/lib/life-plan/life-plan-storage"
import type { LifePlan, LifePlanInput, LifePlanStatus } from "@/lib/life-plan/types"
import { cn } from "@/lib/utils"
import { PLAN_STATUSES } from "../labels"

interface PlanFormModalProps {
  // null = kế hoạch mới.
  plan: LifePlan | null
  // Trả true khi đã ghi — form chỉ đóng khi true (lỗi đã được báo toast).
  onSubmit: (input: LifePlanInput) => boolean
  onClose: () => void
}

// Thêm/sửa kế hoạch: tên và năm muốn đạt bắt buộc, tháng không bắt buộc. Ngày đạt do hook tự ghi theo trạng thái.
// Nơi gọi chỉ dựng form lúc mở (và đổi `key` theo kế hoạch), nên state khởi tạo từ `plan` là đủ.
function PlanFormModal({ plan, onSubmit, onClose }: PlanFormModalProps) {
  const titleId = useId()
  const [title, setTitle] = useState(plan?.title ?? "")
  const [yearText, setYearText] = useState(plan ? String(plan.targetYear) : "")
  const [monthText, setMonthText] = useState(plan?.targetMonth === undefined ? "" : String(plan.targetMonth))
  const [status, setStatus] = useState<LifePlanStatus>(plan?.status ?? "planned")
  const [note, setNote] = useState(plan?.note ?? "")

  const year = Number(yearText.trim())
  const month = monthText.trim() === "" ? undefined : Number(monthText.trim())
  const yearInvalid = yearText.trim() !== "" && !isTargetYear(year)
  const monthInvalid = month !== undefined && !isTargetMonth(month)
  const disabled = !title.trim() || !yearText.trim() || yearInvalid || monthInvalid

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (disabled) return
    const input: LifePlanInput = {
      title: title.trim(),
      targetYear: year,
      ...(month !== undefined ? { targetMonth: month } : {}),
      status,
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    if (onSubmit(input)) onClose()
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} ariaLabelledBy={titleId} panelClassName="max-w-[460px]">
      <div id={titleId} className="mb-4 text-[17px] font-bold">
        {plan ? "Sửa kế hoạch" : "Thêm kế hoạch"}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field
          label="Tên kế hoạch"
          placeholder="vd: Mua nhà"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex flex-wrap gap-3">
          <Field
            className="min-w-0 flex-[1_1_160px]"
            label="Năm muốn đạt"
            placeholder="vd: 2030"
            inputMode="numeric"
            value={yearText}
            onChange={(e) => setYearText(e.target.value)}
            invalid={yearInvalid}
            hint={yearInvalid ? "Nhập năm 4 chữ số, vd: 2030" : undefined}
          />
          <Field
            className="min-w-0 flex-[1_1_160px]"
            label="Tháng"
            placeholder="Không bắt buộc"
            inputMode="numeric"
            value={monthText}
            onChange={(e) => setMonthText(e.target.value)}
            invalid={monthInvalid}
            hint={monthInvalid ? "Tháng từ 1 đến 12, hoặc để trống" : undefined}
          />
        </div>

        <div>
          <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] uppercase">
            Trạng thái
          </span>
          <div role="group" aria-label="Trạng thái" className="grid grid-cols-3 gap-2">
            {PLAN_STATUSES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={status === value}
                onClick={() => setStatus(value)}
                className={cn(
                  "min-h-[var(--ob-hit-min)] rounded-[var(--ob-radius-md)] border-[1.5px] text-[13.5px] font-semibold",
                  status === value
                    ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                    : "border-[var(--ob-color-border)] text-[var(--ob-color-text-muted)]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Ghi chú" placeholder="Không bắt buộc" value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="mt-2 flex justify-end gap-[10px]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={disabled}>
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export { PlanFormModal }
