import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"

import { getCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import { fetchLifePlanImage } from "../../image-api"
import { useLifePlanImage } from "../../hooks/use-life-plan-image"

// jsdom không có IndexedDB, cũng không có server ảnh — cache và API ảnh đều giả.
vi.mock("@/lib/life-plan/image-cache", () => ({
  getCachedImage: vi.fn(),
  putCachedImage: vi.fn(),
  deleteCachedImage: vi.fn(),
  clearImageCache: vi.fn(),
}))
vi.mock("../../image-api", () => ({
  fetchImagesConfigured: vi.fn(),
  uploadLifePlanImage: vi.fn(),
  fetchLifePlanImage: vi.fn(),
  deleteLifePlanImage: vi.fn(),
}))

const SECRET = "test-secret"
const PHOTO_ID = "life-plan/development/abcdefghij0123456789"
const OTHER_ID = "life-plan/development/zyxwvutsrq9876543210"

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

function photoBlob(text: string): Blob {
  return new Blob([text], { type: "image/webp" })
}

// Promise tự quyết định lúc trả — để giữ 1 ảnh ở trạng thái đang tải.
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  setSyncSecret(SECRET)
  let created = 0
  // jsdom không có URL.createObjectURL — mỗi lần tạo trả 1 link khác nhau để biết link nào bị thu hồi.
  URL.createObjectURL = vi.fn(() => `blob:photo-${++created}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  // Gỡ hook trước khi trả lại URL của jsdom (không có revokeObjectURL): gỡ là hook thu hồi link của nó.
  cleanup()
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

describe("useLifePlanImage", () => {
  it("loads nothing while no photo is asked for yet (a thumbnail still far below the screen)", async () => {
    const { result } = renderHook(() => useLifePlanImage(null))

    await act(async () => {})
    expect(result.current).toEqual({ url: null, failed: false })
    expect(getCachedImage).not.toHaveBeenCalled()
    expect(fetchLifePlanImage).not.toHaveBeenCalled()
  })

  it("shows the photo kept on this device without downloading it again", async () => {
    const cached = photoBlob("cached")
    vi.mocked(getCachedImage).mockResolvedValue(cached)

    const { result } = renderHook(() => useLifePlanImage(PHOTO_ID))

    expect(result.current).toEqual({ url: null, failed: false })
    await waitFor(() => expect(result.current).toEqual({ url: "blob:photo-1", failed: false }))
    expect(getCachedImage).toHaveBeenCalledWith(PHOTO_ID)
    expect(URL.createObjectURL).toHaveBeenCalledWith(cached)
    expect(fetchLifePlanImage).not.toHaveBeenCalled()
    expect(putCachedImage).not.toHaveBeenCalled()
  })

  it("downloads a photo missing from the cache with the sync secret, then keeps it on this device", async () => {
    const downloaded = photoBlob("downloaded")
    vi.mocked(getCachedImage).mockResolvedValue(null)
    vi.mocked(fetchLifePlanImage).mockResolvedValue(downloaded)

    const { result } = renderHook(() => useLifePlanImage(PHOTO_ID))

    await waitFor(() => expect(result.current).toEqual({ url: "blob:photo-1", failed: false }))
    expect(fetchLifePlanImage).toHaveBeenCalledWith(PHOTO_ID, SECRET)
    expect(putCachedImage).toHaveBeenCalledWith(PHOTO_ID, downloaded)
    expect(URL.createObjectURL).toHaveBeenCalledWith(downloaded)
  })

  it("reports failed when the download fails", async () => {
    vi.mocked(getCachedImage).mockResolvedValue(null)
    vi.mocked(fetchLifePlanImage).mockRejectedValue(new Error("Không tìm thấy ảnh."))

    const { result } = renderHook(() => useLifePlanImage(PHOTO_ID))

    await waitFor(() => expect(result.current).toEqual({ url: null, failed: true }))
    expect(putCachedImage).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it("reports failed without calling the server when the device has no sync secret and no copy of the photo", async () => {
    window.localStorage.clear()
    vi.mocked(getCachedImage).mockResolvedValue(null)

    const { result } = renderHook(() => useLifePlanImage(PHOTO_ID))

    await waitFor(() => expect(result.current).toEqual({ url: null, failed: true }))
    expect(fetchLifePlanImage).not.toHaveBeenCalled()
  })

  it("still shows a photo kept on this device when there is no sync secret", async () => {
    window.localStorage.clear()
    vi.mocked(getCachedImage).mockResolvedValue(photoBlob("cached"))

    const { result } = renderHook(() => useLifePlanImage(PHOTO_ID))

    await waitFor(() => expect(result.current).toEqual({ url: "blob:photo-1", failed: false }))
  })

  it("revokes the photo's object URL when unmounted", async () => {
    vi.mocked(getCachedImage).mockResolvedValue(photoBlob("cached"))
    const { result, unmount } = renderHook(() => useLifePlanImage(PHOTO_ID))
    await waitFor(() => expect(result.current.url).toBe("blob:photo-1"))
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo-1")
  })

  it("does not create an object URL for a photo that arrives after unmount", async () => {
    const pending = deferred<Blob | null>()
    vi.mocked(getCachedImage).mockReturnValue(pending.promise)
    const { unmount } = renderHook(() => useLifePlanImage(PHOTO_ID))

    unmount()
    pending.resolve(photoBlob("late"))
    await pending.promise
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it("switching to another photo drops and revokes the previous photo's URL until the new one is ready", async () => {
    vi.mocked(getCachedImage).mockResolvedValueOnce(photoBlob("first"))
    const { result, rerender } = renderHook(({ id }) => useLifePlanImage(id), { initialProps: { id: PHOTO_ID } })
    await waitFor(() => expect(result.current.url).toBe("blob:photo-1"))
    const next = deferred<Blob | null>()
    vi.mocked(getCachedImage).mockReturnValueOnce(next.promise)

    rerender({ id: OTHER_ID })

    expect(result.current).toEqual({ url: null, failed: false })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:photo-1")
    next.resolve(photoBlob("second"))
    await waitFor(() => expect(result.current).toEqual({ url: "blob:photo-2", failed: false }))
    expect(getCachedImage).toHaveBeenLastCalledWith(OTHER_ID)
  })

  it("never hands back the first photo's revoked URL when going back to it before the second one is ready", async () => {
    vi.mocked(getCachedImage).mockResolvedValueOnce(photoBlob("first"))
    const { result, rerender } = renderHook(({ id }) => useLifePlanImage(id), { initialProps: { id: PHOTO_ID } })
    await waitFor(() => expect(result.current.url).toBe("blob:photo-1"))
    // Ảnh B chưa bao giờ xong; quay lại A thì A tải lại từ đầu.
    vi.mocked(getCachedImage).mockReturnValueOnce(new Promise(() => {}))
    rerender({ id: OTHER_ID })
    const again = deferred<Blob | null>()
    vi.mocked(getCachedImage).mockReturnValueOnce(again.promise)

    rerender({ id: PHOTO_ID })

    const revoked = vi.mocked(URL.revokeObjectURL).mock.calls.map(([url]) => url)
    expect(revoked).toEqual(["blob:photo-1"])
    expect(result.current).toEqual({ url: null, failed: false })
    again.resolve(photoBlob("first again"))
    await waitFor(() => expect(result.current).toEqual({ url: "blob:photo-2", failed: false }))
  })
})
