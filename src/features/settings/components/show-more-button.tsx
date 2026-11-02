import { ChevronDown, ChevronUp } from "lucide-react"

// Như danh sách lần mua vàng ở trang Tài chính: thu gọn thì chỉ hiện nửa đầu danh sách, bấm "Xem thêm" là hiện hết,
// "Thu gọn" để về như cũ — danh sách đổi ngay, không có hiệu ứng trượt. Danh sách từ 4 dòng trở xuống hiện hết luôn,
// không có nút.
const MIN_COLLAPSED_ROWS = 4

function collapsedRowCount(total: number): number {
  return Math.max(MIN_COLLAPSED_ROWS, Math.ceil(total / 2))
}

interface ShowMoreButtonProps {
  expanded: boolean
  onToggle: () => void
}

// Mũi tên sau chữ chỉ hướng danh sách sẽ đổi: xuống khi còn dòng để mở thêm, lên khi bấm để thu lại.
function ShowMoreButton({ expanded, onToggle }: ShowMoreButtonProps) {
  return (
    <div className="mt-1 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex min-h-[var(--ob-hit-min)] items-center gap-1 px-3 text-[12.5px] font-semibold text-[var(--ob-color-action-strong)]"
      >
        {expanded ? "Thu gọn" : "Xem thêm"}
        {expanded ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
      </button>
    </div>
  )
}

export { ShowMoreButton, collapsedRowCount }
