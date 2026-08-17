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

export type { Goal }
