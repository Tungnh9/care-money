"use client"

import type { FinanceSummary } from "@/lib/finance/finance-calculations"
import type {
  MetalGift,
  MetalGiftInput,
  MetalSale,
  MetalSaleInput,
  SavingsFund,
  SilverPurchase,
  SilverStore,
} from "@/lib/finance/types"
import { SILVER_METAL } from "../metal-config"
import { MetalTab } from "./metal-tab"

interface SilverTabProps {
  summary: FinanceSummary
  stores: SilverStore[]
  onAddSilverStore: (store: SilverStore) => void
  onUpdateSilverStore: (originalName: string, store: SilverStore) => void
  onRemoveSilverStore: (name: string) => void
  onSetSilverStorePrice: (name: string, price: string) => void
  silver: SilverPurchase[]
  onAddSilver: (purchase: Omit<SilverPurchase, "id">) => void
  onUpdateSilver: (id: number, purchase: Omit<SilverPurchase, "id">) => void
  onRemoveSilver: (id: number) => void
  silverGifts: MetalGift[]
  onAddSilverGift: (purchaseId: number, input: MetalGiftInput) => boolean
  onUpdateSilverGift: (id: number, input: MetalGiftInput) => boolean
  onRemoveSilverGift: (id: number) => void
  silverSales: MetalSale[]
  savings: SavingsFund[]
  onAddSilverSale: (purchaseId: number, input: MetalSaleInput) => boolean
  onRemoveSilverSale: (id: number) => void
}

function SilverTab({
  summary,
  stores,
  onAddSilverStore,
  onUpdateSilverStore,
  onRemoveSilverStore,
  onSetSilverStorePrice,
  silver,
  onAddSilver,
  onUpdateSilver,
  onRemoveSilver,
  silverGifts,
  onAddSilverGift,
  onUpdateSilverGift,
  onRemoveSilverGift,
  silverSales,
  savings,
  onAddSilverSale,
  onRemoveSilverSale,
}: SilverTabProps) {
  return (
    <MetalTab
      metal={SILVER_METAL}
      holding={{
        qty: summary.silverLuong,
        cost: summary.silverCost,
        value: summary.silverValue,
        pl: summary.silverPL,
        pct: summary.silverPct,
      }}
      stores={stores}
      onAddStore={onAddSilverStore}
      onUpdateStore={onUpdateSilverStore}
      onRemoveStore={onRemoveSilverStore}
      onSetStorePrice={onSetSilverStorePrice}
      purchases={silver}
      onAddPurchase={onAddSilver}
      onUpdatePurchase={onUpdateSilver}
      onRemovePurchase={onRemoveSilver}
      gifts={silverGifts}
      onAddGift={onAddSilverGift}
      onUpdateGift={onUpdateSilverGift}
      onRemoveGift={onRemoveSilverGift}
      sales={silverSales}
      savings={savings}
      onAddSale={onAddSilverSale}
      onRemoveSale={onRemoveSilverSale}
    />
  )
}

export { SilverTab }
