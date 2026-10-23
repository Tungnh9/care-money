"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { normalizePurchaseDate, parseWholeQuantity } from "@/lib/finance/metal-calculations"
import type { MetalPurchaseBase, MetalStore } from "@/lib/finance/types"
import type { MetalConfig } from "../metal-config"
import { MetalStorePicker } from "./metal-store-picker"

interface EditMetalPurchaseModalProps<P extends MetalPurchaseBase> {
  metal: MetalConfig<P>
  purchase: P | null
  stores: MetalStore[]
  onOpenChange: (open: boolean) => void
  onSave: (id: number, purchase: Omit<P, "id">) => void
  // Tổng đã tặng từ lần mua này: số lượng không được sửa xuống thấp hơn (số còn lại sẽ âm).
  minQuantity?: number
}

function EditMetalPurchaseModal<P extends MetalPurchaseBase>({
  metal,
  purchase,
  stores,
  onOpenChange,
  onSave,
  minQuantity = 0,
}: EditMetalPurchaseModalProps<P>) {
  const titleId = useId()
  const [date, setDate] = useState("")
  const [quantity, setQuantity] = useState("")
  const [buy, setBuy] = useState("")
  const [store, setStore] = useState("")

  // Modal ở lại mounted với purchase=null giữa các lần mở — reseed field đúng lúc chuyển sang mở
  // với 1 purchase (mới hoặc khác purchase trước), giống pattern EditExpenseModal.
  const [prevId, setPrevId] = useState<number | null>(null)
  if (purchase && purchase.id !== prevId) {
    setDate(purchase.date)
    setQuantity(String(metal.quantityOf(purchase)))
    setBuy(String(purchase.buy))
    setStore(purchase.store)
    setPrevId(purchase.id)
  }
  if (!purchase && prevId !== null) setPrevId(null)

  if (!purchase) return null

  const currentId = purchase.id
  const normalizedDate = normalizePurchaseDate(date)
  // Lần mua cũ đã lưu sai dạng (vd. "10/08/26") hiện đỏ ngay khi mở — phải sửa ngày mới lưu được.
  const dateInvalid = date.trim() !== "" && normalizedDate === null
  const quantityValue = parseWholeQuantity(quantity)
  const belowGifted = quantityValue !== null && quantityValue < minQuantity
  const quantityValid = quantityValue !== null && !belowGifted
  const quantityInvalid = quantity.trim() !== "" && !quantityValid
  // Cửa hàng đang chọn có thể vừa bị đổi tên/xoá ở thẻ "Giá thị trường hôm nay" trong lúc modal còn
  // mở — chỉ coi là đã chọn khi tên đó vẫn còn trong danh sách, giống AddMetalPurchaseForm, để không ghi đè
  // lại tên cũ lên lần mua (huỷ mất phần đổi tên đã cascade) và trỏ vào cửa hàng không tồn tại.
  const selectedStore = stores.some((s) => s.name === store) ? store : ""
  const disabled = !normalizedDate || !quantityValid || !buy.trim() || !selectedStore

  function handleSave() {
    if (!normalizedDate || !selectedStore) return
    onSave(
      currentId,
      metal.toPurchase({
        date: normalizedDate,
        qty: quantityValue ?? 0,
        buy: Number(buy) || 0,
        store: selectedStore,
      })
    )
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy={titleId}>
      <div id={titleId} className="mb-4 text-[17px] font-bold">
        {`Sửa lần mua ${metal.noun}`}
      </div>

      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label="Ngày mua"
          placeholder="vd: 10/08/2026"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          invalid={dateInvalid}
          hint={dateInvalid ? "Nhập ngày dạng dd/mm/yyyy, vd: 10/08/2026" : undefined}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={`Khối lượng (${metal.unit})`}
          numeric
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          invalid={quantityInvalid}
          hint={
            belowGifted
              ? `Đã tặng ${metal.formatQuantity(minQuantity)} từ lần mua này — số lượng không được nhỏ hơn.`
              : quantityInvalid
                ? metal.quantityError
                : metal.quantityHint
          }
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={`Giá mua (mỗi ${metal.unit})`}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={buy}
          onChange={(e) => setBuy(e.target.value)}
        />
      </div>
      <div className="mt-3">
        <MetalStorePicker stores={stores} selected={selectedStore} onSelect={setStore} />
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

export { EditMetalPurchaseModal }
