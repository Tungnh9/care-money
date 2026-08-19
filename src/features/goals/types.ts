import type { SavingsFund } from "@/features/finance/types"

interface Goal {
  key: string
  name: string
  icon: string
  now: number
  target: number
  percent: number
  done: boolean
  format: (n: number) => string
  note: string
  tone: "action" | "reward"
  linked: boolean
}

interface GoalsInput {
  savingsTotal: number
  goldPhan: number
  goldPricePerPhan: number
  savings: SavingsFund[]
  carFundName: string | null
}

export type { Goal, GoalsInput }
