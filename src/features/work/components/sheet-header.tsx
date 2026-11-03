import { X } from "lucide-react"

interface SheetHeaderProps {
  id: string
  title: string
  onClose: () => void
}

// Đầu khung trượt: tiêu đề (tên của hộp) + nút đóng, dính trên cùng khi cuộn nội dung dài.
function SheetHeader({ id, title, onClose }: SheetHeaderProps) {
  return (
    <div className="sticky -top-5 z-10 -mx-5 -mt-5 mb-4 bg-[var(--ob-color-surface)] px-5 pt-2.5 pb-3 md:-top-7 md:-mx-7 md:-mt-7 md:px-7 md:pt-6">
      <span
        aria-hidden="true"
        className="mx-auto mb-2 block h-[5px] w-11 rounded-[var(--ob-radius-pill)] bg-[var(--ob-color-border)] md:hidden"
      />
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-[19px] leading-[1.3] font-extrabold tracking-[var(--ob-track-heading)]">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="-mr-2 grid size-11 flex-none place-items-center rounded-full text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-surface-sunken)] hover:text-[var(--ob-color-text)]"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export { SheetHeader }
