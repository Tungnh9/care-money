import { describe, it, expect, vi, beforeEach } from "vitest"

import { deleteCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import type { LifePlanImage } from "@/lib/life-plan/types"
import { deleteLifePlanImage, uploadLifePlanImage } from "../image-api"
import { removePhoto, removePhotos, uploadPhoto } from "../note-photos"

vi.mock("@/lib/life-plan/image-cache", () => ({
  getCachedImage: vi.fn(),
  putCachedImage: vi.fn(),
  deleteCachedImage: vi.fn(),
  clearImageCache: vi.fn(),
}))
vi.mock("../image-api", () => ({
  fetchImagesConfigured: vi.fn(),
  uploadLifePlanImage: vi.fn(),
  fetchLifePlanImage: vi.fn(),
  deleteLifePlanImage: vi.fn(),
}))

const SECRET = "test-secret"

function cloudPhoto(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 1000, width: 1600, height: 1200 }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(putCachedImage).mockResolvedValue(undefined)
  vi.mocked(deleteCachedImage).mockResolvedValue(undefined)
})

describe("uploadPhoto", () => {
  it("uploads the shrunk photo with the key, then keeps that same photo on this device under its new id", async () => {
    const blob = new Blob(["small"], { type: "image/webp" })
    vi.mocked(uploadLifePlanImage).mockResolvedValue(cloudPhoto(1))

    expect(await uploadPhoto(blob, SECRET)).toEqual(cloudPhoto(1))
    expect(uploadLifePlanImage).toHaveBeenCalledWith(blob, SECRET)
    expect(putCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id, blob)
    expect(vi.mocked(putCachedImage).mock.calls[0][1]).toBe(blob)
  })

  it("keeps nothing on this device when the upload fails", async () => {
    vi.mocked(uploadLifePlanImage).mockRejectedValue(new Error("Ảnh lớn hơn 4MB."))

    await expect(uploadPhoto(new Blob(["x"]), SECRET)).rejects.toThrow("Ảnh lớn hơn 4MB.")
    expect(putCachedImage).not.toHaveBeenCalled()
  })
})

describe("removePhoto / removePhotos", () => {
  it("removes a photo from the cache and from Cloudinary", async () => {
    vi.mocked(deleteLifePlanImage).mockResolvedValue(true)

    expect(await removePhoto(cloudPhoto(1).id, SECRET)).toBe(true)
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
    expect(deleteLifePlanImage).toHaveBeenCalledWith(cloudPhoto(1).id, SECRET)
  })

  it("says not every photo left Cloudinary when one fails or is not deleted, still clearing all of them from the cache", async () => {
    vi.mocked(deleteLifePlanImage)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error("Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."))
      .mockResolvedValueOnce(false)
    const ids = [cloudPhoto(1).id, cloudPhoto(2).id, cloudPhoto(3).id]

    expect(await removePhotos(ids, SECRET)).toBe(false)
    expect(vi.mocked(deleteCachedImage).mock.calls).toEqual(ids.map((id) => [id]))
    expect(vi.mocked(deleteLifePlanImage).mock.calls.map(([id]) => id)).toEqual(ids)
  })

  it("reports success for no photo at all", async () => {
    expect(await removePhotos([], SECRET)).toBe(true)
    expect(deleteLifePlanImage).not.toHaveBeenCalled()
  })

  it("clears the cache but does not call the server without a sync key, reporting the photo as not deleted", async () => {
    expect(await removePhotos([cloudPhoto(1).id], "")).toBe(false)
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
    expect(deleteLifePlanImage).not.toHaveBeenCalled()
  })
})
