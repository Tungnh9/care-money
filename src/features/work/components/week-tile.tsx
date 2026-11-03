"use client"

import { useId } from "react"
import Image from "next/image"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { WorkState } from "@/lib/work/types"
import { weeklyReportData } from "@/lib/work/work-calculations"
import { TileHeader, TileLink } from "./tile-header"

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

interface WeekTileProps {
  state: WorkState
  today: string
  onOpenReport: () => void
  className?: string
}

// Ô Tuần này: số việc xong trong tuần + cột nhỏ từng ngày; mở báo cáo tuần.
function WeekTile({ state, today, onOpenReport, className }: WeekTileProps) {
  const titleId = useId()
  const { finished, perDay } = weeklyReportData(state, today)
  const max = Math.max(1, ...perDay.map((d) => d.count))

  return (
    <Card aria-labelledby={titleId} className={cn("flex flex-col p-5", className)}>
      <TileHeader
        id={titleId}
        icon={<Image src="/assets/icons/chart.svg" width={22} height={22} alt="" />}
        iconClassName="bg-[var(--ob-color-income-soft)]"
        label="Tuần này"
        action={
          <TileLink onClick={onOpenReport} label="Báo cáo tuần">
            Báo cáo
          </TileLink>
        }
      />
      <p className="flex items-baseline gap-2">
        <span className="font-[family-name:var(--ob-font-display)] text-[40px] leading-none font-extrabold tracking-[-0.03em]">
          {finished.length}
        </span>
        <span className="text-sm font-semibold text-[var(--ob-color-text-muted)]">việc xong</span>
      </p>
      <div aria-hidden="true" className="mt-auto pt-4">
        <div className="grid h-14 grid-cols-7 items-end gap-1.5">
          {perDay.map((d) => (
            <span
              key={d.day}
              className={cn(
                "block rounded-[4px]",
                d.count ? "bg-[var(--ob-color-income)]" : "bg-[var(--ob-color-border)]"
              )}
              style={{ height: d.count ? `${(d.count / max) * 100}%` : 5 }}
            />
          ))}
        </div>
        <div className="mt-1.5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-[var(--ob-color-text-subtle)]">
          {perDay.map((d, i) => (
            <span key={d.day} className={cn(d.day === today && "text-[var(--ob-color-action-strong)]")}>
              {WEEKDAY_SHORT[i]}
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

export { WeekTile }
