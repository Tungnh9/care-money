// Khung CEFR từ dễ tới khó: A1–A2 cơ bản, B1–B2 trung cấp, C1–C2 nâng cao. Thứ tự trong mảng là thứ tự hiện trên
// trang (dải lọc, nhóm từ trong 1 chủ đề).
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const

type CefrLevel = (typeof CEFR_LEVELS)[number]

export { CEFR_LEVELS, type CefrLevel }
