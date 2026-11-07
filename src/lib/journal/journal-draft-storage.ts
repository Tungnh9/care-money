import { z } from "zod"

import { notifyDataChanged } from "@/lib/data-change-bus"

// Bản nháp bài nhật ký MỚI đang viết dở: giữ qua chuyển trang, tải lại, iPhone tự đóng tab nền. Chỉ ở máy này —
// không xuất file, không đồng bộ (nháp chưa phải bài đã lưu). Trang Nhật ký cố ý KHÔNG theo dõi key này qua
// useStorageSync: nháp của tab khác đè lên chữ đang gõ ở tab này là mất chữ (ngoại lệ của CLAUDE.md §3 quy tắc 1).
const JOURNAL_DRAFT_KEY = "journal-draft"

interface JournalDraft {
  html: string
  words: number
  // Nhãn mood đang chọn cho bài mới ("" = chưa chọn).
  mood: string
  // ISO — để báo "đã khôi phục bản nháp lúc …".
  savedAt: string
}

const journalDraftSchema = z.object({
  html: z.string(),
  words: z.number().catch(0),
  mood: z.string().catch(""),
  savedAt: z.string().catch(""),
})

// Nháp chỉ có thẻ HTML rỗng ("<br>", "<p></p>") coi như không có.
function hasText(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim() !== ""
  )
}

function getJournalDraft(): JournalDraft | null {
  try {
    const raw = window.localStorage.getItem(JOURNAL_DRAFT_KEY)
    if (!raw) return null
    const parsed = journalDraftSchema.safeParse(JSON.parse(raw))
    return parsed.success && hasText(parsed.data.html) ? parsed.data : null
  } catch {
    return null
  }
}

// Ghi nháp là phần thêm: bộ nhớ đầy hay trình duyệt chặn thì bỏ qua, không bao giờ làm hỏng việc đang gõ.
function setJournalDraft(draft: JournalDraft) {
  if (!hasText(draft.html)) {
    clearJournalDraft()
    return
  }
  try {
    window.localStorage.setItem(JOURNAL_DRAFT_KEY, JSON.stringify(draft))
    notifyDataChanged()
  } catch {
    // Bỏ qua — xem chú thích trên.
  }
}

function clearJournalDraft() {
  try {
    if (window.localStorage.getItem(JOURNAL_DRAFT_KEY) === null) return
    window.localStorage.removeItem(JOURNAL_DRAFT_KEY)
    notifyDataChanged()
  } catch {
    // Bỏ qua.
  }
}

export { JOURNAL_DRAFT_KEY, clearJournalDraft, getJournalDraft, setJournalDraft, type JournalDraft }
