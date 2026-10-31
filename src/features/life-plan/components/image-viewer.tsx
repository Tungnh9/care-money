"use client"

import { useEffect, useId, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { ActionTooltip } from "@/components/ob/action-tooltip"
import { Modal } from "@/components/ui/modal"
import type { LifePlanImage as LifePlanImageData } from "@/lib/life-plan/types"
import { cn } from "@/lib/utils"
import { LifePlanImage } from "./life-plan-image"

interface ImageViewerProps {
  images: LifePlanImageData[]
  // Tiêu đề ghi chép — đặt tên cho hộp xem và cho từng ảnh.
  title: string
  initialIndex: number
  onClose: () => void
}

const NAV_BUTTON =
  "flex size-11 flex-none items-center justify-center rounded-full border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] text-[var(--ob-color-text-muted)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-action-strong)] disabled:cursor-not-allowed disabled:opacity-45"

// Xem to từng ảnh của 1 ghi chép; chuyển ảnh bằng 2 nút hay phím mũi tên trái/phải, dừng ở 2 đầu.
function ImageViewer({ images, title, initialIndex, onClose }: ImageViewerProps) {
  const [index, setIndex] = useState(initialIndex)
  const titleId = useId()
  const count = images.length
  const current = images[Math.min(index, count - 1)]

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
      if (event.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [count])

  if (!current) return null

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} ariaLabelledBy={titleId} panelClassName="max-w-[960px] p-4">
      <div className="mb-3 flex items-center gap-3">
        <div id={titleId} className="min-w-0 flex-1 truncate text-[15px] font-bold">
          {`Ảnh của ghi chép "${title}"`}
        </div>
        {count > 1 ? (
          <span className="text-[13px] whitespace-nowrap [font-family:var(--ob-font-num)] text-[var(--ob-color-text-subtle)] tabular-nums">
            {`${index + 1} / ${count}`}
          </span>
        ) : null}
        <ActionTooltip label="Đóng">
          <button type="button" aria-label="Đóng" onClick={onClose} className={cn(NAV_BUTTON, "border-transparent")}>
            <X size={18} />
          </button>
        </ActionTooltip>
      </div>
      {/* Cùng 1 khung cho mọi ảnh: đổi ảnh là đổi mã ảnh của useLifePlanImage — link của ảnh vừa rời được thu hồi. */}
      <LifePlanImage image={current} alt={`Ảnh ${index + 1} của ghi chép "${title}"`} variant="full" />
      {count > 1 ? (
        <div className="mt-3 flex justify-center gap-3">
          <ActionTooltip label="Ảnh trước" disabledReason="Đang ở ảnh đầu tiên.">
            <button
              type="button"
              aria-label="Ảnh trước"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className={NAV_BUTTON}
            >
              <ChevronLeft size={20} />
            </button>
          </ActionTooltip>
          <ActionTooltip label="Ảnh sau" disabledReason="Đang ở ảnh cuối cùng.">
            <button
              type="button"
              aria-label="Ảnh sau"
              disabled={index === count - 1}
              onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
              className={NAV_BUTTON}
            >
              <ChevronRight size={20} />
            </button>
          </ActionTooltip>
        </div>
      ) : null}
    </Modal>
  )
}

export { ImageViewer }
