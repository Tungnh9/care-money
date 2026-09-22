import { describe, it, expect } from "vitest"

import { detectSpendingAnomaly, detectTagAnomaly, detectMoodSpendingCorrelation } from "../insights-calculations"
import type { Expense } from "@/features/budget/types"
import type { JournalEntry } from "@/features/journal/types"

function expense(id: number, dayKey: string, amount: number): Expense {
  return { id, dayKey, amount, tag: null }
}

describe("detectSpendingAnomaly", () => {
  it("returns null when there is less than 3 months of prior history", () => {
    const expenses = [expense(1, "2026-03-01", 1_000_000), expense(2, "2026-04-01", 1_000_000)]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-15")).toBeNull()
  })

  it("returns null when the current month is within normal variance", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 1_050_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("returns null when the 3 prior months have zero variance (std = 0)", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_000_000),
      expense(3, "2026-03-15", 1_000_000),
      expense(4, "2026-04-15", 5_000_000),
    ]
    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("reports a high anomaly with the correct id, direction and percentage", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-15", 3_000_000),
    ]
    const insight = detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")

    expect(insight).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tháng này bạn chi tiêu cao hơn khoảng 200% so với trung bình 3 tháng gần đây.",
    })
  })

  it("suppresses a 'thấp hơn' (lower) signal while the month is still in progress", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      // Tháng 4 (30 ngày) mới đến ngày 15 (giữa tháng), chi 500k — thấp hơn hẳn TB 3 tháng trước
      // (1tr) nhưng tháng còn CHƯA qua hết nên đây chỉ là "chưa tới lúc chi", không phải bất
      // thường thật — không nên báo giữa chừng.
      expense(4, "2026-04-10", 500_000),
    ]

    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-15")).toBeNull()
  })

  it("reports a genuine 'thấp hơn' (lower) signal once the month is nearly complete", () => {
    const expenses = [
      expense(1, "2026-01-15", 1_000_000),
      expense(2, "2026-02-15", 1_100_000),
      expense(3, "2026-03-15", 900_000),
      expense(4, "2026-04-10", 500_000),
    ]

    const insight = detectSpendingAnomaly(expenses, "2026-04", "2026-04-29")

    expect(insight).toEqual({
      id: "spending-anomaly-2026-04",
      text: "Tháng này bạn chi tiêu thấp hơn khoảng 50% so với trung bình 3 tháng gần đây.",
    })
  })

  it("ignores a month where only 1 of the 3 baseline months has real spending (diluted average)", () => {
    // Chỉ tháng 3 có chi tiêu thật (3,000,000), tháng 1-2 chưa có gì (tài khoản mới bắt đầu ghi
    // từ tháng 3). Tháng 4 tăng thật 20% (3,600,000) — nếu tính trung bình thẳng trên cả 3 tháng
    // (gồm 2 tháng = 0, trung bình còn 1,000,000), % lệch báo ra sẽ bị thổi phồng thành ~260%.
    const expenses = [expense(1, "2026-03-15", 3_000_000), expense(2, "2026-04-15", 3_600_000)]

    expect(detectSpendingAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })
})

function taggedExpense(id: number, dayKey: string, amount: number, label: string): Expense {
  return { id, dayKey, amount, tag: { label, emoji: "🛍️", tint: "#E7F6EF" } }
}

