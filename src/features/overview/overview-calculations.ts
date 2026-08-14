import { BADGE_AT } from "@/lib/constants"

function monthLabel(d: Date = new Date()): string {
  return `tháng ${d.getMonth() + 1}`
}

function daysLeftInCycle(cycleStart: string, d: Date = new Date()): number {
  const startDay = Math.min(Math.max(Number(cycleStart) || 1, 1), 28)
  let next = new Date(d.getFullYear(), d.getMonth(), startDay)
  if (next <= d) next = new Date(d.getFullYear(), d.getMonth() + 1, startDay)
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.max(0, Math.round((next.getTime() - today.getTime()) / 86_400_000))
}

interface MiniGoalsInput {
  savingsTotal: number
  goldPhan: number
  streak: number
}

interface MiniGoal {
  name: string
  icon: string
  percent: number
}

function getMiniGoals({ savingsTotal, goldPhan, streak }: MiniGoalsInput): MiniGoal[] {
  return [
    { name: "Tiết kiệm 100 triệu", icon: "pig", percent: Math.min(Math.round((savingsTotal / 100_000_000) * 100), 100) },
    { name: `${BADGE_AT} ngày liên tục`, icon: "flame", percent: Math.min(Math.round((streak / BADGE_AT) * 100), 100) },
    { name: "10 chỉ vàng", icon: "gold", percent: Math.min(Math.round((goldPhan / 100) * 100), 100) },
    { name: "Mua xe ô tô", icon: "car", percent: 0 },
  ]
}

export { monthLabel, daysLeftInCycle, getMiniGoals, type MiniGoal }
