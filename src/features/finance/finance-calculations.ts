import { formatMoney } from "@/lib/format"
import type { FinanceState } from "./finance-storage"
import type { CreditCard, GoldPurchase, GoldStore } from "./types"

// Khối lượng vàng lưu theo phân (10 phân = 1 chỉ). Form chỉ nhận phân nguyên, nhưng dữ liệu cũ có thể
// có số lẻ (12.3, hay tổng 0.1 + 0.2 = 0.30000000000000004): làm tròn 1 chữ số lẻ, dấu phẩy kiểu Việt.
function formatPhan(phan: number): string {
  return (Math.round(phan * 10) / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 })
}

function phanToChi(phan: number): string {
  // Làm tròn tới 0,1 phân TRƯỚC khi tách chỉ/phân — 9,96 phân thành "1 chỉ", không phải "10 phân".
  const tenths = Math.round(phan * 10)
  const chi = Math.floor(tenths / 100)
  const rest = (tenths % 100) / 10
  if (chi === 0) return `${formatPhan(rest)} phân`
  return `${chi} chỉ${rest ? ` ${formatPhan(rest)} phân` : ""}`
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

// Giá hôm nay để định giá 1 lần mua: giá của chính cửa hàng đó. Cửa hàng chưa nhập giá (ô trống/0)
// hoặc tên không còn trong danh sách thì tạm tính theo giá mua của lần mua — "chưa biết giá thì coi
// như hoà vốn" — thay vì định giá 0 rồi báo lỗ trọn giá vốn và kéo tụt tài sản ròng.
function goldMarketPrice(stores: GoldStore[], purchase: GoldPurchase): number {
  const price = goldStorePrice(stores, purchase.store)
  return price > 0 ? price : purchase.buy
}

// Tên các cửa hàng (không trùng, theo thứ tự lần mua) có vàng đang được tạm tính theo giá mua vì
// chưa có giá hôm nay — GoldTab nhắc người dùng nhập giá cho đúng những cửa hàng này.
function unpricedGoldStores(gold: GoldPurchase[], stores: GoldStore[]): string[] {
  const names = gold
    .filter((purchase) => goldStorePrice(stores, purchase.store) <= 0)
    .map((purchase) => purchase.store)
  return Array.from(new Set(names))
}

// Ngày mua vàng là ô chữ: nhận d/m/yyyy hoặc dd/mm/yyyy (ngăn bằng "/", "-" hoặc ".", cùng 1 loại
// trong 1 ngày) và yyyy-mm-dd; năm đủ 4 chữ số (new Date(26, …) là năm 1926); ngày phải có thật
// (new Date tự trôi 31/02 sang 03/03). Trả dạng chuẩn dd/mm/yyyy, hoặc null nếu không đọc được.
function normalizeGoldDate(input: string): string | null {
  const text = input.trim()
  const dmy = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/.exec(text)
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  const parts = dmy ? [dmy[1], dmy[3], dmy[4]] : ymd ? [ymd[3], ymd[2], ymd[1]] : null
  if (!parts) return null
  const [day, month, year] = parts.map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
}

function parseGoldDate(date: string): number {
  const normalized = normalizeGoldDate(date)
  if (!normalized) return 0
  const [day, month, year] = normalized.split("/").map(Number)
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
    const price = goldMarketPrice(stores, purchase)
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
    (sum, purchase) => sum + purchase.phan * goldMarketPrice(state.goldStores, purchase),
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

// Giá quy đổi 1 phân vàng cho mục tiêu "18 chỉ" (Mục tiêu và Tổng quan dùng chung). Đang giữ vàng →
// bình quân theo tỷ trọng vàng đang giữ ở từng cửa hàng (goldValue/goldPhan). Chưa giữ phân nào →
// bình quân giá hôm nay của các cửa hàng đã nhập giá, thay vì 0 (từng làm mục tiêu hiện "tương
// đương 0 ₫"). Không cửa hàng nào có giá → 0, getGoals bỏ hẳn phần "tương đương".
function goldReferencePricePerPhan(
  summary: Pick<FinanceSummary, "goldPhan" | "goldValue">,
  stores: GoldStore[]
): number {
  if (summary.goldPhan > 0) return summary.goldValue / summary.goldPhan
  const prices = stores.map((store) => parseGoldPrice(store.price)).filter((price) => price > 0)
  return prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0
}

// Ô "Ngày đến hạn" là chữ tự do ("15", "15 hàng tháng", "05/10"...) nhưng hầu như luôn bắt đầu bằng
// ngày trong tháng: lấy số đầu tiên trong ô nếu nó là 1–31, không thì null.
function parseDueDay(due: string): number | null {
  const match = /\d+/.exec(due)
  if (!match) return null
  const day = Number(match[0])
  return day >= 1 && day <= 31 ? day : null
}

// Số ngày từ `today` tới lần đến hạn kế tiếp vào ngày `day` hằng tháng (hôm nay đúng hạn = 0). Tháng
// ngắn hơn `day` (vd. 31 ở tháng 30 ngày) thì hạn rơi vào ngày cuối tháng đó.
function daysUntilDueDay(day: number, today: Date): number {
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()
  const daysThisMonth = new Date(year, month + 1, 0).getDate()
  const dueThisMonth = Math.min(day, daysThisMonth)
  if (dueThisMonth >= date) return dueThisMonth - date
  return daysThisMonth - date + Math.min(day, new Date(year, month + 2, 0).getDate())
}

// Thẻ còn dư nợ có lần đến hạn kế tiếp sớm nhất tính từ `today` — "hạn gần nhất" ở trụ Nợ thẻ và ở
// Tổng quan. Thẻ đã trả hết không tính; thẻ không đọc được ngày xếp sau cùng; bằng nhau thì giữ thứ
// tự thêm thẻ. Không thẻ nào còn nợ → null.
function nearestDueCard(cards: CreditCard[], today: Date): CreditCard | null {
  let nearest: CreditCard | null = null
  let nearestDays = Infinity
  for (const card of cards) {
    if (card.balance <= 0) continue
    const day = parseDueDay(card.due)
    const days = day === null ? Infinity : daysUntilDueDay(day, today)
    if (nearest === null || days < nearestDays) {
      nearest = card
      nearestDays = days
    }
  }
  return nearest
}

export {
  formatPhan,
  phanToChi,
  signedMoney,
  pct1,
  parseGoldPrice,
  summarizeFinance,
  goldReferencePricePerPhan,
  parseDueDay,
  nearestDueCard,
  goldPurchasePL,
  goldStorePrice,
  goldMarketPrice,
  normalizeGoldDate,
  parseGoldDate,
  sortGoldByDate,
  summarizeGoldByStore,
  unpricedGoldStores,
  type FinanceSummary,
  type GoldStoreSummary,
}
