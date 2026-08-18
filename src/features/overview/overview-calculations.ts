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

interface GreetingParts {
  prefix: string
  name: string
}

function splitGreeting(greeting: string, displayName: string): GreetingParts {
  const suffix = `, ${displayName}`
  if (displayName && greeting.endsWith(suffix)) {
    return { prefix: greeting.slice(0, greeting.length - suffix.length), name: displayName }
  }
  return { prefix: greeting, name: "" }
}

interface MiniGoalsInput {
  savingsTotal: number
  goldPhan: number
}

interface MiniGoal {
  name: string
  icon: string
  percent: number
}

function getMiniGoals({ savingsTotal, goldPhan }: MiniGoalsInput): MiniGoal[] {
  return [
    { name: "Tiết kiệm 100 triệu", icon: "pig", percent: Math.min(Math.round((savingsTotal / 100_000_000) * 100), 100) },
    { name: "10 chỉ vàng", icon: "gold", percent: Math.min(Math.round((goldPhan / 100) * 100), 100) },
    { name: "Mua xe ô tô", icon: "car", percent: 0 },
  ]
}

export { monthLabel, daysLeftInCycle, splitGreeting, getMiniGoals, type MiniGoal, type GreetingParts }
