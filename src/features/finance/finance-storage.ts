import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
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

// Quỹ và thẻ được định danh bằng TÊN ở mọi nơi (sửa, xoá, trả thẻ, tất toán ngân sách, liên kết
// mục tiêu mua xe, React key) — 2 mục trùng tên thì thao tác trên 1 mục sẽ đè/xoá luôn mục kia.
// Bản lưu cũ (hay file sao lưu cũ) lỡ có trùng: giữ nguyên tên mục ĐẦU TIÊN (đúng mục mà find() ở
// FundPicker/getGoals/applySavingsFundDelta vốn đang chọn), đổi các mục sau thành "Tên (2)",
// "Tên (3)"... — không mất số dư nào, người dùng tự đổi lại tên cho đúng ý.
function dedupeNames<T extends { name: string }>(items: T[]): T[] {
  const taken = new Set(items.map((item) => item.name))
  const seen = new Set<string>()
  return items.map((item) => {
    if (!seen.has(item.name)) {
      seen.add(item.name)
      return item
    }
    let n = 2
    while (taken.has(`${item.name} (${n})`)) n++
    const name = `${item.name} (${n})`
    taken.add(name)
    seen.add(name)
    return { ...item, name }
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

// Bản cũ chỉ có 1 `goldPrice` chung, purchase chưa có field `store`. Phải chạy TRƯỚC khi
// Zod validate `gold` — nếu không, mọi purchase thiếu `store` sẽ fail goldPurchaseSchema và
// bị bỏ khi đọc, mất sạch lịch sử mua. Không đụng vào nếu đã ở format mới
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
  // Lọc TỪNG phần tử (giống budget-storage): 1 purchase/thẻ hỏng chỉ mất riêng nó. Trước đây cả
  // mảng rơi về [] và lần ghi kế tiếp (vd. gõ 1 phím giá vàng) biến mất mát đó thành vĩnh viễn.
  // Lọc trước, khử trùng tên sau — bản hỏng bị bỏ thì không chiếm tên của bản hợp lệ.
  return {
    savings: dedupeNames(safeArray(savingsFundSchema, parsed.savings)),
    cards: dedupeNames(safeArray(creditCardSchema, parsed.cards)),
    gold: safeArray(goldPurchaseSchema, migrated.gold),
    goldStores: safeArray(goldStoreSchema, migrated.goldStores),
    invests: safeArray(investmentSchema, parsed.invests),
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
