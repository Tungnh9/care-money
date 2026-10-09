"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AddMoodForm } from "./add-mood-form"
import type { Mood } from "@/lib/settings-storage"

interface MoodsCardProps {
  moods: Mood[]
  onToggle: (index: number) => void
  onRemove: (index: number) => void
  onAdd: (mood: Omit<Mood, "tint" | "on" | "score">) => void
}

function MoodsCard({ moods, onToggle, onRemove, onAdd }: MoodsCardProps) {
  // Xoá hỏi lại trước (như mọi nút xoá ở trang Tài chính): thêm lại qua "Thêm tâm trạng" luôn ra điểm
  // 3 và màu khác, nên xoá nhầm "Tuyệt vời" (điểm 5) là gợi ý chi tiêu–tâm trạng lệch mãi về sau.
  // Hộp thoại tìm lại mood theo tên lúc xác nhận vì tab khác có thể đã đổi danh sách.
  const [deleting, setDeleting] = useState<string | null>(null)

  return (
    <Card label="Tâm trạng dùng trong nhật ký" className="min-w-0 w-full">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Bật những trạng thái bạn hay dùng, thêm mới hoặc xoá bớt. Cái nào đang bật sẽ thành chip ở màn Nhật ký.
      </p>
      <div>
        {moods.map((m, i) => (
          <div
            key={m.label + i}
            className={
              "flex items-center gap-[14px] py-[10px] " +
              (i < moods.length - 1 ? "border-b border-[var(--ob-color-border)]" : "")
            }
          >
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full text-[21px] leading-none"
              style={{ background: m.tint }}
            >
              {m.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{m.label}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{m.desc}</div>
            </div>
            <Switch checked={m.on} onCheckedChange={() => onToggle(i)} className="flex-none" />
            <button
              type="button"
              aria-label={"Xoá " + m.label}
              onClick={() => setDeleting(m.label)}
              className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        {!moods.length ? (
          <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có tâm trạng nào.</p>
        ) : null}
      </div>
      <AddMoodForm onAdd={onAdd} existingLabels={moods.map((m) => m.label)} />
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Xoá tâm trạng?"
        description={
          <>
            Xoá &quot;<strong>{deleting}</strong>&quot; sẽ không thể hoàn tác — thêm lại sau cũng không lấy
            lại được màu và điểm tâm trạng cũ. Muốn ẩn khỏi màn Nhật ký thì chỉ cần tắt công tắc.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          const index = moods.findIndex((m) => m.label === deleting)
          if (index !== -1) onRemove(index)
        }}
      />
    </Card>
  )
}

export { MoodsCard }
