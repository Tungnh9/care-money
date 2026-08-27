"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { useT } from "@/components/locale-provider"
import type { GoldPurchase } from "../types"

interface AddGoldFormProps {
  onAdd: (purchase: Omit<GoldPurchase, "id">) => void
}

function AddGoldForm({ onAdd }: AddGoldFormProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState("")
  const [phan, setPhan] = useState("")
  const [buy, setBuy] = useState("")

  function reset() {
    setDate("")
    setPhan("")
    setBuy("")
    setOpen(false)
  }

  if (!open) {
    return (
      <div className="mt-[18px]">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          {t("finance.gold.addOpen")}
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-[18px] border-t border-[var(--ob-color-border)] pt-[18px]">
      <div className="mb-3 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
        {t("finance.gold.newPurchase")}
      </div>
      <div className="flex flex-wrap gap-3">
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.gold.purchaseDate")}
          placeholder={t("finance.gold.purchaseDatePlaceholder")}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.gold.quantity")}
          numeric
          placeholder="0"
          value={phan}
          onChange={(e) => setPhan(e.target.value)}
          hint={t("finance.gold.quantityHint")}
        />
        <Field
          className="min-w-0 flex-[1_1_220px]"
          label={t("finance.gold.buyPrice")}
          numeric
          group
          suffix="đ"
          placeholder="0"
          value={buy}
          onChange={(e) => setBuy(e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-[10px]">
        <Button
          variant="primary"
          size="sm"
          type="button"
          disabled={!date.trim() || !phan.trim() || !buy.trim()}
          onClick={() => {
            onAdd({
              date: date.trim(),
              phan: Number(phan) || 0,
              buy: Number(buy) || 0,
            })
            reset()
          }}
        >
          {t("common.add")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={reset}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  )
}

export { AddGoldForm }
