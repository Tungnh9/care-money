"use client"

import { cloneElement, useId, type ReactElement } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ActionElementProps {
  className?: string
  disabled?: boolean
  "aria-describedby"?: string
}

interface ActionTooltipProps {
  // Tên ngắn của hành động hiện khi rê chuột/focus vào nút icon: "Sửa", "Xoá", "Tặng"...
  label: string
  // Nút đang khoá thì hiện lý do này thay cho `label`.
  disabledReason?: string
  // Đúng 1 nút (hoặc link) chỉ có icon; giữ nguyên aria-label của nó để trình đọc màn hình đọc tên đầy đủ.
  children: ReactElement<ActionElementProps>
}

function ActionTooltip({ label, disabledReason, children }: ActionTooltipProps) {
  const reasonId = useId()

  if (!children.props.disabled) {
    return (
      <Tooltip>
        <TooltipTrigger render={children} />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    )
  }

  // Nút disabled không nhận sự kiện chuột ở mọi trình duyệt: span bọc ngoài làm trigger (flex như chính nút, để
  // nút không xê dịch khi đổi giữa khoá/mở), nút bên trong pointer-events-none để chuột rơi xuống span. Tooltip
  // của Base UI chỉ để nhìn, nên lý do khoá gắn vào nút qua aria-describedby trỏ tới 1 span `hidden`: vẫn được đọc
  // làm mô tả, nhưng không lọt vào tên của <label> bao ngoài (ô Secret ở Cài đặt) hay bị đọc thêm lần nữa.
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="flex flex-none cursor-not-allowed" />}>
        {cloneElement(children, {
          className: cn(children.props.className, "pointer-events-none"),
          "aria-describedby": disabledReason ? reasonId : children.props["aria-describedby"],
        })}
        {disabledReason ? (
          <span id={reasonId} hidden>
            {disabledReason}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>{disabledReason ?? label}</TooltipContent>
    </Tooltip>
  )
}

export { ActionTooltip }
