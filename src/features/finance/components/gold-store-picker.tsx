"use client"

import { cn } from "@/lib/utils"
import type { GoldStore } from "../types"

interface GoldStorePickerProps {
  stores: GoldStore[]
  selected: string
  onSelect: (name: string) => void
}

function GoldStorePicker({ stores, selected, onSelect }: GoldStorePickerProps) {
  return (
    <div>
      <span className="mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        Cửa hàng
      </span>
      {stores.length ? (
        <div className="flex flex-wrap gap-[6px]">
          {stores.map((store) => {
            const active = store.name === selected
            return (
              <button
                key={store.name}
                type="button"
                onClick={() => onSelect(store.name)}
                className={cn(
                  "rounded-[var(--ob-radius-pill)] border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]",
                  active
                    ? "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
                    : "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"
                )}
              >
                {store.name}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-[12.5px] text-[var(--ob-color-text-subtle)]">
          Chưa có cửa hàng nào. Thêm cửa hàng ở khu vực trên trước.
        </p>
      )}
    </div>
  )
}

export { GoldStorePicker }
