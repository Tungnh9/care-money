import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { getCachedImage } from "@/lib/life-plan/image-cache"
import type { LifePlanImage } from "@/lib/life-plan/types"
import { ImageViewer } from "../../components/image-viewer"

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

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

function cloudPhoto(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 1000, width: 1600, height: 1200 }
}

const PHOTOS = [cloudPhoto(1), cloudPhoto(2), cloudPhoto(3)]

function renderViewer(index = 0) {
  const onClose = vi.fn()
  render(<ImageViewer images={PHOTOS} title="Đà Lạt" initialIndex={index} onClose={onClose} />)
  return { onClose, viewer: screen.getByRole("dialog", { name: 'Ảnh của ghi chép "Đà Lạt"' }) }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getCachedImage).mockImplementation(async (id) => new Blob([id], { type: "image/webp" }))
  URL.createObjectURL = vi.fn((blob: Blob) => `blob:${(blob as Blob).size}-${Math.random()}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  cleanup()
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

describe("ImageViewer", () => {
  it("shows the photo it was opened on, large, with its place in the note", async () => {
    const { viewer } = renderViewer(1)

    expect(within(viewer).getByText("2 / 3")).toBeInTheDocument()
    await waitFor(() =>
      expect(within(viewer).getByRole("img", { name: 'Ảnh 2 của ghi chép "Đà Lạt"' }).tagName).toBe("IMG")
    )
    expect(getCachedImage).toHaveBeenCalledWith(PHOTOS[1].id)
  })

  it("moves between the photos with the buttons and the arrow keys, stopping at both ends", () => {
    const { viewer } = renderViewer(0)

    expect(within(viewer).getByRole("button", { name: "Ảnh trước" })).toBeDisabled()
    fireEvent.click(within(viewer).getByRole("button", { name: "Ảnh sau" }))
    expect(within(viewer).getByText("2 / 3")).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(within(viewer).getByText("3 / 3")).toBeInTheDocument()
    expect(within(viewer).getByRole("button", { name: "Ảnh sau" })).toBeDisabled()
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(within(viewer).getByText("3 / 3")).toBeInTheDocument()
    fireEvent.keyDown(window, { key: "ArrowLeft" })
    expect(within(viewer).getByText("2 / 3")).toBeInTheDocument()
  })

  it("closes on Đóng and on Escape", () => {
    const { viewer, onClose } = renderViewer(0)

    fireEvent.click(within(viewer).getByRole("button", { name: "Đóng" }))
    fireEvent.keyDown(window, { key: "Escape" })

    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it("hides the arrows when the note has a single photo", () => {
    render(<ImageViewer images={[PHOTOS[0]]} title="Đà Lạt" initialIndex={0} onClose={vi.fn()} />)

    expect(screen.queryByRole("button", { name: "Ảnh sau" })).not.toBeInTheDocument()
    expect(screen.queryByText("1 / 1")).not.toBeInTheDocument()
  })
})
