"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { normalizeGoldDate } from "@/lib/finance/finance-calculations"
import type { GoldPurchase, GoldStore } from "@/lib/finance/types"
import { GoldStorePicker } from "./gold-store-picker"

interface AddGoldFormProps {
  stores: GoldStore[]
  onAdd: (purchase: Omit<GoldPurchase, "id">) => void
}

function AddGoldForm({ stores, onAdd }: AddGoldFormProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [phan, setPhan] = useState("")
  const [buy, setBuy] = useState("")
  const [store, setStore] = useState("")

  function reset() {
    setDate("")
    setPhan("")
    setBuy("")
    setStore("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          Thêm lần mua vàng
        </Button>
      </div>
    )
  }

  // Chỉ nhận phân nguyên dương: giá cửa hàng tính theo phân, số lẻ thì hiện nhiễu số thực ("1 chỉ
  // 2.3000000000000007 phân"), còn "1,5" (dấu phẩy) là NaN. Number.isInteger(Infinity) = false nên
  // "1e400" vẫn bị chặn như trước (JSON.stringify lưu Infinity thành null, lần đọc sau purchase bị bỏ).
  const phanValid = Number.isInteger(Number(phan)) && Number(phan) > 0
  const phanInvalid = phan.trim() !== "" && !phanValid
  // Cửa hàng đang chọn có thể vừa bị đổi tên/xoá ở thẻ "Giá thị trường hôm nay" ngay phía trên trong
  // lúc form còn mở (hook chỉ đổi tên ở các lần mua ĐÃ lưu) — chỉ coi là đã chọn khi tên đó vẫn còn
  // trong danh sách, để không lưu lần mua trỏ vào cửa hàng không tồn tại.
  const selectedStore = stores.some((s) => s.name === store) ? store : ""
  const normalizedDate = normalizeGoldDate(date)
  // Ô trống chỉ khoá nút; gõ rồi mà không đọc ra 1 ngày có thật thì báo đỏ.
  const dateInvalid = date.trim() !== "" && normalizedDate === null

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Lần mua vàng mới
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
          label="Khối lượng (phân)"
          numeric
          placeholder="0"
          value={phan}
          onChange={(e) => setPhan(e.target.value)}
          invalid={phanInvalid}
          hint={phanInvalid ? "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)" : "10 phân = 1 chỉ"}
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
        <GoldStorePicker stores={stores} selected={selectedStore} onSelect={setStore} />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!normalizedDate || !phanValid || !buy.trim() || !selectedStore}
          onClick={() => {
            if (!normalizedDate) return
            onAdd({
              date: normalizedDate,
              phan: Number(phan) || 0,
              buy: Number(buy) || 0,
              store: selectedStore,
            })
            reset()
          }}
        >
          Thêm
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          Huỷ
        </Button>
      </div>
    </div>
  )
}

export { AddGoldForm }
