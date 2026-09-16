"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { Investment } from "../types"

interface EditInvestmentModalProps {
  investment: Investment | null
  onOpenChange: (open: boolean) => void
  onSave: (id: number, investment: Omit<Investment, "id">) => void
}

function EditInvestmentModal({ investment, onOpenChange, onSave }: EditInvestmentModalProps) {
  const [name, setName] = useState("")
  const [cost, setCost] = useState("")
  const [value, setValue] = useState("")

  // Modal ở lại mounted với investment=null giữa các lần mở — reseed field đúng lúc chuyển sang
  // mở với 1 investment (mới hoặc khác investment trước), giống pattern EditExpenseModal.
  const [prevId, setPrevId] = useState<number | null>(null)
  if (investment && investment.id !== prevId) {
    setName(investment.name)
    setCost(String(investment.cost))
    setValue(String(investment.value))
    setPrevId(investment.id)
  }
  if (!investment && prevId !== null) setPrevId(null)

  if (!investment) return null

  const currentId = investment.id
  const disabled = !name.trim() || !cost.trim() || !value.trim()

  function handleSave() {
    onSave(currentId, {
      name: name.trim(),
      cost: Number(cost) || 0,
      value: Number(value) || 0,
    })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-investment-title">
      <div id="edit-investment-title" className="mb-4 text-[17px] font-bold">
        Sửa khoản đầu tư
      </div>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Tên khoản đầu tư"
          placeholder="vd: Cổ phiếu FPT"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Vốn đã bỏ ra"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Giá trị hiện tại"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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

export { EditInvestmentModal }
