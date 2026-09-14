"use client"

import { Trash2 } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { AddTagForm } from "./add-tag-form"
import type { BudgetTag } from "@/lib/settings-storage"

interface TagsCardProps {
  tags: BudgetTag[]
  onToggle: (index: number) => void
  onRemove: (index: number) => void
  onAdd: (tag: Omit<BudgetTag, "tint" | "on">) => void
}

function TagsCard({ tags, onToggle, onRemove, onAdd }: TagsCardProps) {
  return (
    <Card label="Nhãn dùng trong chi tiêu" className="min-w-0 w-full">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Bật những nhãn bạn hay dùng, thêm mới hoặc xoá bớt. Cái nào đang bật sẽ hiện khi ghi khoản chi.
      </p>
      <div>
        {tags.map((t, i) => (
          <div
            key={t.label + i}
            className={
              "flex items-center gap-[14px] py-[10px] " +
              (i < tags.length - 1 ? "border-b border-[var(--ob-color-border)]" : "")
            }
          >
            <span
              className="flex size-10 flex-none items-center justify-center rounded-full text-[21px] leading-none"
              style={{ background: t.tint }}
            >
              {t.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{t.label}</div>
              <div className="mt-0.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{t.desc}</div>
            </div>
            <Switch checked={t.on} onCheckedChange={() => onToggle(i)} className="flex-none" />
            <button
              type="button"
              aria-label={"Xoá " + t.label}
              onClick={() => onRemove(i)}
              className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        {!tags.length ? (
          <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có nhãn nào.</p>
        ) : null}
      </div>
      <AddTagForm onAdd={onAdd} />
    </Card>
  )
}

export { TagsCard }
