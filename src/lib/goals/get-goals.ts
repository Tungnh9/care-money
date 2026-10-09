import { formatPhan } from "@/lib/finance/finance-calculations"
import type { SavingsFund } from "@/lib/finance/types"
import { formatMoney } from "@/lib/format"

import type { Goal, GoalsInput } from "@/lib/goals/types"

const GOLD_TARGET_PHAN = 180 // 18 chỉ

function formatChi(phan: number): string {
  // Làm tròn tới 0,1 phân trước khi tách chỉ/phân — dữ liệu cũ có thể có phân lẻ (12.3 từng hiện
  // "1 chỉ 2.3000000000000007 phân"). Khác phanToChi: luôn có tiền tố "N chỉ", kể cả "0 chỉ".
  const tenths = Math.round(phan * 10)
  const chi = Math.floor(tenths / 100)
  const rest = (tenths % 100) / 10
  return `${chi} chỉ${rest ? ` ${formatPhan(rest)} phân` : ""}`
}

// Đủ (hoặc vượt) mục tiêu thì báo đã đạt — không bao giờ in "Còn -2 chỉ · tương đương -… ₫". Chưa
// biết giá quy đổi (<= 0: chưa cửa hàng nào có giá) thì bỏ phần "tương đương" thay vì in "0 ₫".
function goldRemainingNote(goldPhan: number, target: number, goldPricePerPhan: number, hidden: boolean): string {
  const remaining = target - goldPhan
  if (remaining <= 0) return `Đã đạt mục tiêu ${formatChi(target)}`
  const remainingChi =
    remaining % 10 === 0 ? String(remaining / 10) : (remaining / 10).toFixed(1).replace(".", ",")
  if (goldPricePerPhan <= 0) return `Còn ${remainingChi} chỉ`
  return `Còn ${remainingChi} chỉ · tương đương ${formatMoney(remaining * goldPricePerPhan, hidden)}`
}

function carGoalNote(fund: SavingsFund | undefined): string {
  if (!fund) return "Chưa gắn quỹ tiết kiệm nào. Chọn 1 quỹ bên dưới để bắt đầu theo dõi."
  if (fund.target <= 0) {
    return `Quỹ "${fund.name}" chưa có mục tiêu. Đặt mục tiêu cho quỹ ở màn Tài chính để theo dõi tiến độ.`
  }
  return `Đang gắn với quỹ "${fund.name}" ở màn Tài chính`
}

// Tỉ lệ hoàn thành 0..1. Mục tiêu <= 0 (vd. quỹ mua xe để mục tiêu 0 — form quỹ nhận "0") không có
// tiến độ nào để đo: coi là 0, thay vì 0/0 = NaN (NaN% ở mọi chỗ hiện %, kể cả số trung bình) hay
// x/0 = Infinity (tick "đã đạt" kèm pháo giấy).
function progressRatio(now: number, target: number): number {
  return target > 0 ? Math.min(now / target, 1) : 0
}

function withPercent(now: number, target: number) {
  return { percent: Math.round(progressRatio(now, target) * 100), done: target > 0 && now >= target }
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
      name: "Tích lũy 18 chỉ vàng",
      icon: "gold",
      now: goldPhan,
      target: GOLD_TARGET_PHAN,
      format: formatChi,
      note: goldRemainingNote(goldPhan, GOLD_TARGET_PHAN, goldPricePerPhan, hidden),
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
      note: carGoalNote(carFund),
      tone: "action" as const,
      linked: !!carFund,
    },
  ]

  const goals: Goal[] = defs.map((g) => ({ ...g, ...withPercent(g.now, g.target) }))
  const avg = Math.round(
    (goals.reduce((sum, g) => sum + progressRatio(g.now, g.target), 0) / goals.length) * 100
  )

  return { goals, avg }
}

export { formatChi, getGoals }
