import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"

import { getCachedImage } from "@/lib/life-plan/image-cache"
import type { LifePlanImage as LifePlanImageData } from "@/lib/life-plan/types"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import { fetchLifePlanImage } from "../../image-api"
import { LifePlanImage } from "../../components/life-plan-image"

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

const PHOTO: LifePlanImageData = {
  id: "life-plan/development/abcdefghij0123456789",
  bytes: 200_000,
  width: 1600,
  height: 1200,
}

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  setSyncSecret("test-secret")
  URL.createObjectURL = vi.fn(() => "blob:photo-1")
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  cleanup()
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

// IntersectionObserver giả: giữ callback để test tự báo lúc ô ảnh tới gần màn hình.
function stubIntersectionObserver() {
  const observers: { callback: IntersectionObserverCallback; disconnected: boolean }[] = []
  class FakeIntersectionObserver {
    private readonly entry: { callback: IntersectionObserverCallback; disconnected: boolean }
    constructor(callback: IntersectionObserverCallback) {
      this.entry = { callback, disconnected: false }
      observers.push(this.entry)
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.entry.disconnected = true
    }
    takeRecords() {
      return []
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver)
  return {
    observers,
    scrollIntoView() {
      for (const observer of observers) {
        if (!observer.disconnected) {
          observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
        }
      }
    },
  }
}

describe("LifePlanImage", () => {
  it("waits until a thumbnail comes near the screen before reading or downloading the photo", async () => {
    const viewport = stubIntersectionObserver()
    vi.mocked(getCachedImage).mockResolvedValue(new Blob(["cached"], { type: "image/webp" }))

    render(<LifePlanImage image={PHOTO} alt="Ảnh 1 của ghi chép" />)

    await act(async () => {})
    expect(getCachedImage).not.toHaveBeenCalled()
    expect(screen.getByRole("img", { name: "Ảnh 1 của ghi chép (đang tải)" })).toBeInTheDocument()

    act(() => viewport.scrollIntoView())

    expect(await screen.findByRole("img", { name: "Ảnh 1 của ghi chép" })).toHaveAttribute("src", "blob:photo-1")
    expect(getCachedImage).toHaveBeenCalledWith(PHOTO.id)
    expect(viewport.observers.every((observer) => observer.disconnected)).toBe(true)
    vi.unstubAllGlobals()
  })

  it("loads the big photo of the viewer straight away, without waiting for the screen", async () => {
    stubIntersectionObserver()
    vi.mocked(getCachedImage).mockResolvedValue(new Blob(["cached"], { type: "image/webp" }))

    render(<LifePlanImage image={PHOTO} alt="Ảnh 1 của ghi chép" variant="full" />)

    expect(await screen.findByRole("img", { name: "Ảnh 1 của ghi chép" })).toHaveAttribute("src", "blob:photo-1")
    vi.unstubAllGlobals()
  })

  it("shows a waiting box named after the photo, then the photo itself", async () => {
    vi.mocked(getCachedImage).mockResolvedValue(new Blob(["cached"], { type: "image/webp" }))

    render(<LifePlanImage image={PHOTO} alt="Ảnh 1 của ghi chép" />)

    expect(screen.getByRole("img", { name: "Ảnh 1 của ghi chép (đang tải)" })).toBeInTheDocument()
    const photo = await screen.findByRole("img", { name: "Ảnh 1 của ghi chép" })
    expect(photo.tagName).toBe("IMG")
    expect(photo).toHaveAttribute("src", "blob:photo-1")
  })

  it("says the photo could not be loaded when the download fails", async () => {
    vi.mocked(getCachedImage).mockResolvedValue(null)
    vi.mocked(fetchLifePlanImage).mockRejectedValue(new Error("Không tải được ảnh về. Vui lòng thử lại."))

    render(<LifePlanImage image={PHOTO} alt="Ảnh 1 của ghi chép" />)

    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Ảnh 1 của ghi chép (không tải được)" })).toBeInTheDocument()
    )
  })
})
