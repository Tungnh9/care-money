import { Card } from "@/components/ui/card"
import type { OnThisDayResult } from "../journal-calculations"

interface OnThisDayCardProps {
  result: OnThisDayResult
}

function OnThisDayCard({ result }: OnThisDayCardProps) {
  const { entry, label } = result

  return (
    <Card tone="reward" label={`${label}, bạn đã viết`} className="col-span-full">
      <div className="mb-2 flex flex-wrap items-center gap-x-[10px] gap-y-1">
        <span
          className="flex size-[30px] flex-none items-center justify-center rounded-full text-[16px] leading-none"
          style={{ background: entry.mood?.tint ?? "var(--ob-vo-100)" }}
        >
          {entry.mood?.emoji ?? "📝"}
        </span>
        <span className="[font-family:var(--ob-font-num)] text-[12px] opacity-[.75]">
          {entry.date} · {entry.time}
        </span>
        {entry.mood ? <span className="text-[12.5px] font-semibold">{entry.mood.label}</span> : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-[1.6]">{entry.text}</p>
    </Card>
  )
}

export { OnThisDayCard }
