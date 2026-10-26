interface TagSnapshot {
  label: string
  emoji: string
  tint: string
}

type CardLinkKind = "swipe" | "payment"

// `cardName` null: thẻ đã bị xoá khỏi trang Tài chính — khoản chi vẫn giữ loại liên kết để tính đúng.
interface CardLink {
  kind: CardLinkKind
  cardName: string | null
}

// Liên kết của 1 khoản chi đang được THÊM: luôn trỏ 1 thẻ đang có. `cardName: null` chỉ xuất hiện trên
// khoản đã lưu, sau khi thẻ bị xoá — thêm mới với null sẽ tính 0 vào chi tiêu mà không cộng nợ thẻ nào.
interface ActiveCardLink extends CardLink {
  cardName: string
}

interface Expense {
  id: number
  dayKey: string
  amount: number
  note?: string
  tag: TagSnapshot | null
  card?: CardLink
}

interface MonthlySalary {
  month: string
  amount: number
}

type SettlementDirection = "deposit" | "withdraw"

interface Settlement {
  id: number
  month: string
  at: string
  direction: SettlementDirection
  amount: number
  fundName: string
  fundAmountBefore: number
  fundAmountAfter: number
}

export type {
  CardLinkKind,
  CardLink,
  ActiveCardLink,
  TagSnapshot,
  Expense,
  MonthlySalary,
  Settlement,
  SettlementDirection,
}
