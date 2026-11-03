"use client"

import { useId } from "react"
import { Copy, PenLine, Sunrise } from "lucide-react"

import { Card } from "@/components/ui/card"
import { ActionTooltip } from "@/components/ob/action-tooltip"
import { cn } from "@/lib/utils"
import type { WorkState } from "@/lib/work/types"
import { formatStandup, suggestStandup } from "@/lib/work/work-calculations"
import { copyText } from "../copy-text"
import { TileHeader } from "./tile-header"

const LINES = 3

interface StandupTileProps {
  state: WorkState
  today: string
  onWrite: () => void
  className?: string
}

// "- Gửi báo cáo" → "Gửi báo cáo": các dòng của 1 phần standup, bỏ gạch đầu dòng.
function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
}

const SECTION_LABEL =
  "mb-1.5 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]"

function Preview({ label, text }: { label: string; text: string }) {
  const all = lines(text)
  return (
    <div>
      <p className={SECTION_LABEL}>{label}</p>
      {all.length ? (
        <ul className="flex flex-col gap-1">
          {all.slice(0, LINES).map((line, i) => (
            <li
              key={i}
              className="relative pl-3.5 text-[13.5px] leading-[1.45] text-[var(--ob-color-text-muted)] wrap-anywhere before:absolute before:top-[0.6em] before:left-0.5 before:size-[5px] before:rounded-full before:bg-[var(--ob-color-border-strong)]"
            >
              {line}
            </li>
          ))}
          {all.length > LINES ? (
            <li className="text-[12.5px] text-[var(--ob-color-text-subtle)]">{`và ${all.length - LINES} việc nữa`}</li>
          ) : null}
        </ul>
      ) : (
        <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Chưa có gì</p>
      )}
    </div>
  )
}

// Ô Standup: xem trước bản hôm nay (đã lưu, chưa có thì bản gợi ý), mở khung soạn, copy nhanh.
function StandupTile({ state, today, onWrite, className }: StandupTileProps) {
  const titleId = useId()
  const saved = state.standups.find((s) => s.day === today) ?? null
  const fields = saved ?? suggestStandup(state, today)
  const blockers = fields.blockers.trim()

  return (
    <Card
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-4 border-[var(--ob-chuoi-200)] bg-[linear-gradient(180deg,var(--ob-color-reward-soft),var(--ob-color-surface)_46%)] p-5",
        className
      )}
    >
      <TileHeader
        id={titleId}
        icon={<Sunrise size={20} />}
        iconClassName="bg-[var(--ob-color-surface)] text-[var(--ob-chuoi-500)] shadow-[0_1px_0_var(--ob-chuoi-200)]"
        label="Standup"
        action={
          <span
            className={cn(
              "rounded-[var(--ob-radius-pill)] px-2 py-0.5 text-[11px] font-bold",
              saved
                ? "bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)]"
                : "bg-[var(--ob-color-surface)] text-[var(--ob-color-reward-text)] shadow-[inset_0_0_0_1px_var(--ob-chuoi-200)]"
            )}
          >
            {saved ? "Đã lưu" : "Chưa lưu"}
          </span>
        }
      />
      <div className="-mt-4 flex flex-col gap-4">
        <Preview label="Hôm qua" text={fields.yesterday} />
        <Preview label="Hôm nay" text={fields.today} />
        <div>
          <p className={SECTION_LABEL}>Vướng mắc</p>
          {blockers ? (
            <div className="rounded-[14px] bg-[var(--ob-color-reward-soft)] px-3 py-2.5 text-[13.5px] leading-[1.45] whitespace-pre-line text-[var(--ob-color-text)] shadow-[inset_0_0_0_1px_var(--ob-chuoi-200)] wrap-anywhere">
              {blockers}
              {saved ? null : (
                <span className="mt-0.5 block text-xs font-semibold text-[var(--ob-color-reward-text)]">
                  Từ standup trước
                </span>
              )}
            </div>
          ) : (
            <p className="text-[13.5px] text-[var(--ob-color-text-subtle)]">Không có</p>
          )}
        </div>
      </div>
      <div className="mt-auto flex gap-2 pt-1">
        <button
          type="button"
          onClick={onWrite}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--ob-radius-pill)] whitespace-nowrap bg-[var(--ob-color-surface-invert)] px-4 text-sm font-bold text-[var(--ob-color-text-invert)] hover:opacity-90"
        >
          <PenLine size={16} aria-hidden="true" className="text-[var(--ob-chuoi-300)]" />
          Viết standup
        </button>
        <ActionTooltip label="Copy standup">
          <button
            type="button"
            aria-label="Copy standup"
            onClick={() => void copyText(formatStandup({ day: today, ...fields }))}
            className="grid size-11 flex-none place-items-center rounded-full border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface)] text-[var(--ob-color-text-muted)] hover:border-[var(--ob-color-action)] hover:text-[var(--ob-color-action-strong)]"
          >
            <Copy size={17} aria-hidden="true" />
          </button>
        </ActionTooltip>
      </div>
    </Card>
  )
}

export { StandupTile }
