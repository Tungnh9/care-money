import { formatPhan, phanToChi } from "@/lib/finance/finance-calculations"
import { GOLD_NAMING, SILVER_NAMING, type MetalNaming } from "@/lib/finance/metal-naming"
import type { GoldPurchase, MetalPurchaseBase, SilverPurchase } from "@/lib/finance/types"

// Chữ và cách hiện khối lượng của 1 kim loại. Component dùng chung của tab vàng/bạc chỉ khác nhau ở
// đây — không rẽ nhánh theo kim loại. Danh từ, đơn vị và cách hiện khối lượng (`formatQuantity`: bảng/thẻ
// giao dịch, tổng hợp theo cửa hàng, tên nút Sửa/Xoá) lấy từ MetalNaming ở lib — Chi tiêu dùng chung.
interface MetalDisplay extends MetalNaming {
  // Placeholder ô tên cửa hàng mới.
  storePlaceholder: string
  // Gợi ý thường trực dưới ô khối lượng; không có thì ô chỉ hiện chữ khi gõ sai.
  quantityHint?: string
  quantityError: string
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
  ...GOLD_NAMING,
  storePlaceholder: "vd: SJC",
  quantityHint: "10 phân = 1 chỉ",
  quantityError: "Nhập số phân nguyên lớn hơn 0 (10 phân = 1 chỉ)",
  formatHeld: (phan) => `${formatPhan(phan)} phân`,
  formatConverted: phanToChi,
  quantityOf: (purchase) => purchase.phan,
  toPurchase: ({ date, qty, buy, store }) => ({ date, phan: qty, buy, store }),
}

// Bạc tính thẳng theo lượng — không có đơn vị quy đổi, nên không có ô "Quy đổi" hay gợi ý dưới ô khối lượng.
const SILVER_METAL: MetalConfig<SilverPurchase> = {
  ...SILVER_NAMING,
  storePlaceholder: "vd: Phú Quý",
  quantityError: "Nhập số lượng nguyên lớn hơn 0",
  formatHeld: SILVER_NAMING.formatQuantity,
  quantityOf: (purchase) => purchase.luong,
  toPurchase: ({ date, qty, buy, store }) => ({ date, luong: qty, buy, store }),
}

export { GOLD_METAL, SILVER_METAL, type MetalConfig, type MetalDisplay, type PurchaseFields }
