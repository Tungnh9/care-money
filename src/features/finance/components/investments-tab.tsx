"use client"

import { useState } from "react"
import Image from "next/image"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Figure } from "@/components/ob/figure"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { pct1, signedMoney, type FinanceSummary } from "../finance-calculations"
import type { Investment } from "../types"
import { AddInvestForm } from "./add-invest-form"
import { EditInvestmentModal } from "./edit-investment-modal"

interface InvestmentsTabProps {
  invests: Investment[]
  summary: FinanceSummary
  onAddInvest: (invest: Omit<Investment, "id">) => void
  onUpdateInvest: (id: number, invest: Omit<Investment, "id">) => void
  onRemoveInvest: (id: number) => void
}

function InvestmentsTab({ invests, summary, onAddInvest, onUpdateInvest, onRemoveInvest }: InvestmentsTabProps) {
  const { hidden } = useMoneyVisibility()
  const { investValue, investPL, investPct } = summary
  const gain = investPL >= 0
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingInvestment = invests.find((i) => i.id === deletingId) ?? null

  return (
    <Card label="Danh mục đầu tư">
      {invests.length ? (
        <>
          <div className="mb-5 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                Giá trị hiện tại
              </div>
              <Figure value={formatMoney(investValue, hidden)} />
            </div>
            <div>
              <div className="mb-[5px] [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                Lãi / lỗ
              </div>
              <div
                className="whitespace-nowrap text-[15px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
              >
                {signedMoney(investPL, hidden)} · {pct1(investPct)}
              </div>
            </div>
          </div>

          {invests.map((investment) => {
            const pl = investment.value - investment.cost
            return (
              <div
                key={investment.id}
                className="flex flex-wrap items-center gap-3.5 border-t border-[var(--ob-color-border)] py-[13px]"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]">
                  <Image src="/assets/icons/chart.svg" width={20} height={20} alt="" />
                </span>
                <span className="min-w-[160px] flex-1 text-[14px] font-bold">
                  {investment.name}
                </span>
                <span className="whitespace-nowrap text-[13px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-subtle)]">
                  vốn {formatMoney(investment.cost, hidden)}
                </span>
                <span className="whitespace-nowrap text-[13px] [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(investment.value, hidden)}
                </span>
                <span
                  className="whitespace-nowrap text-[13px] font-bold [font-family:var(--ob-font-num)] tabular-nums"
                  style={{ color: pl >= 0 ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(pl, hidden)}
                </span>
                <div className="flex flex-none items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Sửa ${investment.name}`}
                    onClick={() => setEditingId(investment.id)}
                    className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xoá ${investment.name}`}
                    onClick={() => setDeletingId(investment.id)}
                    className="flex size-9 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )
          })}
        </>
      ) : (
        <div>
          <Figure value={formatMoney(0, hidden)} />
          <p className="mt-[10px] text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            Chưa có khoản đầu tư nào. Thêm khoản đầu tư đầu tiên để bắt đầu theo dõi lãi/lỗ.
          </p>
        </div>
      )}
      <AddInvestForm onAdd={onAddInvest} />
      <EditInvestmentModal
        investment={invests.find((i) => i.id === editingId) ?? null}
        onOpenChange={(open) => !open && setEditingId(null)}
        onSave={(id, updated) => {
          onUpdateInvest(id, updated)
          setEditingId(null)
        }}
      />
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá khoản đầu tư?"
        description={
          <>
            Xoá &quot;<strong>{deletingInvestment?.name}</strong>&quot; sẽ không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingId !== null) onRemoveInvest(deletingId)
        }}
      />
    </Card>
  )
}

export { InvestmentsTab }
