import type { FinanceState } from "./finance-storage"

function phanToChi(phan: number): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  if (chi === 0) return `${rest} phân`
  return `${chi} chỉ${rest ? ` ${rest} phân` : ""}`
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
  const goldValue = goldPhan * parseGoldPrice(state.goldPrice)
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

export { phanToChi, pct1, parseGoldPrice, summarizeFinance, type FinanceSummary }
