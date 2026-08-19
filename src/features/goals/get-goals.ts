import { formatMoney } from "@/lib/format"

import type { Goal, GoalsInput } from "./types"

function formatChi(phan: number): string {
  const chi = Math.floor(phan / 10)
  const rest = phan % 10
  return `${chi} chỉ${rest ? ` ${rest} phân` : ""}`
}

function goldRemainingNote(goldPhan: number, goldPricePerPhan: number, hidden: boolean): string {
  const remaining = 100 - goldPhan
  const remainingChi =
    remaining % 10 === 0 ? String(remaining / 10) : (remaining / 10).toFixed(1).replace(".", ",")
  return `Còn ${remainingChi} chỉ · tương đương ${formatMoney(remaining * goldPricePerPhan, hidden)}`
}

function withPercent(now: number, target: number) {
  const percent = Math.min(Math.round((now / target) * 100), 100)
  return { percent, done: now >= target }
}

function getGoals(data: GoalsInput, hidden = false): { goals: Goal[]; avg: number } {
  const { savingsTotal, goldPhan, goldPricePerPhan } = data

  const defs = [
    {
      key: "savings",
      name: "Tiết kiệm 100 triệu",
      icon: "pig",
      now: savingsTotal,
      target: 100_000_000,
      format: (n: number) => formatMoney(n, hidden),
      note: "Tổng các quỹ tiết kiệm ở màn Tài chính",
      tone: "action" as const,
    },
    {
      key: "gold",
      name: "Tích lũy 10 chỉ vàng",
      icon: "gold",
      now: goldPhan,
      target: 100,
      format: formatChi,
      note: goldRemainingNote(goldPhan, goldPricePerPhan, hidden),
      tone: "reward" as const,
    },
    {
      key: "car",
      name: "Mua xe ô tô",
      icon: "car",
      now: 0,
      target: 1,
      format: (n: number) => (n ? formatMoney(n, hidden) : "0%"),
      note: "Chưa trích đồng nào. Mỗi lần để dành sẽ nhích thanh này lên.",
      tone: "action" as const,
    },
  ]

  const goals: Goal[] = defs.map((g) => ({ ...g, ...withPercent(g.now, g.target) }))
  const avg = Math.round(
    (goals.reduce((sum, g) => sum + Math.min(g.now / g.target, 1), 0) / goals.length) * 100
  )

  return { goals, avg }
}

export { formatChi, getGoals }
