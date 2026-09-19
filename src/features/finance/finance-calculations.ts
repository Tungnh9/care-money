import { formatMoney } from "@/lib/format"
import type { FinanceState } from "./finance-storage"
import type { GoldPurchase, GoldStore } from "./types"

function phanToChi(phan: number): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  if (chi === 0) return `${rest} phân`
  return `${chi} chỉ${rest ? ` ${rest} phân` : ""}`
}

function signedMoney(n: number, hidden = false): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function pct1(n: number): string {
  const sign = n < 0 ? "−" : "+"
  const value = Math.abs(n).toFixed(1).replace(".", ",")
  return `${sign}${value}%`
}

function parseGoldPrice(str: string): number {
  const digits = str.replace(/[^\d]/g, "")
  return digits ? Number(digits) : 0
}

function goldPurchasePL(purchase: GoldPurchase, price: number): number {
  return purchase.phan * price - purchase.phan * purchase.buy
}

function goldStorePrice(stores: GoldStore[], storeName: string): number {
  const store = stores.find((s) => s.name === storeName)
  return store ? parseGoldPrice(store.price) : 0
}

function parseGoldDate(date: string): number {
  const [day, month, year] = date.split("/").map(Number)
  if (!day || !month || !year) return 0
  return new Date(year, month - 1, day).getTime()
}

function sortGoldByDate(gold: GoldPurchase[]): GoldPurchase[] {
  return [...gold].sort((a, b) => parseGoldDate(b.date) - parseGoldDate(a.date))
}

interface GoldStoreSummary {
  store: string
  phan: number
  avgBuy: number
  cost: number
  value: number
  pl: number
}

// Gộp các lần mua theo từng cửa hàng — cần khi có nhiều cửa hàng, để thấy tổng khối lượng/lãi lỗ
// theo từng nơi thay vì phải tự cộng tay từng dòng trong bảng giao dịch.
function summarizeGoldByStore(gold: GoldPurchase[], stores: GoldStore[]): GoldStoreSummary[] {
  const byStore = new Map<string, { phan: number; cost: number; value: number }>()
  for (const purchase of gold) {
    const price = goldStorePrice(stores, purchase.store)
    const entry = byStore.get(purchase.store) ?? { phan: 0, cost: 0, value: 0 }
    entry.phan += purchase.phan
    entry.cost += purchase.phan * purchase.buy
    entry.value += purchase.phan * price
    byStore.set(purchase.store, entry)
  }

  return Array.from(byStore.entries())
    .map(([store, { phan, cost, value }]) => ({
      store,
      phan,
      avgBuy: phan > 0 ? Math.round(cost / phan) : 0,
      cost,
      value,
      pl: value - cost,
    }))
    .sort((a, b) => a.store.localeCompare(b.store, "vi"))
}

interface FinanceSummary {
  savingsTotal: number
  debtTotal: number
  goldPhan: number
  goldCost: number
  goldValue: number
  goldPL: number
  goldPct: number
  investCost: number
  investValue: number
  investPL: number
  investPct: number
  net: number
  netPct: number
}

function summarizeFinance(state: FinanceState): FinanceSummary {
  const savingsTotal = state.savings.reduce((sum, fund) => sum + fund.amount, 0)
  const debtTotal = state.cards.reduce((sum, card) => sum + card.balance, 0)

  const goldPhan = state.gold.reduce((sum, purchase) => sum + purchase.phan, 0)
  const goldCost = state.gold.reduce((sum, purchase) => sum + purchase.phan * purchase.buy, 0)
  const goldValue = state.gold.reduce(
    (sum, purchase) => sum + purchase.phan * goldStorePrice(state.goldStores, purchase.store),
    0
  )
  const goldPL = goldValue - goldCost
  const goldPct = goldCost > 0 ? (goldPL / goldCost) * 100 : 0

  const investCost = state.invests.reduce((sum, invest) => sum + invest.cost, 0)
  const investValue = state.invests.reduce((sum, invest) => sum + invest.value, 0)
  const investPL = investValue - investCost
  const investPct = investCost > 0 ? (investPL / investCost) * 100 : 0

  const net = savingsTotal + goldValue + investValue - debtTotal
  const totalCost = goldCost + investCost
  const netPct = totalCost > 0 ? ((goldPL + investPL) / totalCost) * 100 : 0

  return {
    savingsTotal,
    debtTotal,
    goldPhan,
    goldCost,
    goldValue,
    goldPL,
    goldPct,
    investCost,
    investValue,
    investPL,
    investPct,
    net,
    netPct,
  }
}

export {
  phanToChi,
  signedMoney,
  pct1,
  parseGoldPrice,
  summarizeFinance,
  goldPurchasePL,
  goldStorePrice,
  parseGoldDate,
  sortGoldByDate,
  summarizeGoldByStore,
  type FinanceSummary,
  type GoldStoreSummary,
}
