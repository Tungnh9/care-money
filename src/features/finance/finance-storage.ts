import type { CreditCard, GoldPurchase, Investment, SavingsFund } from "./types"

interface FinanceState {
  savings: SavingsFund[]
  cards: CreditCard[]
  gold: GoldPurchase[]
  goldPrice: string
  invests: Investment[]
}

const FINANCE_STORAGE_KEY = "finance-data"

const DEFAULT_FINANCE_STATE: FinanceState = {
  savings: [],
  cards: [],
  gold: [],
  goldPrice: "",
  invests: [],
}

function getStoredFinance(): FinanceState {
  try {
    const raw = window.localStorage.getItem(FINANCE_STORAGE_KEY)
    if (!raw) return DEFAULT_FINANCE_STATE
    return { ...DEFAULT_FINANCE_STATE, ...(JSON.parse(raw) as Partial<FinanceState>) }
  } catch {
    return DEFAULT_FINANCE_STATE
  }
}

function setStoredFinance(state: FinanceState) {
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state))
}

export {
  FINANCE_STORAGE_KEY,
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
}
