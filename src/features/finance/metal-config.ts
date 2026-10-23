import { formatLuong, formatPhan, phanToChi } from "@/lib/finance/finance-calculations"
import type { GoldPurchase, MetalPurchaseBase, SilverPurchase } from "@/lib/finance/types"

// Chữ và cách hiện khối lượng của 1 kim loại. Component dùng chung của tab vàng/bạc chỉ khác nhau ở
// đây — không rẽ nhánh theo kim loại. Danh từ ("vàng"/"bạc") và đơn vị ("phân"/"lượng") tiếng Việt
// không biến đổi theo vị trí, nên ghép thẳng vào câu ("Các lần mua bạc", "Giá mua (mỗi lượng)").
interface MetalDisplay {
  noun: string
  unit: string
  // Placeholder ô tên cửa hàng mới.
  storePlaceholder: string
  // Gợi ý thường trực dưới ô khối lượng; không có thì ô chỉ hiện chữ khi gõ sai.
  quantityHint?: string
  quantityError: string
  // Khối lượng ở bảng/thẻ giao dịch, tổng hợp theo cửa hàng và tên nút Sửa/Xoá.
  formatQuantity: (qty: number) => string
  // Ô "Đang giữ".
  formatHeld: (qty: number) => string
  // Ô "Quy đổi" — chỉ kim loại có đơn vị quy đổi mới có.
  formatConverted?: (qty: number) => string
}

interface PurchaseFields {
  date: string
  qty: number
  buy: number
  store: string
}

// Thêm phần gắn với field khối lượng thật của từng kim loại (vàng lưu `phan`, bạc lưu `luong`).
interface MetalConfig<P extends MetalPurchaseBase> extends MetalDisplay {
  quantityOf: (purchase: P) => number
  toPurchase: (fields: PurchaseFields) => Omit<P, "id">
}

const GOLD_METAL: MetalConfig<GoldPurchase> = {
  noun: "vàng",
  unit: "phân",
  storePlaceholder: "vd: SJC",
  quantityHint: "10 phân = 1 chỉ",
  quantityError: "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)",
  formatQuantity: phanToChi,
  formatHeld: (phan) => `${formatPhan(phan)} phân`,
  formatConverted: phanToChi,
  quantityOf: (purchase) => purchase.phan,
  toPurchase: ({ date, qty, buy, store }) => ({ date, phan: qty, buy, store }),
}

// Bạc tính thẳng theo lượng — không có đơn vị quy đổi, nên không có ô "Quy đổi" hay gợi ý dưới ô khối lượng.
const luongText = (luong: number) => `${formatLuong(luong)} lượng`

const SILVER_METAL: MetalConfig<SilverPurchase> = {
  noun: "bạc",
  unit: "lượng",
  storePlaceholder: "vd: Phú Quý",
  quantityError: "Nhập số lượng nguyên lớn hơn 0",
  formatQuantity: luongText,
  formatHeld: luongText,
  quantityOf: (purchase) => purchase.luong,
  toPurchase: ({ date, qty, buy, store }) => ({ date, luong: qty, buy, store }),
}

export { GOLD_METAL, SILVER_METAL, type MetalConfig, type MetalDisplay, type PurchaseFields }
