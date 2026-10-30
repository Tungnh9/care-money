// 1 ảnh của ghi chép. Ảnh nằm trên Cloudinary, không bao giờ trong localStorage — ở đây chỉ giữ mã ảnh
// (`public_id`) và kích thước (`bytes` để cộng tổng dung lượng ảnh đã dùng).
interface LifePlanImage {
  id: string
  bytes: number
  width: number
  height: number
}

interface LifeNote {
  id: number
  // dayKey "yyyy-mm-dd" — được chọn cả ngày trong tương lai.
  day: string
  title: string
  // Chữ thường, giữ xuống dòng.
  content: string
  images: LifePlanImage[]
  // Kế hoạch đã gắn — không gắn thì không có key này.
  planId?: number
}

type LifePlanStatus = "planned" | "doing" | "done"

interface LifePlan {
  id: number
  title: string
  // Thời điểm muốn đạt: năm bắt buộc, tháng (1–12) tuỳ chọn.
  targetYear: number
  targetMonth?: number
  status: LifePlanStatus
  // dayKey ngày chuyển sang "đã đạt" — chỉ kế hoạch đã đạt mới có.
  doneDay?: string
  note?: string
}

type LifeNoteInput = Omit<LifeNote, "id">

// Ngày đạt do hook tự ghi theo trạng thái, không nhập tay.
type LifePlanInput = Omit<LifePlan, "id" | "doneDay">

export type { LifeNote, LifeNoteInput, LifePlan, LifePlanImage, LifePlanInput, LifePlanStatus }
