import { monthKeyFromDayKey } from "@/lib/date"
import type { MetalGift, MetalPurchaseBase, MetalSale, MetalStore, SavingsFund } from "@/lib/finance/types"

// Phép tính dùng chung cho tích lũy vàng và bạc. Hàm nào cần khối lượng thì nhận `quantityOf` để đọc
// đúng field của từng kim loại (vàng: `phan`, bạc: `luong`); giá mua/giá hôm nay luôn tính theo đúng
// đơn vị đó, nên phép nhân khối lượng × giá giống hệt nhau cho cả hai.

function parseMetalPrice(str: string): number {
  const digits = str.replace(/[^\d]/g, "")
  return digits ? Number(digits) : 0
}

function metalPurchasePL(qty: number, buy: number, price: number): number {
  return qty * price - qty * buy
}

type MetalPLTone = "gain" | "loss" | "even"

// Làm tròn về đồng trước khi xét dấu: cộng dồn qty * price của dữ liệu cũ có khối lượng lẻ có thể ra
// -1e-13 thay vì 0 đúng, khiến hoà vốn bị hiện thành "lỗ 0 ₫". Hoà vốn (gồm cả cửa hàng chưa nhập
// giá, vốn tạm tính theo giá mua) là trung tính — không phải lãi.
function metalPLTone(pl: number): MetalPLTone {
  const rounded = Math.round(pl)
  if (rounded > 0) return "gain"
  if (rounded < 0) return "loss"
  return "even"
}

function metalStorePrice(stores: MetalStore[], storeName: string): number {
  const store = stores.find((s) => s.name === storeName)
  return store ? parseMetalPrice(store.price) : 0
}

// Giá hôm nay để định giá 1 lần mua: giá của chính cửa hàng đó. Cửa hàng chưa nhập giá (ô trống/0)
// hoặc tên không còn trong danh sách thì tạm tính theo giá mua của lần mua — "chưa biết giá thì coi
// như hoà vốn" — thay vì định giá 0 rồi báo lỗ trọn giá vốn và kéo tụt tài sản ròng.
function metalMarketPrice(stores: MetalStore[], purchase: Pick<MetalPurchaseBase, "store" | "buy">): number {
  const price = metalStorePrice(stores, purchase.store)
  return price > 0 ? price : purchase.buy
}

// Tên các cửa hàng (không trùng, theo thứ tự lần mua) đang được tạm tính theo giá mua vì chưa có giá
// hôm nay — tab vàng/bạc nhắc người dùng nhập giá cho đúng những cửa hàng này.
function unpricedMetalStores(purchases: Pick<MetalPurchaseBase, "store">[], stores: MetalStore[]): string[] {
  const names = purchases
    .filter((purchase) => metalStorePrice(stores, purchase.store) <= 0)
    .map((purchase) => purchase.store)
  return Array.from(new Set(names))
}

