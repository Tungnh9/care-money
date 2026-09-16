interface TagSnapshot {
  label: string
  emoji: string
  tint: string
}

interface Expense {
  id: number
  dayKey: string
  amount: number
  note?: string
  tag: TagSnapshot | null
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

export type { TagSnapshot, Expense, MonthlySalary, Settlement, SettlementDirection }
