"use client"

import { useState } from "react"
import { Calculator, Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { SavingsFund } from "../types"
import { AddSavingsFundForm } from "./add-savings-fund-form"
import { AdjustSavingsFundModal } from "./adjust-savings-fund-modal"
import { EditSavingsFundModal } from "./edit-savings-fund-modal"

interface SavingsTabProps {
  savings: SavingsFund[]
  onAddSavingsFund: (fund: SavingsFund) => void
  onUpdateSavingsFund: (originalName: string, fund: SavingsFund) => void
  onRemoveSavingsFund: (name: string) => void
}

function SavingsTab({
  savings,
  onAddSavingsFund,
  onUpdateSavingsFund,
  onRemoveSavingsFund,
}: SavingsTabProps) {
  const { hidden } = useMoneyVisibility()
  const [editingName, setEditingName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [adjustingName, setAdjustingName] = useState<string | null>(null)
  const savingsTotal = savings.reduce((sum, fund) => sum + fund.amount, 0)

  return (
    <Card label={`Tiết kiệm · ${formatMoney(savingsTotal, hidden)}`}>
      {savings.length ? (
        savings.map((fund) => (
          <div
            key={fund.name}
            className="border-b border-[var(--ob-color-border)] py-[14px] last:border-b-0"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[14px] font-bold">{fund.name}</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={`Điều chỉnh số dư ${fund.name}`}
                  onClick={() => setAdjustingName(fund.name)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-action-strong)]"
                >
                  <Calculator size={17} />
                </button>
                <button
                  type="button"
                  aria-label={`Sửa ${fund.name}`}
                  onClick={() => setEditingName(fund.name)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  aria-label={`Xoá ${fund.name}`}
                  onClick={() => setDeletingName(fund.name)}
                  className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)]"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
            <Progress
              value={Math.min((fund.amount / fund.target) * 100, 100)}
              tone="action"
              label={formatMoney(fund.amount, hidden)}
              hint={`trên ${formatMoney(fund.target, hidden)}`}
            />
            {fund.note ? (
              <div className="mt-2 text-[12.5px] text-[var(--ob-color-text-subtle)]">
                {fund.note}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
          Chưa có quỹ tiết kiệm nào. Thêm quỹ đầu tiên để bắt đầu theo dõi mục tiêu.
        </p>
      )}
      <AddSavingsFundForm onAdd={onAddSavingsFund} />
      <AdjustSavingsFundModal
        key={adjustingName}
        open={!!adjustingName}
        fund={savings.find((f) => f.name === adjustingName) ?? null}
        onOpenChange={(open) => !open && setAdjustingName(null)}
        onConfirm={(updated) => onUpdateSavingsFund(updated.name, updated)}
      />
      <EditSavingsFundModal
        fund={savings.find((f) => f.name === editingName) ?? null}
        onOpenChange={(open) => !open && setEditingName(null)}
        onSave={(updated) => {
          if (editingName) onUpdateSavingsFund(editingName, updated)
          setEditingName(null)
        }}
      />
      <AlertDialog
        open={!!deletingName}
        onOpenChange={(open) => !open && setDeletingName(null)}
        title="Xoá quỹ tiết kiệm?"
        description={
          <>
            Xoá &quot;<strong>{deletingName}</strong>&quot; sẽ không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingName) onRemoveSavingsFund(deletingName)
        }}
      />
    </Card>
  )
}

export { SavingsTab }
