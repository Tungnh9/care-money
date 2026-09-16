"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { AddGoldStoreForm } from "./add-gold-store-form"
import { EditGoldStoreModal } from "./edit-gold-store-modal"
import type { GoldPurchase, GoldStore } from "../types"

interface GoldStoresCardProps {
  stores: GoldStore[]
  gold: GoldPurchase[]
  onAdd: (store: GoldStore) => void
  onUpdate: (originalName: string, store: GoldStore) => void
  onRemove: (name: string) => void
  onSetPrice: (name: string, price: string) => void
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
        <>
          {/* Nhãn cột — ẩn ở màn hẹp vì mỗi dòng tự xuống dòng (flex-wrap), lúc đó nhãn không còn
              thẳng hàng với ô tương ứng nữa. */}
          <div className="mb-1 hidden items-center gap-3 text-[11px] font-semibold tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] uppercase sm:flex">
            <div className="min-w-0 flex-1">Cửa hàng</div>
            <div className="w-[200px] flex-none">Giá hôm nay (mỗi phân)</div>
            <div className="w-[84px] flex-none" />
          </div>
          {stores.map((store) => {
            const inUse = isInUse(store.name)
            return (
              <div
                key={store.name}
                className="flex flex-wrap items-center gap-3 border-b border-[var(--ob-color-border)] py-[10px] last:border-b-0"
              >
                <div className="min-w-0 flex-1 text-[14px] font-bold">{store.name}</div>
                <Field
                  className="w-[200px] flex-none"
                  numeric
                  group
                  suffix="đ"
                  value={store.price}
                  onChange={(e) => onSetPrice(store.name, e.target.value)}
                />
                <div className="flex flex-none items-center gap-1">
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
                    title={
                      inUse
                        ? "Không thể xoá — vẫn còn giao dịch mua vàng gắn với cửa hàng này."
                        : undefined
                    }
                    onClick={() => setDeletingName(store.name)}
                    className="flex size-11 flex-none items-center justify-center rounded-[var(--ob-radius-sm)] text-[var(--ob-color-text-subtle)] transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)] hover:text-[var(--ob-color-expense)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            )
          })}
        </>
      ) : (
        <p className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
          Chưa có cửa hàng nào. Thêm cửa hàng đầu tiên để bắt đầu theo dõi giá.
        </p>
      )}
      <AddGoldStoreForm onAdd={onAdd} />
      <EditGoldStoreModal
        store={stores.find((s) => s.name === editingName) ?? null}
        onOpenChange={(open) => !open && setEditingName(null)}
        onSave={(updated) => {
          if (editingName) onUpdate(editingName, updated)
          setEditingName(null)
        }}
      />
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
