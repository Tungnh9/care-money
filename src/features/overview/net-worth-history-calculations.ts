import type { NetWorthSnapshot } from "./net-worth-history-storage"

function shouldRecordSnapshot(history: NetWorthSnapshot[], today: string): boolean {
  const last = history[history.length - 1]
  return !last || last.date !== today
}

function appendSnapshot(history: NetWorthSnapshot[], snapshot: NetWorthSnapshot): NetWorthSnapshot[] {
  if (shouldRecordSnapshot(history, snapshot.date)) return [...history, snapshot]
  // Đã có bản ghi cho hôm nay — nhưng bản ghi đó có thể đến từ 1 lần gọi CÒN CHƯA có dữ liệu
  // thật (vd. component gọi recordSnapshot ngay trong effect đầu tiên, trước khi 1 hook khác
  // như useFinance kịp hydrate xong). Ghi đè bằng giá trị MỚI NHẤT nếu khác, thay vì giữ mãi
  // giá trị cũ (có thể là 0) suốt cả ngày — coi lần gọi sau trong cùng ngày là bản cập nhật, không
  // phải bản ghi trùng.
  const last = history[history.length - 1]
  if (last.net === snapshot.net && last.savingsTotal === snapshot.savingsTotal) return history
  return [...history.slice(0, -1), snapshot]
}

export { shouldRecordSnapshot, appendSnapshot }
