"use client"

import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { phanToChi } from "../finance-calculations"
import type { GoldStoreSummary } from "../finance-calculations"
import { GoldPLBadge } from "./gold-pl-indicator"

interface GoldStoreSummaryTableProps {
  summaries: GoldStoreSummary[]
  total: GoldStoreSummary
}

const HEADERS = ["Cửa hàng", "Khối lượng", "Giá mua", "Giá vốn", "Giá trị nay", "Lãi lỗ"]

function GoldStoreSummaryTable({ summaries, total }: GoldStoreSummaryTableProps) {
  const { hidden } = useMoneyVisibility()

  if (!summaries.length) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr>
            {HEADERS.map((header, index) => (
              <th
                key={header}
                className={
                  "whitespace-nowrap py-[8px] px-[12px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] " +
                  (index === 0 ? "text-left" : "text-right")
                }
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.store} className="border-t border-[var(--ob-color-border)]">
              <td className="whitespace-nowrap py-[8px] px-[12px] text-left text-[13px] font-bold">{s.store}</td>
              <td className="whitespace-nowrap py-[8px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                {phanToChi(s.phan)}
              </td>
              <td className="whitespace-nowrap py-[8px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                {formatMoney(s.avgBuy, hidden)}
              </td>
              <td className="whitespace-nowrap py-[8px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                {formatMoney(s.cost, hidden)}
              </td>
              <td className="whitespace-nowrap py-[8px] px-[12px] text-right text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                {formatMoney(s.value, hidden)}
              </td>
              <td className="whitespace-nowrap py-[8px] px-[12px] text-right text-[13px]">
                <GoldPLBadge pl={s.pl} hidden={hidden} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--ob-color-border)]">
            <td
              className="whitespace-nowrap py-[10px] px-[12px] text-left text-[13.5px] font-bold"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              Tổng cộng
            </td>
            <td
              className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              {phanToChi(total.phan)}
            </td>
            <td
              className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              {formatMoney(total.avgBuy, hidden)}
            </td>
            <td
              className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              {formatMoney(total.cost, hidden)}
            </td>
            <td
              className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
              style={{ color: "var(--ob-color-action-strong)" }}
            >
              {formatMoney(total.value, hidden)}
            </td>
            <td className="whitespace-nowrap py-[10px] px-[12px] text-right text-[13.5px]">
              <GoldPLBadge pl={total.pl} hidden={hidden} />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export { GoldStoreSummaryTable }