// Ngày mua là ô chữ: nhận d/m/yyyy hoặc dd/mm/yyyy (ngăn bằng "/", "-" hoặc ".", cùng 1 loại trong 1
// ngày) và yyyy-mm-dd; năm đủ 4 chữ số và từ 1000 trở đi (new Date(26, …) là năm 1926, còn "0100" trước
// đây ra "01/01/100" — tự trượt dạng dd/mm/yyyy của chính nó); ngày phải có thật (new Date tự trôi 31/02
// sang 03/03). Trả dạng chuẩn dd/mm/yyyy, hoặc null nếu không đọc được.
function normalizePurchaseDate(input: string): string | null {
  const text = input.trim()
  const dmy = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/.exec(text)
  const ymd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text)
  const parts = dmy ? [dmy[1], dmy[3], dmy[4]] : ymd ? [ymd[3], ymd[2], ymd[1]] : null
  if (!parts) return null
  const [day, month, year] = parts.map(Number)
  if (year < 1000) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`
}

function parsePurchaseDate(date: string): number {
  const normalized = normalizePurchaseDate(date)
  if (!normalized) return 0
  const [day, month, year] = normalized.split("/").map(Number)
  return new Date(year, month - 1, day).getTime()
}

function sortByPurchaseDate<P extends Pick<MetalPurchaseBase, "date">>(purchases: P[]): P[] {
  return [...purchases].sort((a, b) => parsePurchaseDate(b.date) - parsePurchaseDate(a.date))
}

// Ngày mua/ngày tặng (dd/mm/yyyy) → dayKey (yyyy-mm-dd) để xếp vào tháng như khoản chi; không đọc được → null.
function purchaseDateToDayKey(date: string): string | null {
  const normalized = normalizePurchaseDate(date)
  if (!normalized) return null
  const [day, month, year] = normalized.split("/")
  return `${year}-${month}-${day}`
}

// Ngày máy → dd/mm/yyyy, dạng gõ ở ô ngày mua/ngày tặng.
function toPurchaseDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

// Ngày sớm nhất (dd/mm/yyyy) trong các lần lấy ra (tặng, bán) từ 1 lần mua — ngày mua không được dời qua mốc
// này. Ngày không đọc được (chỉ có từ file sửa tay) thì bỏ qua; chưa lấy ra lần nào → null.
function earliestTakeoutDate(takeouts: Pick<MetalGift, "purchaseId" | "date">[], purchaseId: number): string | null {
  let earliest: string | null = null
  for (const takeout of takeouts) {
    if (takeout.purchaseId !== purchaseId) continue
    const date = normalizePurchaseDate(takeout.date)
    if (date !== null && (earliest === null || parsePurchaseDate(date) < parsePurchaseDate(earliest))) {
      earliest = date
    }
  }
  return earliest
}

// Tổng đã lấy ra (tặng, hoặc bán) của từng lần mua (theo id lần mua).
function takenOutByPurchase(takeouts: Pick<MetalGift, "purchaseId" | "qty">[]): Map<number, number> {
  const takenOut = new Map<number, number>()
  for (const takeout of takeouts) {
    takenOut.set(takeout.purchaseId, (takenOut.get(takeout.purchaseId) ?? 0) + takeout.qty)
  }
  return takenOut
}

// Số còn giữ của 1 lần mua = số đã mua − tổng đã lấy ra (tặng và bán) từ lần mua đó. Lần mua không lưu số
// còn lại — tính ra từ đây, nên mọi chỗ định giá (tổng đang giữ, Tài sản ròng, bảng, tổng hợp) giảm theo cùng
// 1 cách. Chưa lấy ra lần nào thì trả đúng quantityOf(p) (x − 0 = x), số vàng giữ nguyên từng bit.
function heldQuantityOf<P extends MetalPurchaseBase>(
  quantityOf: (purchase: P) => number,
  takeouts: Pick<MetalGift, "purchaseId" | "qty">[]
): (purchase: P) => number {
  const takenOut = takenOutByPurchase(takeouts)
  return (purchase) => quantityOf(purchase) - (takenOut.get(purchase.id) ?? 0)
}

// Các lần lấy ra (tặng, bán) có ngày thuộc `month` (YYYY-MM), mới nhất trước; cùng ngày thì id cao (ghi sau)
// trước. Ngày không đọc được (chỉ có từ file sửa tay) thì bỏ — không đoán nó thuộc tháng nào.
function takeoutsInMonth<T extends Pick<MetalGift, "id" | "date">>(
  items: T[],
  month: string
): (T & { dayKey: string })[] {
  const inMonth: (T & { dayKey: string })[] = []
  for (const item of items) {
    const dayKey = purchaseDateToDayKey(item.date)
    if (dayKey !== null && monthKeyFromDayKey(dayKey) === month) inMonth.push({ ...item, dayKey })
  }
  return inMonth.sort((a, b) => b.dayKey.localeCompare(a.dayKey) || b.id - a.id)
}

// Lãi/lỗ đã chốt của 1 lần bán: tiền thực nhận trừ giá vốn của đúng phần đã bán (theo giá mua chụp lúc bán).
function metalSalePL(sale: Pick<MetalSale, "qty" | "buy" | "received">): number {
  return sale.received - sale.qty * sale.buy
}

// Vì sao chưa huỷ được 1 lần bán — null là huỷ được. Huỷ phải rút lại đúng số đã nhận khỏi đúng sổ đã nhận: sổ
// đó đã xoá (cờ fundRemoved, hay không còn sổ tên đó) hoặc không còn đủ tiền thì không huỷ. Nút Huỷ ở Lịch sử bán
// và hook (chốt cuối, trên dữ liệu đọc tươi) dùng chung hàm này, nên nút khoá đúng khi hook sẽ từ chối.
function saleUndoBlockedReason(
  sale: Pick<MetalSale, "fundName" | "fundRemoved" | "received">,
  savings: Pick<SavingsFund, "name" | "amount">[]
): string | null {
  const fund = sale.fundRemoved ? undefined : savings.find((f) => f.name === sale.fundName)
  if (!fund) return `Sổ "${sale.fundName}" đã bị xoá — không huỷ được lần bán này.`
  if (fund.amount < sale.received) {
    return `Sổ "${sale.fundName}" không còn đủ tiền để rút lại số đã nhận — không huỷ được lần bán này.`
  }
  return null
}

// Ô khối lượng chỉ nhận số nguyên dương (phân với vàng, lượng với bạc): số lẻ thì hiện nhiễu số thực
// ("1 chỉ 2.3000000000000007 phân"), còn "1,5" (dấu phẩy) là NaN. Number.isInteger(Infinity) = false
// nên "1e400" cũng bị chặn (JSON.stringify lưu Infinity thành null, lần đọc sau lần mua bị bỏ).
function parseWholeQuantity(text: string): number | null {
  const qty = Number(text)
  return Number.isInteger(qty) && qty > 0 ? qty : null
}

// Phần đuôi tên nút Sửa/Xoá của từng lần mua, duy nhất trong danh sách đang hiện: thường chỉ cần
// ngày; mua nhiều lần trong 1 ngày thì thêm cửa hàng + khối lượng, vẫn trùng hết (mua y hệt nhau) thì
// thêm "lần N" — để trình đọc màn hình vẫn tách được từng nút thay vì nghe 2 nút cùng tên.
function metalPurchaseLabels<P extends Pick<MetalPurchaseBase, "id" | "date" | "store">>(
  purchases: P[],
  describeQty: (purchase: P) => string
): Map<number, string> {
  const dateCount = new Map<string, number>()
  for (const p of purchases) dateCount.set(p.date, (dateCount.get(p.date) ?? 0) + 1)

  const detailSeen = new Map<string, number>()
  const labels = new Map<number, string>()
  for (const p of purchases) {
    if ((dateCount.get(p.date) ?? 0) < 2) {
      labels.set(p.id, p.date)
      continue
    }
    const detail = `${p.date} · ${p.store} · ${describeQty(p)}`
    const n = (detailSeen.get(detail) ?? 0) + 1
    detailSeen.set(detail, n)
    labels.set(p.id, n > 1 ? `${detail} (lần ${n})` : detail)
  }
  return labels
}

interface MetalHolding {
  qty: number
  cost: number
  value: number
  pl: number
  pct: number
}

// Tổng đang giữ của 1 kim loại — summarizeFinance dùng cho cả vàng lẫn bạc. Cộng dồn đúng thứ tự từng
// lần mua như 3 vòng reduce trước đây, nên số của vàng giống từng bit (kể cả phân lẻ của dữ liệu cũ).
function summarizeMetalHolding<P extends MetalPurchaseBase>(
  purchases: P[],
  stores: MetalStore[],
  quantityOf: (purchase: P) => number
): MetalHolding {
  let qty = 0
  let cost = 0
  let value = 0
  for (const purchase of purchases) {
    const q = quantityOf(purchase)
    qty += q
    cost += q * purchase.buy
    value += q * metalMarketPrice(stores, purchase)
  }
  const pl = value - cost
  const pct = cost > 0 ? (pl / cost) * 100 : 0
  return { qty, cost, value, pl, pct }
}

interface MetalStoreSummary {
  store: string
  qty: number
  avgBuy: number
  cost: number
  value: number
  pl: number
}

// Gộp các lần mua theo từng cửa hàng — cần khi có nhiều cửa hàng, để thấy tổng khối lượng/lãi lỗ
// theo từng nơi thay vì phải tự cộng tay từng dòng trong bảng giao dịch.
function summarizeMetalByStore<P extends MetalPurchaseBase>(
  purchases: P[],
  stores: MetalStore[],
  quantityOf: (purchase: P) => number
): MetalStoreSummary[] {
  const byStore = new Map<string, { qty: number; cost: number; value: number }>()
  for (const purchase of purchases) {
    const price = metalMarketPrice(stores, purchase)
    const q = quantityOf(purchase)
    const entry = byStore.get(purchase.store) ?? { qty: 0, cost: 0, value: 0 }
    entry.qty += q
    entry.cost += q * purchase.buy
    entry.value += q * price
    byStore.set(purchase.store, entry)
  }

  return Array.from(byStore.entries())
    .map(([store, { qty, cost, value }]) => ({
      store,
      qty,
      avgBuy: qty > 0 ? Math.round(cost / qty) : 0,
      cost,
      value,
      pl: value - cost,
    }))
    .sort((a, b) => a.store.localeCompare(b.store, "vi"))
}

export {
  parseMetalPrice,
  metalPurchasePL,
  metalPLTone,
  metalStorePrice,
  metalMarketPrice,
  unpricedMetalStores,
  normalizePurchaseDate,
  parsePurchaseDate,
  sortByPurchaseDate,
  purchaseDateToDayKey,
  toPurchaseDate,
  takenOutByPurchase,
  earliestTakeoutDate,
  heldQuantityOf,
  takeoutsInMonth,
  metalSalePL,
  saleUndoBlockedReason,
  parseWholeQuantity,
  metalPurchaseLabels,
  summarizeMetalHolding,
  summarizeMetalByStore,
  type MetalPLTone,
  type MetalHolding,
  type MetalStoreSummary,
}
