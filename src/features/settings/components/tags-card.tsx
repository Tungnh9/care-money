"use client"

import { useId, useState } from "react"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { BudgetTag } from "@/lib/settings/settings-storage"
import { ShowMoreButton, collapsedRowCount } from "./show-more-button"

interface TagsCardProps {
  tags: BudgetTag[]
  onToggle: (index: number) => void
}

function TagsCard({ tags, onToggle }: TagsCardProps) {
  // Công tắc của Base UI tự lấy tên từ <label> bọc ngoài — ở đây label chỉ chứa chính công tắc nên tên
  // rỗng. Trỏ aria-labelledby vào chữ tên nhãn đang hiện bên cạnh (aria-label không dùng được: Base UI
  // luôn đặt aria-labelledby khi không được truyền, và aria-labelledby thắng aria-label).
  const idPrefix = useId()
  // Thu gọn thì chỉ hiện nửa đầu (xem ShowMoreButton). Cắt từ đầu danh sách nên `i` vẫn là chỉ số trong `tags`.
  const [expanded, setExpanded] = useState(false)
  const rowCount = collapsedRowCount(tags.length)
  const visibleTags = expanded ? tags : tags.slice(0, rowCount)

  return (
    <Card label="Nhãn dùng trong chi tiêu" className="min-w-0 w-full">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Bật những nhãn bạn hay dùng. Cái nào đang bật sẽ hiện khi ghi khoản chi.
      </p>
      <div>
        {visibleTags.map((t, i) => (
          <div
            key={t.label + i}
            className={
              "flex items-center gap-[14px] py-[10px] " +
              (i < visibleTags.length - 1 ? "border-b border-[var(--ob-color-border)]" : "")
            }
          >
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full text-[21px] leading-none"
              style={{ background: t.tint }}
            >
              {t.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div id={`${idPrefix}-tag-${i}`} className="text-sm font-bold">
                {t.label}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{t.desc}</div>
            </div>
            <Switch
              checked={t.on}
              onCheckedChange={() => onToggle(i)}
              aria-labelledby={`${idPrefix}-tag-${i}`}
              className="flex-none"
            />
          </div>
        ))}
        {!tags.length ? <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có nhãn nào.</p> : null}
      </div>
      {tags.length > rowCount ? (
        <ShowMoreButton expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
      ) : null}
    </Card>
  )
}

export { TagsCard }
