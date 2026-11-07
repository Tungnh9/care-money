import type { ReactNode } from "react"
import { AlertTriangle, Check } from "lucide-react"

interface ResultBannerProps {
  ok: boolean
  title: string
  children: ReactNode
  // Nút đi kèm dưới nội dung (vd. "Hoàn tác").
  action?: ReactNode
}

// Banner kết quả của thẻ Dữ liệu (nạp file, đồng bộ): xanh khi xong, đỏ khi lỗi.
function ResultBanner({ ok, title, children, action }: ResultBannerProps) {
  return (
    <div
      className="mt-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] px-[15px] py-[13px] text-[13.5px] leading-[1.5]"
      style={{ background: ok ? "#E7F6EF" : "#FDEBF2", color: ok ? "#0E7A50" : "#B92E63" }}
    >
      {ok ? (
        <Check size={17} className="mt-[1px] flex-none" />
      ) : (
        <AlertTriangle size={17} className="mt-[1px] flex-none" />
      )}
      <div className="min-w-0 flex-1">
        <strong className="font-bold">{title}</strong>
        <br />
        {children}
        {action}
      </div>
    </div>
  )
}

export { ResultBanner }
