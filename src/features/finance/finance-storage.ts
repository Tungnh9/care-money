import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import type { CreditCard, GoldPurchase, GoldStore, Investment, SavingsFund } from "./types"

interface FinanceState {
  savings: SavingsFund[]
  cards: CreditCard[]
  gold: GoldPurchase[]
  goldStores: GoldStore[]
  invests: Investment[]
}

const FINANCE_STORAGE_KEY = "finance-data"
const DEFAULT_GOLD_STORE_NAME = "Chưa gắn cửa hàng"

const DEFAULT_FINANCE_STATE: FinanceState = {
  savings: [],
  cards: [],
  gold: [],
  goldStores: [],
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

const goldStoreSchema: z.ZodType<GoldStore> = z.object({
  name: z.string(),
  price: z.string(),
})

const goldPurchaseSchema: z.ZodType<GoldPurchase> = z.object({
  id: z.number(),
  date: z.string(),
  phan: z.number(),
  buy: z.number(),
  store: z.string(),
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
  goldStores: z.array(goldStoreSchema),
  invests: z.array(investmentSchema),
})

// Đọc/khôi phục 1 field độc lập — field nào sai shape thì rơi về default riêng field đó,
// không kéo sập cả state (vd. "cards" hỏng không làm mất luôn "savings" hợp lệ).
function safeField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value)
  return result.success ? result.data : fallback
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

// Bản cũ chỉ có 1 `goldPrice` chung, purchase chưa có field `store`. Phải chạy TRƯỚC khi
// Zod validate `gold` — nếu không, purchase thiếu `store` sẽ fail goldPurchaseSchema và
// cả mảng gold rơi về [], mất sạch lịch sử mua. Không đụng vào nếu đã ở format mới
// (đã có `goldStores`, kể cả khi rỗng) — tránh migrate lặp hoặc ghi đè dữ liệu đang đúng.
function migrateGoldShape(parsed: Record<string, unknown>): { gold: unknown; goldStores: unknown } {
  if (Array.isArray(parsed.goldStores)) {
    return { gold: parsed.gold, goldStores: parsed.goldStores }
  }

  const legacyPrice = typeof parsed.goldPrice === "string" ? parsed.goldPrice : ""
  const legacyGold = Array.isArray(parsed.gold) ? parsed.gold : []

  if (!legacyGold.length && !legacyPrice.trim()) {
    return { gold: [], goldStores: [] }
  }

  const migratedGold = legacyGold.map((item) =>
    isObject(item) && typeof item.store !== "string" ? { ...item, store: DEFAULT_GOLD_STORE_NAME } : item
  )

  return { gold: migratedGold, goldStores: [{ name: DEFAULT_GOLD_STORE_NAME, price: legacyPrice }] }
}

function parseFinanceState(value: unknown): FinanceState {
  const parsed = (value ?? {}) as Record<string, unknown>
  const migrated = migrateGoldShape(parsed)
  return {
    savings: safeField(z.array(savingsFundSchema), parsed.savings, DEFAULT_FINANCE_STATE.savings),
    cards: safeField(z.array(creditCardSchema), parsed.cards, DEFAULT_FINANCE_STATE.cards),
    gold: safeField(z.array(goldPurchaseSchema), migrated.gold, DEFAULT_FINANCE_STATE.gold),
    goldStores: safeField(z.array(goldStoreSchema), migrated.goldStores, DEFAULT_FINANCE_STATE.goldStores),
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

type ApplySavingsFundDeltaResult =
  | { ok: true; before: number; after: number }
  | { ok: false; reason: "fund-not-found" | "insufficient-balance" }

// Đọc tươi ngay tại thời điểm gọi (không nhận state đã đọc từ trước) — dùng cho flow chốt
// ngân sách, nơi có khoảng chờ người dùng (mở modal, chọn quỹ, gõ số tiền) giữa lúc đọc và ghi.
function applySavingsFundDelta(
  name: string,
  direction: "deposit" | "withdraw",
  amount: number
): ApplySavingsFundDeltaResult {
  const current = getStoredFinance()
  const fund = current.savings.find((f) => f.name === name)
  if (!fund) return { ok: false, reason: "fund-not-found" }
  if (direction === "withdraw" && amount > fund.amount) return { ok: false, reason: "insufficient-balance" }

  const after = direction === "deposit" ? fund.amount + amount : fund.amount - amount
  setStoredFinance({
    ...current,
    savings: current.savings.map((f) => (f.name === name ? { ...f, amount: after } : f)),
  })
  return { ok: true, before: fund.amount, after }
}

export {
  FINANCE_STORAGE_KEY,
  DEFAULT_FINANCE_STATE,
  DEFAULT_GOLD_STORE_NAME,
  getStoredFinance,
  setStoredFinance,
  applySavingsFundDelta,
  parseFinanceState,
  financeStateSchema,
  savingsFundSchema,
  creditCardSchema,
  goldStoreSchema,
  goldPurchaseSchema,
  investmentSchema,
  type FinanceState,
}
