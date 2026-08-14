import Image from "next/image"

import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { formatMoney } from "@/lib/format"

interface PillarCardProps {
  icon: string
  label: string
  amount: number
  hint: string
  tone?: "income" | "expense"
}

function PillarCard({ icon, label, amount, hint, tone }: PillarCardProps) {
  const amountColor = tone
    ? tone === "income"
      ? "var(--ob-color-income)"
      : "var(--ob-color-expense)"
    : undefined

  return (
    <Card label={label}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]">
          <Image src={`/assets/icons/${icon}.svg`} width={23} height={23} alt="" />
        </span>
        <div className="min-w-0">
          <Figure value={<span style={{ color: amountColor }}>{formatMoney(amount)}</span>} />
          <p className="mt-1.5 text-[12.5px] text-[var(--ob-color-text-subtle)]">{hint}</p>
        </div>
      </div>
    </Card>
  )
}

export { PillarCard }
