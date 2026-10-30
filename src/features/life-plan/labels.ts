import type { LifePlan, LifePlanStatus } from "@/lib/life-plan/types"

// Chữ và màu dùng chung cho kế hoạch ở dải lọc, dòng thời gian và form kế hoạch.

const PLAN_STATUS_LABEL: Record<LifePlanStatus, string> = { planned: "Dự định", doing: "Đang làm", done: "Đã đạt" }

// Thứ tự các nút trạng thái trong form kế hoạch.
const PLAN_STATUSES = (["planned", "doing", "done"] as const).map((value) => ({
  value,
  label: PLAN_STATUS_LABEL[value],
}))

// Nhãn trạng thái: dự định xám, đang làm vàng chuối, đã đạt xanh lá.
const PLAN_STATUS_TONE: Record<LifePlanStatus, string> = {
  planned: "bg-[var(--ob-color-surface-sunken)] text-[var(--ob-color-text-muted)]",
  doing: "bg-[var(--ob-color-reward-soft)] text-[var(--ob-color-reward-text)]",
  done: "bg-[var(--ob-color-income-soft)] text-[var(--ob-color-income)]",
}

const PLAN_STATUS_DOT: Record<LifePlanStatus, string> = {
  planned: "var(--ob-color-border-strong)",
  doing: "var(--ob-color-reward)",
  done: "var(--ob-color-income)",
}

// dayKey "2026-10-20" → "20/10/2026": đúng dạng người dùng gõ vào ô Ngày, và dạng ngày trong tên nút Sửa/Xoá.
function toInputDate(day: string): string {
  const [y, m, d] = day.split("-")
  return `${d}/${m}/${y}`
}

// Hạn của kế hoạch: "tháng 06/2030", chỉ có năm thì "năm 2030".
function planTargetLabel(plan: Pick<LifePlan, "targetYear" | "targetMonth">): string {
  return plan.targetMonth === undefined
    ? `năm ${plan.targetYear}`
    : `tháng ${String(plan.targetMonth).padStart(2, "0")}/${plan.targetYear}`
}

const BYTES_PER_MB = 1024 * 1024

// Dung lượng ảnh, 1 chữ số thập phân kiểu Việt: "0,0", "1,5", "1.234,5".
function formatMegabytes(bytes: number): string {
  return (bytes / BYTES_PER_MB).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export {
  PLAN_STATUSES,
  PLAN_STATUS_DOT,
  PLAN_STATUS_LABEL,
  PLAN_STATUS_TONE,
  formatMegabytes,
  planTargetLabel,
  toInputDate,
}
