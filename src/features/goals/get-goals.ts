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

  const carFund = data.carFundName
    ? data.savings.find((f) => f.name === data.carFundName)
    : undefined

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
      linked: true,
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
      linked: true,
    },
    {
      key: "car",
      name: "Mua xe ô tô",
      icon: "car",
      now: carFund ? carFund.amount : 0,
      target: carFund ? carFund.target : 1,
      format: (n: number) => formatMoney(n, hidden),
      note: carFund
        ? `Đang gắn với quỹ "${carFund.name}" ở màn Tài chính`
        : "Chưa gắn quỹ tiết kiệm nào. Chọn 1 quỹ bên dưới để bắt đầu theo dõi.",
      tone: "action" as const,
      linked: !!carFund,
    },
  ]

  const goals: Goal[] = defs.map((g) => ({ ...g, ...withPercent(g.now, g.target) }))
  const avg = Math.round(
    (goals.reduce((sum, g) => sum + Math.min(g.now / g.target, 1), 0) / goals.length) * 100
  )

  return { goals, avg }
}

export { formatChi, getGoals }
