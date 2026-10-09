import Image from "next/image"

import { Figure } from "@/components/ob/figure"
import { Card } from "@/components/ui/card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"

interface PillarCardProps {
  icon: string
  label: string
  amount: number
  hint: string
  tone?: "income" | "expense"
  className?: string
}

function PillarCard({ icon, label, amount, hint, tone, className }: PillarCardProps) {
  const { hidden } = useMoneyVisibility()
  const amountColor = tone
    ? tone === "income"
      ? "var(--ob-color-income)"
      : "var(--ob-color-expense)"
    : undefined

  return (
    <Card label={label} className={className}>
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
        <span className="flex size-10 flex-none items-center justify-center rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]">
          <Image src={`/assets/icons/${icon}.svg`} width={23} height={23} alt="" />
        </span>
        {/* Ô container riêng: cỡ chữ của Figure (đơn vị cqi) đo đúng cột này — đo cả Card thì số được
            tính cho bề rộng lớn hơn cột thật ~52px (icon + khe) và tràn khỏi thẻ. Số là chuỗi thuần
            (màu đặt ở ô này, chữ thừa hưởng) để Figure tự đếm ký tự mà co chữ khi số dài. */}
        <div className="min-w-0 [container-type:inline-size]" style={{ color: amountColor }}>
          <Figure value={formatMoney(amount, hidden)} />
        </div>
        <p className="col-start-2 mt-1.5 min-w-0 text-[12.5px] text-[var(--ob-color-text-subtle)]">
          {hint}
        </p>
      </div>
    </Card>
  )
}

export { PillarCard }
