"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { AddGoldStoreForm } from "./add-gold-store-form"
import type { GoldPurchase, GoldStore } from "../types"

interface GoldStoresCardProps {
  stores: GoldStore[]
  gold: GoldPurchase[]
  onAdd: (store: GoldStore) => void
  onUpdate: (originalName: string, store: GoldStore) => void
  onRemove: (name: string) => void
  onSetPrice: (name: string, price: string) => void
}

interface EditGoldStoreFormProps {
  store: GoldStore
  onSave: (store: GoldStore) => void
  onCancel: () => void
}

function EditGoldStoreForm({ store, onSave, onCancel }: EditGoldStoreFormProps) {
  const [name, setName] = useState(store.name)

  return (
    <div className="mt-2">
      <Field
        className="min-w-0 max-w-[280px]"
        label="Tên cửa hàng"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="mt-3 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!name.trim()}
          onClick={() => onSave({ ...store, name: name.trim() })}
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

function GoldStoresCard({ stores, gold, onAdd, onUpdate, onRemove, onSetPrice }: GoldStoresCardProps) {
  const [editingName, setEditingName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)

  function isInUse(name: string) {
    return gold.some((p) => p.store === name)
  }

  return (
    <Card label="Giá thị trường hôm nay">
      {stores.length ? (
        stores.map((store) => {
          const inUse = isInUse(store.name)
          return (
            <div
              key={store.name}
              className="border-b border-[var(--ob-color-border)] py-[14px] last:border-b-0"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-[14px] font-bold">{store.name}</div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Sửa ${store.name}`}
                    onClick={() => setEditingName(store.name)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-info)]"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Xoá ${store.name}`}
                    disabled={inUse}
                    onClick={() => setDeletingName(store.name)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              {editingName === store.name ? (
                <EditGoldStoreForm
                  store={store}
                  onSave={(updated) => {
                    onUpdate(store.name, updated)
                    setEditingName(null)
                  }}
                  onCancel={() => setEditingName(null)}
                />
              ) : (
                <>
                  <Field
                    label="Giá hôm nay (mỗi phân)"
                    numeric
                    group
                    suffix="đ"
                    value={store.price}
                    onChange={(e) => onSetPrice(store.name, e.target.value)}
                  />
                  {inUse ? (
                    <p className="mt-2 text-[12px] text-[var(--ob-color-text-subtle)]">
                      Không thể xoá — vẫn còn giao dịch mua vàng gắn với cửa hàng này.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          )
        })
      ) : (
        <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
          Chưa có cửa hàng nào. Thêm cửa hàng đầu tiên để bắt đầu theo dõi giá.
        </p>
      )}
      <AddGoldStoreForm onAdd={onAdd} />
      <AlertDialog
        open={!!deletingName}
        onOpenChange={(open) => !open && setDeletingName(null)}
        title="Xoá cửa hàng?"
        description={
          <>
            Xoá &quot;<strong>{deletingName}</strong>&quot; sẽ không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingName) onRemove(deletingName)
        }}
      />
    </Card>
  )
}

export { GoldStoresCard }
