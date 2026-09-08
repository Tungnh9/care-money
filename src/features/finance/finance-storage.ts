import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
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

const savingsFundSchema: z.ZodType<SavingsFund> = z.object({
  name: z.string(),
  amount: z.number(),
  target: z.number(),
  note: z.string().optional(),
})

const creditCardSchema: z.ZodType<CreditCard> = z.object({
  name: z.string(),
  balance: z.number(),
  min: z.number(),
  limit: z.number(),
  due: z.string(),
  color: z.string().optional(),
})

const goldPurchaseSchema: z.ZodType<GoldPurchase> = z.object({
  id: z.number(),
  date: z.string(),
  phan: z.number(),
  buy: z.number(),
})

const investmentSchema: z.ZodType<Investment> = z.object({
  id: z.number(),
  name: z.string(),
  cost: z.number(),
  value: z.number(),
})

const financeStateSchema = z.object({
  savings: z.array(savingsFundSchema),
  cards: z.array(creditCardSchema),
  gold: z.array(goldPurchaseSchema),
  goldPrice: z.string(),
  invests: z.array(investmentSchema),
})

// Đọc/khôi phục 1 field độc lập — field nào sai shape thì rơi về default riêng field đó,
// không kéo sập cả state (vd. "cards" hỏng không làm mất luôn "savings" hợp lệ).
function safeField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

function parseFinanceState(value: unknown): FinanceState {
  const parsed = (value ?? {}) as Partial<FinanceState>
  return {
    savings: safeField(z.array(savingsFundSchema), parsed.savings, DEFAULT_FINANCE_STATE.savings),
    cards: safeField(z.array(creditCardSchema), parsed.cards, DEFAULT_FINANCE_STATE.cards),
    gold: safeField(z.array(goldPurchaseSchema), parsed.gold, DEFAULT_FINANCE_STATE.gold),
    goldPrice: safeField(z.string(), parsed.goldPrice, DEFAULT_FINANCE_STATE.goldPrice),
    invests: safeField(z.array(investmentSchema), parsed.invests, DEFAULT_FINANCE_STATE.invests),
  }
}

function getStoredFinance(): FinanceState {
  try {
    const raw = window.localStorage.getItem(FINANCE_STORAGE_KEY)
    if (!raw) return DEFAULT_FINANCE_STATE
    return parseFinanceState(JSON.parse(raw))
  } catch {
    return DEFAULT_FINANCE_STATE
  }
}

function setStoredFinance(state: FinanceState) {
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(state))
  notifyDataChanged()
}

export {
  FINANCE_STORAGE_KEY,
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
  parseFinanceState,
  financeStateSchema,
  savingsFundSchema,
  creditCardSchema,
  goldPurchaseSchema,
  investmentSchema,
  type FinanceState,
}
