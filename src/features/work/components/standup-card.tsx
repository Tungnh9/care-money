"use client"

import { useState } from "react"
import { Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { formatDayKey } from "@/lib/date"
import { formatStandup, suggestStandup } from "@/lib/work/work-calculations"
import type { StandupEntry, WorkState } from "@/lib/work/types"
import { copyText } from "../copy-text"

type StandupFields = Omit<StandupEntry, "day">

const RECENT_SHOWN = 7

interface StandupCardProps {
  state: WorkState
  today: string
  onSave: (day: string, fields: StandupFields) => boolean
  className?: string
}

function StandupCard({ state, today, onSave, className }: StandupCardProps) {
  // Chưa gõ gì thì ô luôn đi theo nguồn (bản đã lưu của ngày, không có thì gợi ý từ danh sách việc) —
  // nên dữ liệu nạp xong sau lần render đầu, hay việc vừa tick ở tab khác, vẫn hiện đúng. Gõ rồi thì giữ
  // nguyên bản đang gõ cho tới khi Lưu hoặc bấm "Gợi ý lại". Bản nháp nhớ luôn ngày bắt đầu gõ: để trang
  // mở qua nửa đêm, bản đang gõ vẫn lưu vào đúng ngày đó chứ không nhảy sang ngày mới.
  const [draft, setDraft] = useState<{ day: string; fields: StandupFields } | null>(null)
  const day = draft?.day ?? today
  const saved = state.standups.find((s) => s.day === day) ?? null
  const source: StandupFields = saved
    ? { yesterday: saved.yesterday, today: saved.today, blockers: saved.blockers }
    : suggestStandup(state, day)
  const fields = draft?.fields ?? source

  function edit(key: keyof StandupFields, value: string) {
    setDraft({ day, fields: { ...fields, [key]: value } })
  }

  function handleSave() {
    if (onSave(day, fields)) setDraft(null)
  }

  const status = draft ? (saved ? "Có thay đổi chưa lưu" : "Chưa lưu bản hôm nay") : saved ? "Đã lưu bản hôm nay" : "Chưa lưu bản hôm nay"
  const recent = state.standups
    .filter((s) => s.day !== day)
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, RECENT_SHOWN)

  return (
    <Card label={`Standup · ${formatDayKey(day)}`} className={className}>
      <div className="flex flex-col gap-3">
        <Textarea label="Hôm qua" rows={4} value={fields.yesterday} onChange={(e) => edit("yesterday", e.target.value)} />
        <Textarea label="Hôm nay" rows={4} value={fields.today} onChange={(e) => edit("today", e.target.value)} />
        <Textarea
          label="Vướng mắc"
          rows={2}
          hint="Để trống nếu không có"
          value={fields.blockers}
          onChange={(e) => edit("blockers", e.target.value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-[10px]">
        <span className="mr-auto text-xs text-[var(--ob-color-text-subtle)]">
          {status}
        </span>
        <Button variant="ghost" size="sm" type="button" onClick={() => setDraft({ day, fields: suggestStandup(state, day) })}>
          Gợi ý lại
        </Button>
        <Button variant="outline" size="sm" type="button" onClick={() => void copyText(formatStandup({ day, ...fields }))}>
          Copy
        </Button>
        <Button variant="primary" size="sm" type="button" onClick={handleSave}>
          Lưu
        </Button>
      </div>

      {recent.length ? (
        <div className="mt-5 border-t border-[var(--ob-color-border)] pt-4">
          <span className="mb-2 block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
            Các bản trước
          </span>
          <ul className="flex flex-col gap-2">
            {recent.map((s) => (
              <li key={s.day} className="flex items-start gap-2 rounded-[var(--ob-radius-md)] bg-[var(--ob-vo-100)] p-3">
                <div className="min-w-0 flex-1 text-[13px] leading-[1.5]">
                  <div className="mb-1 font-bold">{formatDayKey(s.day)}</div>
                  <div className="whitespace-pre-line text-[var(--ob-color-text-muted)] wrap-anywhere">{s.today.trim() || "—"}</div>
                </div>
                <button
                  type="button"
                  aria-label={`Copy standup ${formatDayKey(s.day)}`}
                  onClick={() => void copyText(formatStandup(s))}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] hover:text-[var(--ob-color-action-strong)]"
                >
                  <Copy size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

export { StandupCard }
