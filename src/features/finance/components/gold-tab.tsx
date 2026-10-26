"use client"

import type { FinanceSummary } from "@/lib/finance/finance-calculations"
import type {
  GoldPurchase,
  GoldStore,
  MetalGift,
  MetalGiftInput,
  MetalSale,
  MetalSaleInput,
  SavingsFund,
} from "@/lib/finance/types"
import { GOLD_METAL } from "../metal-config"
import { MetalTab } from "./metal-tab"

interface GoldTabProps {
  summary: FinanceSummary
  stores: GoldStore[]
  onAddGoldStore: (store: GoldStore) => void
  onUpdateGoldStore: (originalName: string, store: GoldStore) => void
  onRemoveGoldStore: (name: string) => void
  onSetGoldStorePrice: (name: string, price: string) => void
  gold: GoldPurchase[]
  onAddGold: (purchase: Omit<GoldPurchase, "id">) => void
  onUpdateGold: (id: number, purchase: Omit<GoldPurchase, "id">) => void
  onRemoveGold: (id: number) => void
  goldGifts: MetalGift[]
  onAddGoldGift: (purchaseId: number, input: MetalGiftInput) => boolean
  onUpdateGoldGift: (id: number, input: MetalGiftInput) => boolean
  onRemoveGoldGift: (id: number) => void
  goldSales: MetalSale[]
  savings: SavingsFund[]
  onAddGoldSale: (purchaseId: number, input: MetalSaleInput) => boolean
  onRemoveGoldSale: (id: number) => void
}

function GoldTab({
  summary,
  stores,
  onAddGoldStore,
  onUpdateGoldStore,
  onRemoveGoldStore,
  onSetGoldStorePrice,
  gold,
  onAddGold,
  onUpdateGold,
  onRemoveGold,
  goldGifts,
  onAddGoldGift,
  onUpdateGoldGift,
  onRemoveGoldGift,
  goldSales,
  savings,
  onAddGoldSale,
  onRemoveGoldSale,
}: GoldTabProps) {
  return (
    <MetalTab
      metal={GOLD_METAL}
      holding={{
        qty: summary.goldPhan,
        cost: summary.goldCost,
        value: summary.goldValue,
        pl: summary.goldPL,
        pct: summary.goldPct,
      }}
      stores={stores}
      onAddStore={onAddGoldStore}
      onUpdateStore={onUpdateGoldStore}
      onRemoveStore={onRemoveGoldStore}
      onSetStorePrice={onSetGoldStorePrice}
      purchases={gold}
      onAddPurchase={onAddGold}
      onUpdatePurchase={onUpdateGold}
      onRemovePurchase={onRemoveGold}
      gifts={goldGifts}
      onAddGift={onAddGoldGift}
      onUpdateGift={onUpdateGoldGift}
      onRemoveGift={onRemoveGoldGift}
      sales={goldSales}
      savings={savings}
      onAddSale={onAddGoldSale}
      onRemoveSale={onRemoveGoldSale}
    />
  )
}

export { GoldTab }
