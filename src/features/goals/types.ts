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
}

interface GoalsInput {
  savingsTotal: number
  goldPhan: number
  goldPricePerPhan: number
}

export type { Goal, GoalsInput }
