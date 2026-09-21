"use client"

import { X } from "lucide-react"

import { Card } from "@/components/ui/card"
import type { Insight } from "../insights-calculations"

interface InsightsSectionProps {
  insights: Insight[]
  onDismiss: (id: string) => void
}

function InsightsSection({ insights, onDismiss }: InsightsSectionProps) {
  if (!insights.length) return null

  return (
    <Card label="Gợi ý cho bạn" className="mb-5">
      <div className="flex flex-col gap-[10px]">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="flex items-start gap-[10px] rounded-[var(--ob-radius-md)] bg-[var(--ob-color-surface-sunken)] px-[14px] py-[11px]"
          >
            <span className="text-base leading-none">💡</span>
            <p className="min-w-0 flex-1 text-[13.5px] leading-[1.5] text-[var(--ob-color-text)]">{insight.text}</p>
            <button
              type="button"
              aria-label="Ẩn gợi ý này"
              onClick={() => onDismiss(insight.id)}
              className="flex size-6 flex-none items-center justify-center rounded-full text-[var(--ob-color-text-subtle)] hover:bg-[var(--ob-color-border)]"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}

export { InsightsSection }
