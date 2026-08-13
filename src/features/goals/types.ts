import type { LucideIcon } from "lucide-react"

interface Goal {
  key: string
  name: string
  icon: LucideIcon
  now: number
  target: number
  percent: number
  done: boolean
  format: (n: number) => string
  note: string
  tone: "action" | "reward"
}

export type { Goal }
