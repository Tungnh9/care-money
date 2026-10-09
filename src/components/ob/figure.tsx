import * as React from "react"

import { cn } from "@/lib/utils"

interface FigureProps {
  value: React.ReactNode
  unit?: React.ReactNode
  delta?: React.ReactNode
  direction?: "up" | "down"
  caption?: React.ReactNode
  size?: "lg" | "sm"
  // Số ký tự của dòng số, để size="lg" co chữ cho vừa bề rộng khung. Bỏ trống thì tự đếm value +
  // unit khi là chuỗi/số; truyền tay khi value là 1 node (vd. <span> tô màu) hoặc khi value đổi
  // liên tục (CountMoney đếm dần — phải đếm theo số đích, không theo số đang hiện).
  fitChars?: number
  className?: string
}

// Mỗi ký tự JetBrains Mono (--ob-font-num) rộng 0,6em, trừ tracking -0,02em còn 0,58em: chia 100cqi
// cho (số ký tự × 0,6) là cỡ lớn nhất để cả dòng số còn nằm trọn 1 dòng trong container gần nhất
// (Card, hoặc ô riêng như ở PillarCard). 13cqi giữ nguyên cỡ cũ cho số ngắn (≤ 12 ký tự); chưa biết
// số ký tự thì biến rơi về 1 → chỉ còn 13cqi như trước.
const LG_FONT_SIZE =
  "text-[length:clamp(16px,min(13cqi,calc(100cqi/var(--ob-figure-chars,1)/0.6)),36px)]"

function textLength(node: React.ReactNode): number {
  return typeof node === "string" || typeof node === "number" ? String(node).length : 0
}

function Figure({
  value,
  unit,
  delta,
  direction = "up",
  caption,
  size = "lg",
  fitChars,
  className,
}: FigureProps) {
  const up = direction === "up"
  const chars = size === "lg" ? (fitChars ?? textLength(value) + textLength(unit)) : 0
  return (
    <div className={className}>
      <div
        className={cn(
          "[font-family:var(--ob-font-num)] font-bold leading-none tracking-[-0.02em] whitespace-nowrap tabular-nums",
          size === "lg" ? LG_FONT_SIZE : "text-[length:var(--ob-size-num)]"
        )}
        style={chars > 0 ? ({ "--ob-figure-chars": String(chars) } as React.CSSProperties) : undefined}
      >
        {value}
        {unit ? <span className="opacity-50">{unit}</span> : null}
      </div>
      {delta || caption ? (
        <div className="mt-[var(--ob-space-3)] flex items-center gap-[var(--ob-space-2)] text-[13.5px]">
          {delta ? (
            <span
              className={cn(
                "font-bold",
                up ? "text-[var(--ob-la-300)]" : "text-[var(--ob-do-300)]"
              )}
            >
              {up ? "▲" : "▼"} {delta}
            </span>
          ) : null}
          {caption ? <span className="opacity-[.72]">{caption}</span> : null}
        </div>
      ) : null}
    </div>
  )
}

export { Figure }
export type { FigureProps }
