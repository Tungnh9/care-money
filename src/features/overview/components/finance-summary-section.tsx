import { formatLuong, formatPhan, nearestDueCard, type FinanceSummary } from "@/lib/finance/finance-calculations"
import type { CreditCard, Investment, SavingsFund } from "@/lib/finance/types"
import { Card } from "@/components/ui/card"
import { NetWorthCard } from "@/components/ob/net-worth-card"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { MiniStat } from "./mini-stat"

interface FinanceSummarySectionProps {
  savings: SavingsFund[]
  cards: CreditCard[]
  invests: Investment[]
  summary: FinanceSummary
}

interface HoldingMiniStatProps {
  icon: string
  label: string
  value: number
  quantity: number
  quantityText: string
  pl: number
}

// Ô Vàng / ô Bạc: giá trị đang giữ, gợi ý "khối lượng · lời/lỗ X" (hoà vốn thì trung tính).
function HoldingMiniStat({ icon, label, value, quantity, quantityText, pl }: HoldingMiniStatProps) {
  const { hidden } = useMoneyVisibility()
  return (
    <MiniStat
      icon={icon}
      label={label}
      value={formatMoney(value, hidden)}
      hint={
        quantity && pl === 0 ? (
          `${quantityText} · hoà vốn`
        ) : quantity ? (
          <>
            {quantityText} ·{" "}
            <span
              className="font-bold"
              style={{
                color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)",
              }}
            >
              {pl >= 0 ? "lời " : "lỗ "}
              {formatMoney(Math.abs(pl), hidden)}
            </span>
          </>
        ) : (
          "chưa có"
        )
      }
      color={quantity && pl !== 0 ? (pl > 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)") : undefined}
    />
  )
}

function FinanceSummarySection({ savings, cards, invests, summary }: FinanceSummarySectionProps) {
  const { hidden } = useMoneyVisibility()
  // Thẻ đã trả hết (dư nợ 0 ₫) không còn hạn nào phải nhắc.
  const nearestCard = nearestDueCard(cards, new Date())

  return (
    <div className="ob-card-grid flex flex-wrap gap-5">
      <div className="min-w-0 flex-[1_1_300px]">
        <NetWorthCard summary={summary} />
      </div>
      <Card label="Tài sản đang có" className="min-w-0 flex-[2_1_460px]">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <MiniStat
            icon="pig"
            label="Tiết kiệm"
            value={formatMoney(summary.savingsTotal, hidden)}
            hint={savings.length ? `${savings.length} quỹ` : "chưa có quỹ"}
            // Xanh như số Tiết kiệm ở trang Tài chính; chưa có đồng nào thì màu thường, như ô Nợ thẻ khi không nợ.
            color={summary.savingsTotal > 0 ? "var(--ob-color-income)" : undefined}
          />
          <HoldingMiniStat
            icon="gold"
            label="Vàng"
            value={summary.goldValue}
            quantity={summary.goldPhan}
            quantityText={`${formatPhan(summary.goldPhan)} phân`}
            pl={summary.goldPL}
          />
          <HoldingMiniStat
            icon="silver"
            label="Bạc"
            value={summary.silverValue}
            quantity={summary.silverLuong}
            quantityText={`${formatLuong(summary.silverLuong)} lượng`}
            pl={summary.silverPL}
          />
          <MiniStat
            icon="chart"
            label="Đầu tư"
            value={formatMoney(summary.investValue, hidden)}
            hint={invests.length ? `${invests.length} khoản` : "chưa có khoản nào"}
          />
          <MiniStat
            icon="card"
            label="Nợ thẻ"
            value={formatMoney(summary.debtTotal, hidden)}
            hint={nearestCard ? `hạn ${nearestCard.due}` : "không nợ"}
            color={summary.debtTotal ? "var(--ob-color-expense)" : undefined}
          />
        </div>
      </Card>
    </div>
  )
}

export { FinanceSummarySection }
