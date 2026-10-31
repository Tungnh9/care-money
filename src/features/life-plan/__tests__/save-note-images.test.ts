import { describe, it, expect, vi } from "vitest"

import { uploadNoteImages } from "../save-note-images"
import type { LifePlanImage } from "@/lib/life-plan/types"

function picked(name: string): Blob {
  return new Blob([name], { type: "image/webp" })
}

function photo(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 100_000 * n, width: 1600, height: 1200 }
}

describe("uploadNoteImages", () => {
  it("uploads the photos one at a time and returns them in the order they were picked", async () => {
    const blobs = [picked("a"), picked("b"), picked("c")]
    let running = 0
    let mostAtOnce = 0
    // Ảnh đầu trả về chậm nhất: tải song song thì ảnh 2, 3 đã chạy trong lúc ảnh 1 chưa xong.
    const upload = vi.fn(async (blob: Blob) => {
      running++
      mostAtOnce = Math.max(mostAtOnce, running)
      const index = blobs.indexOf(blob)
      await new Promise((resolve) => setTimeout(resolve, (blobs.length - index) * 5))
      running--
      return photo(index + 1)
    })
    const remove = vi.fn()

    const result = await uploadNoteImages(blobs, upload, remove)

    expect(result).toEqual({ ok: true, images: [photo(1), photo(2), photo(3)] })
    expect(upload.mock.calls.map(([blob]) => blob)).toEqual(blobs)
    expect(mostAtOnce).toBe(1)
    expect(remove).not.toHaveBeenCalled()
  })

  it("returns no photos without uploading anything when none were picked", async () => {
    const upload = vi.fn()

    expect(await uploadNoteImages([], upload, vi.fn())).toEqual({ ok: true, images: [] })
    expect(upload).not.toHaveBeenCalled()
  })

  it("stops at the photo that fails, removes the photos already uploaded this time and returns that photo's error", async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce(photo(1))
      .mockRejectedValueOnce(new Error("Ảnh lớn hơn 4MB."))
      .mockResolvedValueOnce(photo(3))
    const remove = vi.fn().mockResolvedValue(true)

    const result = await uploadNoteImages([picked("a"), picked("b"), picked("c")], upload, remove)

    expect(result).toEqual({ ok: false, error: "Ảnh lớn hơn 4MB." })
    // Ảnh 3 không được tải lên — ghi chép không lưu, tải lên chỉ thêm ảnh mồ côi.
    expect(upload).toHaveBeenCalledTimes(2)
    expect(remove.mock.calls).toEqual([[photo(1).id]])
  })

  it("still returns the upload error when removing the photos already uploaded fails too", async () => {
    const upload = vi
      .fn()
      .mockResolvedValueOnce(photo(1))
      .mockResolvedValueOnce(photo(2))
      .mockRejectedValueOnce(new Error("Sai secret đồng bộ."))
    const remove = vi
      .fn()
      .mockRejectedValueOnce(new Error("Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."))
      .mockResolvedValueOnce(false)

    const result = await uploadNoteImages([picked("a"), picked("b"), picked("c")], upload, remove)

    expect(result).toEqual({ ok: false, error: "Sai secret đồng bộ." })
    expect(remove.mock.calls.map(([id]) => id).sort()).toEqual([photo(1).id, photo(2).id])
  })

  it("falls back to a general sentence when the failure carries no message", async () => {
    const upload = vi.fn().mockRejectedValue("network down")

    const result = await uploadNoteImages([picked("a")], upload, vi.fn())

    expect(result).toEqual({ ok: false, error: "Không tải được ảnh lên. Vui lòng thử lại." })
  })
})
