import { formatLuong, phanToChi } from "@/lib/finance/finance-calculations"

// Tên gọi và cách hiện khối lượng của từng kim loại — dùng chung cho Tài chính (tab Tích lũy) và Chi tiêu
// (khối "Quà tặng từ tích lũy"), nên nằm ở lib chứ không ở feature. Danh từ và đơn vị tiếng Việt không biến
// đổi theo vị trí, nên ghép thẳng vào câu ("Tặng 1 phân vàng", "Các lần mua bạc").
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

// Phần đã lấy ra khỏi 1 lần mua, vd. "đã tặng 1 phân · đã bán 2 phân" — dòng phụ dưới lần mua, câu báo lỗi khi
// sửa số lượng. Chưa lấy ra gì → null.
function formatTakenOut(naming: MetalNaming, gifted: number, sold: number): string | null {
  const parts = [
    gifted > 0 ? `đã tặng ${naming.formatQuantity(gifted)}` : null,
    sold > 0 ? `đã bán ${naming.formatQuantity(sold)}` : null,
  ].filter((part) => part !== null)
  return parts.length ? parts.join(" · ") : null
}

export { GOLD_NAMING, SILVER_NAMING, formatTakenOut, type MetalNaming }
