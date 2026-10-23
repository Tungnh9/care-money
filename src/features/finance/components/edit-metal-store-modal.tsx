"use client"

import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import type { MetalStore } from "@/lib/finance/types"

interface EditMetalStoreModalProps {
  store: MetalStore | null
  // Tên mọi cửa hàng đang có (tên hiện tại của chính cửa hàng đang sửa luôn được giữ).
  existingNames?: string[]
  onOpenChange: (open: boolean) => void
  onSave: (store: MetalStore) => void
}

function EditMetalStoreModal({ store, existingNames = [], onOpenChange, onSave }: EditMetalStoreModalProps) {
  const titleId = useId()
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
  const trimmedName = name.trim()
  const duplicate = trimmedName !== currentStore.name && existingNames.includes(trimmedName)

  function handleSave() {
    onSave({ ...currentStore, name: name.trim() })
    onOpenChange(false)
  }

  return (
    <Modal open onOpenChange={onOpenChange} ariaLabelledBy={titleId}>
      <div id={titleId} className="mb-4 text-[17px] font-bold">
        Sửa cửa hàng
      </div>

      <Field
        className="min-w-0 max-w-[280px]"
        label="Tên cửa hàng"
        value={name}
        onChange={(e) => setName(e.target.value)}
        invalid={duplicate}
        hint={duplicate ? "Đã có cửa hàng tên này — chọn tên khác" : undefined}
      />

      <div className="mt-5 flex justify-end gap-[10px]">
        <Button variant="ghost" size="sm" type="button" onClick={() => onOpenChange(false)}>
          Huỷ
        </Button>
        <Button variant="primary" size="sm" type="button" disabled={duplicate || !trimmedName} onClick={handleSave}>
          Lưu
        </Button>
      </div>
    </Modal>
  )
}

export { EditMetalStoreModal }
