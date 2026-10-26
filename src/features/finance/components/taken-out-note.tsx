import { Fragment } from "react"

import { cn } from "@/lib/utils"

interface TakenOutNoteProps {
  // Từng phần đã lấy ra khỏi lần mua (takenOutParts), vd. ["đã tặng 1 phân", "đã bán 2 phân"].
  parts: string[]
  // Bảng: giữ nguyên từng phần — cột chỉ cần rộng bằng phần dài nhất. Thẻ: phần dài hơn cả ô vẫn được ngắt
  // bên trong thay vì tràn sang ô bên cạnh.
  keepPartsWhole?: boolean
}

// "đã tặng … · đã bán …" dưới khối lượng của 1 lần mua. Mỗi phần là 1 khối inline: ô hẹp thì xuống dòng ở dấu
// "·" trước khi phải ngắt giữa 1 phần — bảng giao dịch không phải nới cột cho cả câu gộp (đẩy các nút ra khỏi
// khung ở màn laptop).
function TakenOutNote({ parts, keepPartsWhole = false }: TakenOutNoteProps) {
  if (!parts.length) return null
  return (
    <div
      data-testid="taken-out-note"
      className="whitespace-normal text-[11.5px] [font-family:var(--ob-font-text)] text-[var(--ob-color-text-subtle)]"
    >
      {parts.map((part, index) => (
        <Fragment key={part}>
          {index > 0 ? " " : null}
          <span className={cn("inline-block", keepPartsWhole && "whitespace-nowrap")}>
            {index < parts.length - 1 ? `${part} ·` : part}
          </span>
        </Fragment>
      ))}
    </div>
  )
}

export { TakenOutNote }
