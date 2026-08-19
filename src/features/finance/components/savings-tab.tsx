"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import type { SavingsFund } from "../types"
import { AddSavingsFundForm } from "./add-savings-fund-form"

interface SavingsTabProps {
  savings: SavingsFund[]
  onAddSavingsFund: (fund: SavingsFund) => void
  onUpdateSavingsFund: (originalName: string, fund: SavingsFund) => void
  onRemoveSavingsFund: (name: string) => void
}

interface EditSavingsFundFormProps {
  fund: SavingsFund
  onSave: (fund: SavingsFund) => void
  onCancel: () => void
}

function EditSavingsFundForm({ fund, onSave, onCancel }: EditSavingsFundFormProps) {
  const [name, setName] = useState(fund.name)
  const [amount, setAmount] = useState(String(fund.amount))
  const [target, setTarget] = useState(String(fund.target))
  const [note, setNote] = useState(fund.note ?? "")

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên quỹ"
          placeholder="vd: Quỹ khẩn cấp"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Số tiền hiện có"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Mục tiêu"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ghi chú"
          placeholder="vd: Duy trì 3-6 tháng chi tiêu"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!name.trim() || !amount.trim() || !target.trim()}
          onClick={() => {
            const updated: SavingsFund = {
              name: name.trim(),
              amount: Number(amount) || 0,
              target: Number(target) || 0,
            }
            if (note.trim()) updated.note = note.trim()
            onSave(updated)
          }}
        >
          Lưu
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>
          Huỷ
        </Button>
      </div>
    </div>
  )
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
            {editingName === fund.name ? (
              <EditSavingsFundForm
                fund={fund}
                onSave={(updated) => {
                  onUpdateSavingsFund(fund.name, updated)
                  setEditingName(null)
                }}
                onCancel={() => setEditingName(null)}
              />
            ) : (
              <>
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
              </>
            )}
          </div>
        ))
      ) : (
        <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
          Chưa có quỹ tiết kiệm nào. Thêm quỹ đầu tiên để bắt đầu theo dõi mục tiêu.
        </p>
      )}
      <AddSavingsFundForm onAdd={onAddSavingsFund} />
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
