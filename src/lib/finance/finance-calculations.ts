import { formatMoney } from "@/lib/format"
import type { FinanceState } from "@/lib/finance/finance-storage"
import { heldQuantityOf, parseMetalPrice, summarizeMetalHolding } from "@/lib/finance/metal-calculations"
import type { CreditCard, GoldStore } from "@/lib/finance/types"

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

// Khối lượng bạc tính theo lượng. Form chỉ nhận lượng nguyên nên thường hiện "3", nhưng số nhập tay vào
// file sao lưu có thể lẻ: làm tròn 2 chữ số, dấu phẩy kiểu Việt, không nhiễu số thực.
function formatLuong(luong: number): string {
  return (Math.round(luong * 100) / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 })
}

function signedMoney(n: number, hidden = false): string {
  return (n >= 0 ? "+ " : "− ") + formatMoney(Math.abs(n), hidden)
}

function pct1(n: number): string {
  const sign = n < 0 ? "−" : "+"
  const value = Math.abs(n).toFixed(1).replace(".", ",")
  return `${sign}${value}%`
}

interface FinanceSummary {
  savingsTotal: number
  debtTotal: number
  goldPhan: number
  goldCost: number
  goldValue: number
  goldPL: number
  goldPct: number
  silverLuong: number
  silverCost: number
  silverValue: number
  silverPL: number
  silverPct: number
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

  // Chỉ tính phần còn giữ: số đã tặng và đã bán của từng lần mua được trừ ra trước khi định giá.
  const gold = summarizeMetalHolding(
    state.gold,
    state.goldStores,
    heldQuantityOf((purchase) => purchase.phan, [...state.goldGifts, ...state.goldSales])
  )
  const goldPhan = gold.qty
  const goldCost = gold.cost
  const goldValue = gold.value
  const goldPL = gold.pl
  const goldPct = gold.pct

  const silver = summarizeMetalHolding(
    state.silver,
    state.silverStores,
    heldQuantityOf((purchase) => purchase.luong, [...state.silverGifts, ...state.silverSales])
  )

  const investCost = state.invests.reduce((sum, invest) => sum + invest.cost, 0)
  const investValue = state.invests.reduce((sum, invest) => sum + invest.value, 0)
  const investPL = investValue - investCost
  const investPct = investCost > 0 ? (investPL / investCost) * 100 : 0

  const net = savingsTotal + goldValue + silver.value + investValue - debtTotal
  const totalCost = goldCost + silver.cost + investCost
  const netPct = totalCost > 0 ? ((goldPL + silver.pl + investPL) / totalCost) * 100 : 0

  return {
    savingsTotal,
    debtTotal,
    goldPhan,
    goldCost,
    goldValue,
    goldPL,
    goldPct,
    silverLuong: silver.qty,
    silverCost: silver.cost,
    silverValue: silver.value,
    silverPL: silver.pl,
    silverPct: silver.pct,
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
  const prices = stores.map((store) => parseMetalPrice(store.price)).filter((price) => price > 0)
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
  formatLuong,
  signedMoney,
  pct1,
  summarizeFinance,
  goldReferencePricePerPhan,
  parseDueDay,
  nearestDueCard,
  type FinanceSummary,
}
