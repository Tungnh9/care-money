"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { GoldPurchase, GoldStore } from "../types"
import { GoldStorePicker } from "./gold-store-picker"

interface EditGoldPurchaseModalProps {
  purchase: GoldPurchase | null
  stores: GoldStore[]
  onOpenChange: (open: boolean) => void
  onSave: (id: number, purchase: Omit<GoldPurchase, "id">) => void
}

function EditGoldPurchaseModal({ purchase, stores, onOpenChange, onSave }: EditGoldPurchaseModalProps) {
  const [date, setDate] = useState("")
  const [phan, setPhan] = useState("")
  const [buy, setBuy] = useState("")
  const [store, setStore] = useState("")

  // Modal ở lại mounted với purchase=null giữa các lần mở — reseed field đúng lúc chuyển sang mở
  // với 1 purchase (mới hoặc khác purchase trước), giống pattern EditExpenseModal.
  const [prevId, setPrevId] = useState<number | null>(null)
  if (purchase && purchase.id !== prevId) {
    setDate(purchase.date)
    setPhan(String(purchase.phan))
    setBuy(String(purchase.buy))
    setStore(purchase.store)
    setPrevId(purchase.id)
  }
  if (!purchase && prevId !== null) setPrevId(null)

  if (!purchase) return null

  const currentId = purchase.id
  const disabled = !date.trim() || !(Number(phan) > 0) || !buy.trim() || !store

  function handleSave() {
    onSave(currentId, {
      date: date.trim(),
      phan: Number(phan) || 0,
      buy: Number(buy) || 0,
      store,
    })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-gold-purchase-title">
      <div id="edit-gold-purchase-title" className="mb-4 text-[17px] font-bold">
        Sửa lần mua vàng
      </div>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày mua"
          placeholder="vd: 10/08/2026"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Khối lượng (phân)"
          numeric
          placeholder="0"
          value={phan}
          onChange={(e) => setPhan(e.target.value)}
          hint="10 phân = 1 chỉ"
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Giá mua (mỗi phân)"
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={buy}
          onChange={(e) => setBuy(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <GoldStorePicker stores={stores} selected={store} onSelect={setStore} />
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

export { EditGoldPurchaseModal }
