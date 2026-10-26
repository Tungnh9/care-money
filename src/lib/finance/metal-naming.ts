import { formatLuong, phanToChi } from "@/lib/finance/finance-calculations"

// Tên gọi và cách hiện khối lượng của từng kim loại — dùng chung cho Tài chính (tab Tích lũy) và Chi tiêu
// (khối "Vàng/bạc tháng này"), nên nằm ở lib chứ không ở feature. Danh từ và đơn vị tiếng Việt không biến
// đổi theo vị trí, nên ghép thẳng vào câu ("Tặng 1 phân vàng", "Bán 2 lượng bạc", "Các lần mua bạc").
interface MetalNaming {
  noun: string
  unit: string
  formatQuantity: (qty: number) => string
}

const GOLD_NAMING: MetalNaming = {
  noun: "vàng",
  unit: "phân",
  formatQuantity: phanToChi,
}

const SILVER_NAMING: MetalNaming = {
  noun: "bạc",
  unit: "lượng",
  formatQuantity: (luong) => `${formatLuong(luong)} lượng`,
}

// Từng phần đã lấy ra khỏi 1 lần mua, tặng trước bán, vd. ["đã tặng 1 phân", "đã bán 2 phân"]; chưa lấy ra gì → [].
function takenOutParts(naming: MetalNaming, gifted: number, sold: number): string[] {
  const parts: string[] = []
  if (gifted > 0) parts.push(`đã tặng ${naming.formatQuantity(gifted)}`)
  if (sold > 0) parts.push(`đã bán ${naming.formatQuantity(sold)}`)
  return parts
}

// Các phần đó ghép thành 1 câu, vd. "đã tặng 1 phân · đã bán 2 phân" — câu báo lỗi khi sửa số lượng lần mua.
// Chưa lấy ra gì → null.
function formatTakenOut(naming: MetalNaming, gifted: number, sold: number): string | null {
  const parts = takenOutParts(naming, gifted, sold)
  return parts.length ? parts.join(" · ") : null
}

export { GOLD_NAMING, SILVER_NAMING, formatTakenOut, takenOutParts, type MetalNaming }