describe("detectTagAnomaly", () => {
  it("reports only the single most-deviated tag, ignoring one within threshold", () => {
    const expenses = [
      // "Ăn uống" ổn định quanh 500k mỗi tháng — KHÔNG lệch.
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
      // "Mua sắm" tăng vọt tháng 4 — LỆCH mạnh.
      taggedExpense(5, "2026-01-12", 200_000, "Mua sắm"),
      taggedExpense(6, "2026-02-12", 200_000, "Mua sắm"),
      taggedExpense(7, "2026-03-12", 200_000, "Mua sắm"),
      taggedExpense(8, "2026-04-12", 500_000, "Mua sắm"),
    ]

    const insight = detectTagAnomaly(expenses, "2026-04", "2026-04-20")

    expect(insight).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Chi tiêu cho "🛍️ Mua sắm" tháng này tăng 150% so với trung bình 3 tháng trước.',
    })
  })

  it("returns null when no tag exceeds the threshold", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 510_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("ignores a tag with no spending in the prior 3 months (no baseline to compare)", () => {
    const expenses = [taggedExpense(1, "2026-04-05", 1_000_000, "Du lịch")]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("suppresses a 'giảm' (decrease) signal while the month is still in progress", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      // Tháng 4 (30 ngày) mới đến ngày 15, chi 200k — thấp hơn nhiều so với TB 3 tháng trước
      // (500k) nhưng tháng còn CHƯA qua hết, nên đây là tín hiệu giả, chưa nên báo.
      taggedExpense(4, "2026-04-10", 200_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-15")).toBeNull()
  })

  it("reports a 'giảm' (decrease) signal once the month is nearly complete", () => {
    const expenses = [
      taggedExpense(1, "2026-01-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-02-10", 520_000, "Ăn uống"),
      taggedExpense(3, "2026-03-10", 480_000, "Ăn uống"),
      taggedExpense(4, "2026-04-10", 200_000, "Ăn uống"),
    ]

    const insight = detectTagAnomaly(expenses, "2026-04", "2026-04-29")

    expect(insight).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Chi tiêu cho "🛍️ Ăn uống" tháng này giảm 60% so với trung bình 3 tháng trước.',
    })
  })

  it("ignores a tag that only has spending in 1 of the 3 prior months (not enough baseline yet)", () => {
    // Người dùng mới bắt đầu ghi tag "Ăn uống" từ tháng 3 — tháng 1, 2 chưa có gì. Nếu tính
    // trung bình thẳng trên cả 3 tháng (gồm 2 tháng = 0), trung bình bị pha loãng còn 500k/3 ≈
    // 166,667, khiến 600k tháng 4 bị báo tăng ~260% dù thực tế chỉ tăng 20% so với tháng liền trước.
    const expenses = [
      taggedExpense(1, "2026-03-10", 500_000, "Ăn uống"),
      taggedExpense(2, "2026-04-10", 600_000, "Ăn uống"),
    ]

    expect(detectTagAnomaly(expenses, "2026-04", "2026-04-20")).toBeNull()
  })

  it("skips the untagged (Không gắn thẻ) bucket even when it deviates far more than any real tag", () => {
    // Chi tiêu chưa gắn thẻ vọt +400% (mạnh hơn nhiều so với "Ăn uống" chỉ +60%) — nhưng
    // "Không gắn thẻ" không phải 1 tag người dùng thật chọn, không nên bị báo như 1 tag, và
    // không được che mất tag thật sự có bất thường bên dưới.
    const expenses = [
      expense(1, "2026-01-10", 1_000_000),
      expense(2, "2026-02-10", 1_000_000),
      expense(3, "2026-03-10", 1_000_000),
      expense(4, "2026-04-10", 5_000_000),
      taggedExpense(5, "2026-01-12", 500_000, "Ăn uống"),
      taggedExpense(6, "2026-02-12", 520_000, "Ăn uống"),
      taggedExpense(7, "2026-03-12", 480_000, "Ăn uống"),
      taggedExpense(8, "2026-04-12", 800_000, "Ăn uống"),
    ]

    const insight = detectTagAnomaly(expenses, "2026-04", "2026-04-20")

    expect(insight).toEqual({
      id: "tag-anomaly-2026-04",
      text: 'Chi tiêu cho "🛍️ Ăn uống" tháng này tăng 60% so với trung bình 3 tháng trước.',
    })
  })
})

function moodEntry(id: number, score: number): JournalEntry {
  return { id, text: "x", time: "09:00", date: "01/01", words: 1, mood: { emoji: "🙂", label: "x", tint: "#fff", score } }
}

