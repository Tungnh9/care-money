"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { SavingsFund } from "../types"

interface EditSavingsFundModalProps {
  fund: SavingsFund | null
  onOpenChange: (open: boolean) => void
  onSave: (fund: SavingsFund) => void
}

function EditSavingsFundModal({ fund, onOpenChange, onSave }: EditSavingsFundModalProps) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [target, setTarget] = useState("")
  const [note, setNote] = useState("")

  // Modal ở lại mounted với fund=null giữa các lần mở — reseed field đúng lúc chuyển sang mở với
  // 1 fund (mới hoặc khác fund trước), giống pattern EditExpenseModal.
  const [prevFundName, setPrevFundName] = useState<string | null>(null)
  if (fund && fund.name !== prevFundName) {
    setName(fund.name)
    setAmount(String(fund.amount))
    setTarget(String(fund.target))
    setNote(fund.note ?? "")
    setPrevFundName(fund.name)
  }
  if (!fund && prevFundName !== null) setPrevFundName(null)

  if (!fund) return null

  const disabled = !name.trim() || !amount.trim() || !target.trim()

  function handleSave() {
    const updated: SavingsFund = {
      name: name.trim(),
      amount: Number(amount) || 0,
      target: Number(target) || 0,
    }
    if (note.trim()) updated.note = note.trim()
    onSave(updated)
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-savings-fund-title">
      <div id="edit-savings-fund-title" className="mb-4 text-[17px] font-bold">
        Sửa quỹ tiết kiệm
      </div>

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

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { EditSavingsFundModal }
