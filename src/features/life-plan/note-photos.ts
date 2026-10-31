import { deleteCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import type { LifePlanImage } from "@/lib/life-plan/types"
import { deleteLifePlanImage, uploadLifePlanImage } from "./image-api"

// Ảnh của ghi chép đi 2 nơi cùng lúc: Cloudinary (qua API của app) và cache IndexedDB của máy này. Tải lên thì cất
// luôn bản đã thu nhỏ vào cache — ghi chép vừa lưu hiện ảnh của chính nó từ máy, không tải lại từ cloud (tốn credit
// tải về). Bỏ 1 ảnh (lưu hỏng phải xoá lại, bỏ ảnh khi sửa, xoá ghi chép) thì xoá ở cả 2 nơi.

// Tải 1 ảnh đã thu nhỏ lên rồi cất đúng blob đó vào cache dưới mã ảnh server vừa cấp. Chờ cất xong mới trả về, để
// lúc ghi chép hiện ra thì ảnh đã nằm sẵn trong cache. Tải lên lỗi thì ném lỗi, không cất gì.
async function uploadPhoto(blob: Blob, secret: string): Promise<LifePlanImage> {
  const image = await uploadLifePlanImage(blob, secret)
  await putCachedImage(image.id, blob)
  return image
}

// true khi ảnh đã không còn trên Cloudinary. Cache luôn được xoá (không bao giờ lỗi). Máy chưa có khoá đồng bộ thì
// server chắc chắn từ chối — khỏi gọi, coi như chưa xoá được trên cloud.
async function removePhoto(id: string, secret: string): Promise<boolean> {
  await deleteCachedImage(id)
  if (!secret) return false
  return deleteLifePlanImage(id, secret)
}

// Xoá nhiều ảnh cùng lúc; true chỉ khi mọi ảnh đã rời Cloudinary. 1 ảnh lỗi không chặn các ảnh khác.
async function removePhotos(ids: string[], secret: string): Promise<boolean> {
  const removed = await Promise.all(ids.map((id) => removePhoto(id, secret).catch(() => false)))
  return removed.every(Boolean)
}

export { removePhoto, removePhotos, uploadPhoto }
