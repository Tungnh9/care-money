import { toast } from "sonner"

// navigator.clipboard có thể không có (trang không HTTPS) hoặc bị từ chối quyền — luôn báo kết quả
// bằng toast thay vì để lỗi văng ra khỏi click handler.
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Đã copy")
    return true
  } catch {
    toast.error("Không copy được. Hãy bôi đen rồi copy tay.")
    return false
  }
}

export { copyText }
