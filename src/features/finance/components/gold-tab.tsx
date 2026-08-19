"use client"

import { useState } from "react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Figure } from "@/components/ob/figure"
import { Progress } from "@/components/ui/progress"
import { useMoneyVisibility } from "@/components/money-visibility-provider"
import { formatMoney } from "@/lib/format"
import { parseGoldPrice, pct1, phanToChi, type FinanceSummary } from "../finance-calculations"
import type { GoldPurchase } from "../types"
import { AddGoldForm } from "./add-gold-form"
import { GoldTransactionsCards } from "./gold-transactions-cards"
import { GoldTransactionsTable } from "./gold-transactions-table"

interface GoldTabProps {
  summary: FinanceSummary
  goldPrice: string
  onSetGoldPrice: (price: string) => void
  gold: GoldPurchase[]
  onAddGold: (purchase: Omit<GoldPurchase, "id">) => void
  onUpdateGold: (id: number, purchase: Omit<GoldPurchase, "id">) => void
  onRemoveGold: (id: number) => void
}

function signedMoney(n: number, hidden: boolean): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function GoldTab({
  summary,
  goldPrice,
  onSetGoldPrice,
  gold,
  onAddGold,
  onUpdateGold,
  onRemoveGold,
}: GoldTabProps) {
  const { hidden } = useMoneyVisibility()
  const { goldPhan, goldCost, goldValue, goldPL, goldPct } = summary
  const gain = goldPL >= 0
  const maxBar = Math.max(goldCost, goldValue, 1)
  const avgCost = goldPhan > 0 ? goldCost / goldPhan : 0
  const marketPrice = parseGoldPrice(goldPrice)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState("")
  const [editPhan, setEditPhan] = useState("")
  const [editBuy, setEditBuy] = useState("")
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const deletingPurchase = gold.find((p) => p.id === deletingId) ?? null

  function startEdit(purchase: GoldPurchase) {
    setEditingId(purchase.id)
    setEditDate(purchase.date)
    setEditPhan(String(purchase.phan))
    setEditBuy(String(purchase.buy))
  }

  function resetEdit() {
    setEditingId(null)
    setEditDate("")
    setEditPhan("")
    setEditBuy("")
  }

  const stats = [
    ["Đang giữ", `${goldPhan} phân`],
    ["Quy đổi", phanToChi(goldPhan)],
    ["Giá vốn bình quân", `${formatMoney(Math.round(avgCost), hidden)} / phân`],
    ["Giá thị trường", `${formatMoney(marketPrice, hidden)} / phân`],
  ] as const

  return (
    <div className="ob-card-grid flex flex-col gap-4">
      <Card label="Lãi / lỗ theo giá thị trường">
        <div className="flex flex-wrap gap-[28px]">
          <div className="flex-none">
            <Figure
              value={
                <span
                  style={{ color: gain ? "var(--ob-color-income)" : "var(--ob-color-expense)" }}
                >
                  {signedMoney(goldPL, hidden)}
                </span>
              }
              delta={pct1(goldPct)}
              direction={gain ? "up" : "down"}
            />
            <p className="mt-[10px] max-w-[28ch] text-[13.5px] leading-[1.5] text-[var(--ob-color-text-muted)]">
              {gain
                ? `Bạn đang lãi ${formatMoney(goldPL, hidden)} so với giá vốn nhờ giá vàng tăng.`
                : `Bạn đang lỗ ${formatMoney(Math.abs(goldPL), hidden)} so với giá vốn do giá vàng giảm.`}
            </p>
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-4">
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá vốn
                </span>
                <span className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums text-[var(--ob-color-text-muted)]">
                  {formatMoney(goldCost, hidden)}
                </span>
              </div>
              <Progress value={(goldCost / maxBar) * 100} tone="action" />
            </div>
            <div>
              <div className="mb-[7px] flex items-baseline justify-between gap-3">
                <span className="[font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                  Giá trị nay
                </span>
                <span className="text-[13.5px] font-bold [font-family:var(--ob-font-num)] tabular-nums">
                  {formatMoney(goldValue, hidden)}
                </span>
              </div>
              <Progress value={(goldValue / maxBar) * 100} tone="reward" />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--ob-color-border)] pt-5 sm:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 [font:var(--ob-text-micro)] uppercase tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)]">
                {label}
              </div>
              <div className="text-[13.5px] [font-family:var(--ob-font-num)] tabular-nums whitespace-nowrap">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card label="Giá thị trường hôm nay">
        <Field
          label="Giá vàng hôm nay (mỗi phân)"
          numeric
          group
          suffix="đ"
          value={goldPrice}
          onChange={(e) => onSetGoldPrice(e.target.value)}
          hint="10 phân = 1 chỉ. Bạn tự cập nhật giá — app không tự lấy giá từ đâu cả."
        />
      </Card>

      <AddGoldForm onAdd={onAddGold} />

      {editingId !== null ? (
        <Card label="Sửa lần mua vàng">
          <div className="flex flex-wrap gap-3">
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Ngày mua"
              placeholder="vd: 10/08/2026"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Khối lượng (phân)"
              numeric
              placeholder="0"
              value={editPhan}
              onChange={(e) => setEditPhan(e.target.value)}
              hint="10 phân = 1 chỉ"
            />
            <Field
              className="min-w-0 flex-[1_1_220px]"
              label="Giá mua (mỗi phân)"
              numeric
              group
              suffix="đ"
              placeholder="0"
              value={editBuy}
              onChange={(e) => setEditBuy(e.target.value)}
            />
          </div>
          <div className="mt-4 flex gap-[10px]">
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!editDate.trim() || !editPhan.trim() || !editBuy.trim()}
              onClick={() => {
                onUpdateGold(editingId, {
                  date: editDate.trim(),
                  phan: Number(editPhan) || 0,
                  buy: Number(editBuy) || 0,
                })
                resetEdit()
              }}
            >
              Lưu
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={resetEdit}>
              Huỷ
            </Button>
          </div>
        </Card>
      ) : null}

      <Card label={`Các lần mua vàng${gold.length ? ` · ${gold.length}` : ""}`}>
        <div className="hidden lg:block">
          <GoldTransactionsTable
            gold={gold}
            goldPrice={goldPrice}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
        <div className="lg:hidden">
          <GoldTransactionsCards
            gold={gold}
            goldPrice={goldPrice}
            onRemove={setDeletingId}
            onEdit={startEdit}
          />
        </div>
      </Card>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Xoá giao dịch vàng?"
        description={
          <>
            Xoá giao dịch mua vàng ngày &quot;<strong>{deletingPurchase?.date}</strong>&quot; sẽ
            không thể hoàn tác.
          </>
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingId !== null) onRemoveGold(deletingId)
        }}
      />
    </div>
  )
}

export { GoldTab }