describe("detectMoodSpendingCorrelation", () => {
  const DAY_MS = 24 * 60 * 60 * 1000

  it("returns null when there are fewer than 5 days in either group", () => {
    const today = "2026-09-21"
    const entries = [moodEntry(new Date(2026, 8, 20).getTime(), 1), moodEntry(new Date(2026, 8, 19).getTime(), 5)]
    expect(detectMoodSpendingCorrelation([], entries, today)).toBeNull()
  })

  it("ignores entries with no score (saved before this feature existed)", () => {
    const today = "2026-09-21"
    const legacyEntry: JournalEntry = {
      id: new Date(2026, 8, 20).getTime(),
      text: "x",
      time: "09:00",
      date: "20/09",
      words: 1,
      mood: { emoji: "🙂", label: "x", tint: "#fff" } as JournalEntry["mood"],
    }
    expect(detectMoodSpendingCorrelation([], [legacyEntry], today)).toBeNull()
  })

  it("reports a correlation when low-mood days spend noticeably more than high-mood days", () => {
    const today = new Date(2026, 8, 21)
    const todayKey = "2026-09-21"
    const entries: JournalEntry[] = []
    const expenses: Expense[] = []

    for (let i = 0; i < 5; i++) {
      const lowDay = new Date(today.getTime() - i * DAY_MS)
      entries.push(moodEntry(lowDay.getTime(), 1))
      const lowDayKey = `2026-09-${String(21 - i).padStart(2, "0")}`
      expenses.push(expense(100 + i, lowDayKey, 300_000))
    }
    for (let i = 5; i < 10; i++) {
      const highDay = new Date(today.getTime() - i * DAY_MS)
      entries.push(moodEntry(highDay.getTime(), 5))
      const highDayKey = `2026-09-${String(21 - i).padStart(2, "0")}`
      expenses.push(expense(200 + i, highDayKey, 100_000))
    }

    const insight = detectMoodSpendingCorrelation(expenses, entries, todayKey)

    expect(insight).toEqual({
      id: "mood-spending-2026-09",
      text: "Trong 60 ngày qua, những ngày tâm trạng thấp bạn chi tiêu nhiều hơn khoảng 200% so với những ngày tâm trạng cao.",
    })
  })
})

import { forecastSavingsGoal } from "../insights-calculations"
import type { NetWorthSnapshot } from "../net-worth-history-storage"

function linearHistory(startDate: string, points: number, dailyIncrease: number, startValue: number): NetWorthSnapshot[] {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const savingsTotal = startValue + i * dailyIncrease
    return { date, net: savingsTotal, savingsTotal }
  })
}

function linearHistoryWithGaps(
  startDate: string,
  points: number,
  stepDays: number,
  dailyIncrease: number,
  startValue: number
): NetWorthSnapshot[] {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i * stepDays)
    const date = d.toISOString().slice(0, 10)
    const savingsTotal = startValue + i * stepDays * dailyIncrease
    return { date, net: savingsTotal, savingsTotal }
  })
}

