import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"
import { safeArray } from "@/lib/safe-array"
import type {
  CreditCard,
  GoldPurchase,
  GoldStore,
  Investment,
  MetalGift,
  MetalSale,
  MetalStore,
  SavingsFund,
  SilverPurchase,
  SilverStore,
} from "@/lib/finance/types"

interface FinanceState {
  savings: SavingsFund[]
  cards: CreditCard[]
  gold: GoldPurchase[]
  goldStores: GoldStore[]
  goldGifts: MetalGift[]
  goldSales: MetalSale[]
  silver: SilverPurchase[]
  silverStores: SilverStore[]
  silverGifts: MetalGift[]
  silverSales: MetalSale[]
  invests: Investment[]
}

const FINANCE_STORAGE_KEY = "finance-data"
const DEFAULT_GOLD_STORE_NAME = "Chưa gắn cửa hàng"

const DEFAULT_FINANCE_STATE: FinanceState = {
  savings: [],
  cards: [],
  gold: [],
  goldStores: [],
  goldGifts: [],
  goldSales: [],
  silver: [],
  silverStores: [],
  silverGifts: [],
  silverSales: [],
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

// Cửa hàng vàng và cửa hàng bạc cùng 1 dạng (tên + giá hôm nay theo đơn vị của kim loại đó).
const metalStoreSchema: z.ZodType<MetalStore> = z.object({
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

const silverPurchaseSchema: z.ZodType<SilverPurchase> = z.object({
  id: z.number(),
  date: z.string(),
  luong: z.number(),
  buy: z.number(),
  store: z.string(),
})

const metalGiftSchema: z.ZodType<MetalGift> = z.object({
  id: z.number(),
  purchaseId: z.number(),
  date: z.string(),
  qty: z.number(),
  store: z.string(),
  buy: z.number(),
  note: z.string().optional(),
})

// `received` đọc bằng z.number() (không .int()): lần bán đã ghi thì tiền đã vào sổ — bỏ lần bán lúc đọc vì 1 số
// tiền lạ sẽ làm lệch sổ so với lịch sử. Giới hạn số tiền nằm ở form và hook lúc ghi.
const metalSaleSchema: z.ZodType<MetalSale> = z.object({
  id: z.number(),
  purchaseId: z.number(),
  date: z.string(),
  qty: z.number(),
  store: z.string(),
  buy: z.number(),
  received: z.number(),
  fundName: z.string(),
  fundRemoved: z.boolean().optional(),
  note: z.string().optional(),
})

const investmentSchema: z.ZodType<Investment> = z.object({
  id: z.number(),
  name: z.string(),
  cost: z.number(),
  value: z.number(),
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
    goldStores: safeArray(metalStoreSchema, migrated.goldStores),
    // Bạc và các lần tặng có sau: dữ liệu/bản sao lưu cũ không có các key này thì safeArray trả [] — không
    // cần migrate.
    goldGifts: safeArray(metalGiftSchema, parsed.goldGifts),
    goldSales: safeArray(metalSaleSchema, parsed.goldSales),
    silver: safeArray(silverPurchaseSchema, parsed.silver),
    silverStores: safeArray(metalStoreSchema, parsed.silverStores),
    silverGifts: safeArray(metalGiftSchema, parsed.silverGifts),
    silverSales: safeArray(metalSaleSchema, parsed.silverSales),
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
  { ok: true; before: number; after: number } | { ok: false; reason: "fund-not-found" | "insufficient-balance" }

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

type ApplyCardBalanceDeltaResult =
  | { ok: true; before: number; after: number }
  | { ok: false; reason: "card-not-found" }
  | { ok: false; reason: "insufficient-debt"; balance: number }
  | { ok: false; reason: "invalid-delta" }

// Cộng/trừ dư nợ thẻ — useBudget gọi khi ghi/sửa/xoá khoản quẹt thẻ hoặc trả nợ thẻ. Đọc tươi tại
// thời điểm gọi (như applySavingsFundDelta) vì tab Tài chính có thể vừa sửa nợ; từ chối thay vì
// kẹp về 0 để nợ thẻ không bao giờ âm hay lệch so với khoản chi đã ghi.
function applyCardBalanceDelta(name: string, delta: number): ApplyCardBalanceDeltaResult {
  // NaN/Infinity ghi vào JSON thành null — lần đọc sau creditCardSchema bỏ luôn cả thẻ.
  if (!Number.isFinite(delta)) return { ok: false, reason: "invalid-delta" }
  const current = getStoredFinance()
  const card = current.cards.find((c) => c.name === name)
  if (!card) return { ok: false, reason: "card-not-found" }
  // Chỉ chặn lần GIẢM nợ: dư nợ nhập từ file có thể đã âm sẵn, khi đó tăng nợ (quẹt, hay xoá 1 lần
  // trả) vẫn phải đi qua được thay vì bị báo là "chỉ còn nợ".
  if (delta < 0 && card.balance + delta < 0) return { ok: false, reason: "insufficient-debt", balance: card.balance }

  const after = card.balance + delta
  setStoredFinance({
    ...current,
    cards: current.cards.map((c) => (c.name === name ? { ...c, balance: after } : c)),
  })
  return { ok: true, before: card.balance, after }
}

export {
  FINANCE_STORAGE_KEY,
  DEFAULT_FINANCE_STATE,
  DEFAULT_GOLD_STORE_NAME,
  getStoredFinance,
  setStoredFinance,
  applySavingsFundDelta,
  applyCardBalanceDelta,
  parseFinanceState,
  savingsFundSchema,
  creditCardSchema,
  metalStoreSchema,
  goldPurchaseSchema,
  silverPurchaseSchema,
  metalGiftSchema,
  metalSaleSchema,
  investmentSchema,
  type FinanceState,
  type ApplyCardBalanceDeltaResult,
}
