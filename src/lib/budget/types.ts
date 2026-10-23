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

export type { CardLinkKind, CardLink, TagSnapshot, Expense, MonthlySalary, Settlement, SettlementDirection }