describe("forecastSavingsGoal", () => {
  it("returns null when there are fewer than 14 points", () => {
    const history = linearHistory("2026-09-01", 10, 100_000, 5_000_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-10")).toBeNull()
  })

  it("returns null when fewer than 30 real days have passed, even with ≥14 points", () => {
    // Tiết kiệm dồn theo lương (1 lần/tháng), không đều mỗi ngày — nếu khoảng dữ liệu còn quá
    // ngắn, 1 lần nhận lương rơi đúng giữa khoảng đó có thể thổi phồng tốc độ tính ra rất nhiều.
    // 14 điểm/ngày liên tiếp (7 ngày đầu 5tr, 7 ngày sau vọt lên 15tr — mô phỏng 1 lần lương giữa
    // khoảng) chỉ span 13 ngày < 30 ngày tối thiểu — phải chặn lại dù đủ 14 điểm. Mục tiêu để
    // 100 triệu (khớp mục tiêu tiết kiệm thật trong app) — nếu KHÔNG có điều kiện 30 ngày, hồi quy
    // trên dữ liệu này ra độ dốc ~1,077,000đ/ngày → dự báo đạt mục tiêu chỉ trong ~79 ngày, một kết
    // luận lạc quan sai lệch chỉ vì 1 lần lương rơi đúng giữa cửa sổ ngắn.
    const history = [
      ...linearHistory("2026-09-01", 7, 0, 5_000_000),
      ...linearHistory("2026-09-08", 7, 0, 15_000_000),
    ]
    expect(forecastSavingsGoal(history, 100_000_000, "2026-09-14")).toBeNull()
  })

  it("returns null when the trend is flat or decreasing", () => {
    const history = linearHistory("2026-08-15", 31, 0, 5_000_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toBeNull()
  })

  it("returns null when the target is already reached", () => {
    const history = linearHistory("2026-08-15", 31, 100_000, 9_500_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toBeNull()
  })

  it("forecasts the correct target date for a steady upward trend", () => {
    const history = linearHistory("2026-08-15", 31, 100_000, 5_000_000)
    const today = "2026-09-14"

    const insight = forecastSavingsGoal(history, 10_000_000, today)

    // Điểm cuối (i=30): 5,000,000 + 30*100,000 = 8,000,000. Còn thiếu 2,000,000, tốc độ
    // 100,000/ngày → 20 ngày nữa. shiftDay("2026-09-14", 20): còn 16 ngày hết tháng 9 (15-30)
    // rồi +4 ngày sang tháng 10 → "2026-10-04".
    expect(insight).toEqual({
      id: "savings-forecast-2026-09",
      text: expect.stringContaining("04/10"),
    })
  })

  it("regresses on actual elapsed days, not snapshot index, when snapshots have gaps", () => {
    // 16 điểm, cách nhau 2 ngày thực (tổng 30 ngày), tốc độ tiết kiệm THẬT là 100,000/ngày. Nếu
    // hồi quy theo chỉ số phần tử (0,1,2,...) thay vì số ngày thực đã trôi qua, độ dốc sẽ bị tính
    // gấp đôi (200,000/"lần ghi", hiểu nhầm thành /ngày) — dự báo sẽ về đích sớm hơn ~2 lần so
    // với thực tế.
    const history = linearHistoryWithGaps("2026-08-01", 16, 2, 100_000, 5_000_000)
    const today = "2026-08-31" // = điểm ghi cuối cùng (2026-08-01 + 30 ngày)

    const insight = forecastSavingsGoal(history, 10_000_000, today)

    // Điểm cuối (i=15): 5,000,000 + 30*100,000 = 8,000,000. Còn thiếu 2,000,000, tốc độ thật
    // 100,000/ngày (không phải 200,000/ngày nếu tính sai theo chỉ số) → 20 ngày nữa.
    // shiftDay("2026-08-31", 20): tháng 8 hết ngay tại 31, +20 ngày sang tháng 9 → "2026-09-20".
    expect(insight).toEqual({
      id: "savings-forecast-2026-08",
      text: expect.stringContaining("20/09"),
    })
  })

  it("returns null instead of an absurdly distant date when the trend is barely positive", () => {
    // Độ dốc dương nhưng cực nhỏ (50đ/ngày) so với khoảng cách còn lại (5 triệu) sẽ ngoại suy ra
    // hàng chục nghìn ngày (~hàng trăm năm) — 1 con số vô nghĩa với người dùng, phải chặn lại
    // thay vì hiện 1 ngày xa viển vông.
    const history = linearHistory("2026-08-15", 31, 50, 5_000_000)
    expect(forecastSavingsGoal(history, 10_000_000, "2026-09-14")).toBeNull()
  })
})
