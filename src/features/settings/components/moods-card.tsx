"use client"

import { Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AddMoodForm } from "./add-mood-form"
import type { Mood } from "@/lib/settings-storage"

interface MoodsCardProps {
  moods: Mood[]
  onToggle: (index: number) => void
  onRemove: (index: number) => void
  onAdd: (mood: Omit<Mood, "tint" | "on">) => void
}

function MoodsCard({ moods, onToggle, onRemove, onAdd }: MoodsCardProps) {
  return (
    <Card label="Tâm trạng dùng trong nhật ký" className="col-span-full">
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
              title={"Xoá " + m.label}
              onClick={() => onRemove(i)}
              className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)]"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        {!moods.length ? (
          <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có tâm trạng nào.</p>
        ) : null}
      </div>
      <AddMoodForm onAdd={onAdd} />
    </Card>
  )
}

export { MoodsCard }
