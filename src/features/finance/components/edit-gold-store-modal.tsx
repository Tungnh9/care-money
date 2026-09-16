"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { GoldStore } from "../types"

interface EditGoldStoreModalProps {
  store: GoldStore | null
  onOpenChange: (open: boolean) => void
  onSave: (store: GoldStore) => void
}

function EditGoldStoreModal({ store, onOpenChange, onSave }: EditGoldStoreModalProps) {
  const [name, setName] = useState("")

  // Modal ở lại mounted với store=null giữa các lần mở — reseed field đúng lúc chuyển sang mở với
  // 1 store (mới hoặc khác store trước), giống pattern EditExpenseModal.
  const [prevStoreName, setPrevStoreName] = useState<string | null>(null)
  if (store && store.name !== prevStoreName) {
    setName(store.name)
    setPrevStoreName(store.name)
  }
  if (!store && prevStoreName !== null) setPrevStoreName(null)

  if (!store) return null

  // Gán vào const riêng để TypeScript giữ được narrowing qua closure `handleSave` bên dưới.
  const currentStore = store

  function handleSave() {
    onSave({ ...currentStore, name: name.trim() })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy="edit-gold-store-title">
      <div id="edit-gold-store-title" className="mb-4 text-[17px] font-bold">
        Sửa cửa hàng
      </div>

      <Field
        className="min-w-0 max-w-[280px]"
        label="Tên cửa hàng"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={!name.trim()} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { EditGoldStoreModal }
