import type { LifePlanImage } from "@/lib/life-plan/types"
import { UPLOAD_FAILED } from "./image-api"

type UploadNoteImagesResult = { ok: true; images: LifePlanImage[] } | { ok: false; error: string }

// Xoá lại 1 ảnh vừa tải lên. Lỗi thì bỏ qua — chấp nhận còn ảnh mồ côi trên Cloudinary, câu báo cho người dùng
// vẫn là lỗi tải lên.
async function removeQuietly(remove: (id: string) => Promise<boolean>, id: string): Promise<void> {
  try {
    await remove(id)
  } catch {
    // Bỏ qua, xem trên.
  }
}

// Tải lên lần lượt từng ảnh mới của 1 ghi chép, kết quả giữ đúng thứ tự đã chọn. 1 ảnh lỗi thì dừng ở đó: ghi chép
// sẽ không được lưu, nên các ảnh đã tải lên trong lần này bị xoá lại cho khỏi thành ảnh mồ côi, và trả câu lỗi của
// ảnh đó để form báo — form giữ nguyên chữ đã gõ, bấm Lưu lần nữa là tải lại từ đầu.
async function uploadNoteImages(
  blobs: Blob[],
  upload: (blob: Blob) => Promise<LifePlanImage>,
  remove: (id: string) => Promise<boolean>
): Promise<UploadNoteImagesResult> {
  const uploaded: LifePlanImage[] = []
  for (const blob of blobs) {
    try {
      uploaded.push(await upload(blob))
    } catch (error) {
      await Promise.all(uploaded.map((image) => removeQuietly(remove, image.id)))
      return { ok: false, error: error instanceof Error && error.message ? error.message : UPLOAD_FAILED }
    }
  }
  return { ok: true, images: uploaded }
}

export { uploadNoteImages, type UploadNoteImagesResult }
