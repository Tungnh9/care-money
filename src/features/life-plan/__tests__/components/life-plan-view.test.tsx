import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { toast } from "sonner"

import { deleteCachedImage, getCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import { LIFE_PLAN_STORAGE_KEY, getStoredLifePlan, setStoredLifePlan } from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"
import { SECRET_CHARSET_ERROR, setSyncSecret } from "@/lib/sync-secret-storage"
import { compressImage } from "../../compress-image"
import { deleteLifePlanImage, fetchImagesConfigured, fetchLifePlanImage, uploadLifePlanImage } from "../../image-api"
import { LifePlanView } from "../../components/life-plan-view"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
// jsdom không có IndexedDB, canvas hay server ảnh — cache, nén ảnh và API ảnh đều giả.
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
vi.mock("../../compress-image", () => ({ compressImage: vi.fn(), fitWithin: vi.fn() }))

const SECRET = "test-secret"
const NO_SECRET = "Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt."
const NOT_CONFIGURED = "Server chưa cấu hình Cloudinary — thêm ảnh tạm khoá."
const EMPTY = "Chưa có ghi chép nào — thêm ghi chép đầu tiên để bắt đầu dòng thời gian."

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

// Cache ảnh giả nhưng nhớ thật như IndexedDB: biết được ảnh vừa lưu có phải tải lại từ cloud hay không.
const cache = new Map<string, Blob>()
// Bản nén của từng file đã chọn, theo tên file.
const compressed = new Map<string, Blob>()

function cloudPhoto(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 100_000 * n, width: 1600, height: 1200 }
}

function storedNote(overrides: Partial<LifeNote> & { id: number }): LifeNote {
  return { day: "2026-10-01", title: `Ghi chép ${overrides.id}`, content: "", images: [], ...overrides }
}

function storedPlan(overrides: Partial<LifePlan> & { id: number }): LifePlan {
  return { title: `Kế hoạch ${overrides.id}`, targetYear: 2030, status: "planned", ...overrides }
}

function seed(state: { notes?: LifeNote[]; plans?: LifePlan[] }) {
  setStoredLifePlan({ notes: state.notes ?? [], plans: state.plans ?? [] })
}

async function openNoteForm(): Promise<HTMLElement> {
  fireEvent.click(await screen.findByRole("button", { name: "Thêm ghi chép" }))
  return screen.getByRole("dialog", { name: "Thêm ghi chép" })
}

async function openPhotoReadyNoteForm(): Promise<HTMLElement> {
  const dialog = await openNoteForm()
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeEnabled())
  return dialog
}

function pickPhotos(dialog: HTMLElement, ...names: string[]) {
  const files = names.map((name) => new File([name], name, { type: "image/jpeg" }))
  fireEvent.change(within(dialog).getByLabelText("Chọn ảnh"), { target: { files } })
}

async function waitForPreviews(dialog: HTMLElement, count: number) {
  await waitFor(() => expect(within(dialog).queryAllByRole("button", { name: /^Bỏ ảnh / })).toHaveLength(count))
}

function typeInto(dialog: HTMLElement, label: string, value: string) {
  fireEvent.change(within(dialog).getByLabelText(label), { target: { value } })
}

function timelineItems(): string[] {
  return within(screen.getByRole("list", { name: "Dòng thời gian" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent ?? "")
}

beforeEach(() => {
  vi.resetAllMocks()
  window.localStorage.clear()
  cache.clear()
  compressed.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 9, 29, 9, 0))
  vi.mocked(getCachedImage).mockImplementation(async (id) => cache.get(id) ?? null)
  vi.mocked(putCachedImage).mockImplementation(async (id, blob) => {
    cache.set(id, blob)
  })
  vi.mocked(deleteCachedImage).mockImplementation(async (id) => {
    cache.delete(id)
  })
  vi.mocked(fetchImagesConfigured).mockResolvedValue(true)
  vi.mocked(fetchLifePlanImage).mockImplementation(async (id) => new Blob([`cloud ${id}`], { type: "image/webp" }))
  vi.mocked(deleteLifePlanImage).mockResolvedValue(true)
  let uploads = 0
  vi.mocked(uploadLifePlanImage).mockImplementation(async () => cloudPhoto(++uploads))
  vi.mocked(compressImage).mockImplementation(async (file) => {
    const blob = new Blob([`small ${file.name}`], { type: "image/webp" })
    compressed.set(file.name, blob)
    return blob
  })
  let created = 0
  URL.createObjectURL = vi.fn(() => `blob:photo-${++created}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  // Gỡ trang trước khi trả URL của jsdom về: gỡ là các ảnh thu hồi link của chúng.
  cleanup()
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
  vi.useRealTimers()
})

describe("LifePlanView — đầu trang", () => {
  it("shows the title, the add buttons and the empty timeline sentence", async () => {
    render(<LifePlanView />)

    expect(screen.getByRole("heading", { level: 1, name: "Plan cuộc đời" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm ghi chép" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Thêm kế hoạch" })).toBeInTheDocument()
    expect(await screen.findByText(EMPTY)).toBeInTheDocument()
  })

  it("shows how much photo space the notes use, in MB with one Vietnamese decimal", async () => {
    seed({
      notes: [
        storedNote({ id: 1, images: [{ ...cloudPhoto(1), bytes: 1_048_576 }] }),
        storedNote({ id: 2, images: [{ ...cloudPhoto(2), bytes: 524_288 }] }),
      ],
    })

    render(<LifePlanView />)

    expect(await screen.findByText("Ảnh đã dùng: 1,5 MB")).toBeInTheDocument()
  })
})

describe("LifePlanView — khoá thêm ảnh", () => {
  it("adds a text-only note on a device without the sync key, with adding photos locked and the reason on screen", async () => {
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
    expect(within(dialog).getByText(NO_SECRET)).toBeVisible()
    typeInto(dialog, "Tiêu đề", "Chạy bộ buổi sáng")
    typeInto(dialog, "Nội dung", "5km quanh hồ.\nTrời mát.")
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(getStoredLifePlan().notes).toEqual([
      { id: 1, day: "2026-10-29", title: "Chạy bộ buổi sáng", content: "5km quanh hồ.\nTrời mát.", images: [] },
    ])
    expect(screen.getByText("Chạy bộ buổi sáng")).toBeInTheDocument()
    expect(uploadLifePlanImage).not.toHaveBeenCalled()
  })

  it("locks adding photos with the server's reason when Cloudinary is not set up, showing both reasons when the key is missing too", async () => {
    vi.mocked(fetchImagesConfigured).mockResolvedValue(false)
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    expect(await within(dialog).findByText(NOT_CONFIGURED)).toBeVisible()
    expect(within(dialog).getByText(NO_SECRET)).toBeVisible()
    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
  })

  it("locks adding photos with only the server's reason when the key is there", async () => {
    setSyncSecret(SECRET)
    vi.mocked(fetchImagesConfigured).mockResolvedValue(false)
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    expect(await within(dialog).findByText(NOT_CONFIGURED)).toBeVisible()
    expect(within(dialog).queryByText(NO_SECRET)).not.toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
  })

  it("shows why the image server could not be checked, locks adding photos and still saves text notes", async () => {
    setSyncSecret(SECRET)
    vi.mocked(fetchImagesConfigured).mockRejectedValue(new Error("Không kiểm tra được máy chủ ảnh. Vui lòng thử lại."))
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    expect(await within(dialog).findByText("Không kiểm tra được máy chủ ảnh. Vui lòng thử lại.")).toBeVisible()
    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
    typeInto(dialog, "Tiêu đề", "Mất mạng vẫn ghi được")
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(getStoredLifePlan().notes.map((note) => note.title)).toEqual(["Mất mạng vẫn ghi được"])
  })

  it("checks the image server again when the form is opened after a failed check", async () => {
    setSyncSecret(SECRET)
    vi.mocked(fetchImagesConfigured)
      .mockRejectedValueOnce(new Error("Không kiểm tra được máy chủ ảnh. Vui lòng thử lại."))
      .mockResolvedValueOnce(true)
    render(<LifePlanView />)
    await waitFor(() => expect(fetchImagesConfigured).toHaveBeenCalledTimes(1))
    // Chờ lần kiểm đầu báo lỗi xong rồi mới mở form.
    await new Promise((resolve) => setTimeout(resolve, 0))

    const dialog = await openNoteForm()

    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeEnabled())
    expect(fetchImagesConfigured).toHaveBeenCalledTimes(2)
    expect(within(dialog).queryByText("Không kiểm tra được máy chủ ảnh. Vui lòng thử lại.")).not.toBeInTheDocument()
  })

  it("treats a sync key with characters a header cannot carry like a missing key, saying what is wrong with it", async () => {
    setSyncSecret("khoá-đồng-bộ")
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    expect(await within(dialog).findByText(SECRET_CHARSET_ERROR)).toBeVisible()
    expect(within(dialog).queryByText(NO_SECRET)).not.toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
  })
})

describe("LifePlanView — lưu ghi chép có ảnh", () => {
  beforeEach(() => {
    setSyncSecret(SECRET)
  })

  it("uploads the 2 picked photos with the sync key on Lưu and saves the note with both, keeping them on this device", async () => {
    render(<LifePlanView />)
    const dialog = await openPhotoReadyNoteForm()

    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    const calls = vi.mocked(uploadLifePlanImage).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[0][0]).toBe(compressed.get("a.jpg"))
    expect(calls[1][0]).toBe(compressed.get("b.jpg"))
    expect(calls.map(([, secret]) => secret)).toEqual([SECRET, SECRET])
    expect(getStoredLifePlan().notes).toEqual([
      { id: 1, day: "2026-10-29", title: "Đi Đà Lạt", content: "", images: [cloudPhoto(1), cloudPhoto(2)] },
    ])
    expect(vi.mocked(putCachedImage).mock.calls).toEqual([
      [cloudPhoto(1).id, compressed.get("a.jpg")],
      [cloudPhoto(2).id, compressed.get("b.jpg")],
    ])
    expect(vi.mocked(putCachedImage).mock.calls[0][1]).toBe(compressed.get("a.jpg"))
  })

  it("shows the photos of a note it just saved without downloading them again", async () => {
    render(<LifePlanView />)
    const dialog = await openPhotoReadyNoteForm()
    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")

    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    await waitFor(() =>
      expect(
        screen.getAllByRole("img", { name: /của ghi chép "Đi Đà Lạt"/ }).filter((img) => img.tagName === "IMG")
      ).toHaveLength(2)
    )
    expect(fetchLifePlanImage).not.toHaveBeenCalled()
  })

  it("keeps the form open with everything typed when the second photo fails, saving nothing and deleting the first one again", async () => {
    vi.mocked(uploadLifePlanImage)
      .mockResolvedValueOnce(cloudPhoto(1))
      .mockRejectedValueOnce(new Error("Ảnh lớn hơn 4MB."))
    render(<LifePlanView />)
    const dialog = await openPhotoReadyNoteForm()
    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")
    typeInto(dialog, "Nội dung", "Ngày đầu tiên.")

    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Ảnh lớn hơn 4MB."))
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeEnabled())
    expect(screen.getByRole("dialog", { name: "Thêm ghi chép" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Tiêu đề")).toHaveValue("Đi Đà Lạt")
    expect(within(dialog).getByLabelText("Nội dung")).toHaveValue("Ngày đầu tiên.")
    await waitForPreviews(dialog, 2)
    expect(getStoredLifePlan().notes).toEqual([])
    expect(deleteLifePlanImage).toHaveBeenCalledWith(cloudPhoto(1).id, SECRET)
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
    expect(cache.has(cloudPhoto(1).id)).toBe(false)
  })

  it("deletes the photos it just uploaded when the note can no longer be saved, keeping the form open", async () => {
    seed({ notes: [storedNote({ id: 1, title: "Đi xem nhà" })] })
    render(<LifePlanView />)
    fireEvent.click(await screen.findByRole("button", { name: 'Sửa ghi chép "Đi xem nhà" ngày 01/10/2026' }))
    const dialog = screen.getByRole("dialog", { name: "Sửa ghi chép" })
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeEnabled())
    pickPhotos(dialog, "a.jpg")
    await waitForPreviews(dialog, 1)
    typeInto(dialog, "Tiêu đề", "Đi xem nhà lần 2")
    // Tab khác vừa xoá ghi chép này — ghi thẳng, trang chưa kịp đọc lại.
    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify({ notes: [], plans: [] }))

    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(deleteLifePlanImage).toHaveBeenCalledWith(cloudPhoto(1).id, SECRET))
    expect(uploadLifePlanImage).toHaveBeenCalledTimes(1)
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
    expect(toast.error).toHaveBeenCalledWith("Ghi chép này vừa bị xoá ở nơi khác — không còn gì để cập nhật.")
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Lưu" })).toBeEnabled())
    expect(screen.getByRole("dialog", { name: "Sửa ghi chép" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Tiêu đề")).toHaveValue("Đi xem nhà lần 2")
    await waitForPreviews(dialog, 1)
  })

  it("deletes a photo removed while editing on Cloudinary and in the cache, once the note is saved", async () => {
    seed({ notes: [storedNote({ id: 1, title: "Đi xem nhà", images: [cloudPhoto(1), cloudPhoto(2)] })] })
    render(<LifePlanView />)
    fireEvent.click(await screen.findByRole("button", { name: 'Sửa ghi chép "Đi xem nhà" ngày 01/10/2026' }))
    const dialog = screen.getByRole("dialog", { name: "Sửa ghi chép" })

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 1" }))
    expect(deleteLifePlanImage).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(deleteLifePlanImage).toHaveBeenCalledWith(cloudPhoto(1).id, SECRET))
    expect(deleteLifePlanImage).toHaveBeenCalledTimes(1)
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
    expect(getStoredLifePlan().notes[0].images).toEqual([cloudPhoto(2)])
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("keeps a photo removed in the form when the edit is cancelled", async () => {
    seed({ notes: [storedNote({ id: 1, title: "Đi xem nhà", images: [cloudPhoto(1)] })] })
    render(<LifePlanView />)
    fireEvent.click(await screen.findByRole("button", { name: 'Sửa ghi chép "Đi xem nhà" ngày 01/10/2026' }))
    const dialog = screen.getByRole("dialog", { name: "Sửa ghi chép" })

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 1" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(getStoredLifePlan().notes[0].images).toEqual([cloudPhoto(1)])
    expect(deleteLifePlanImage).not.toHaveBeenCalled()
    expect(deleteCachedImage).not.toHaveBeenCalled()
  })
})

describe("LifePlanView — xoá ghi chép", () => {
  beforeEach(() => {
    setSyncSecret(SECRET)
  })

  it("asks first, then deletes the note and its photos on Cloudinary and in the cache", async () => {
    seed({
      notes: [
        storedNote({ id: 1, title: "Đi xem nhà", images: [cloudPhoto(1), cloudPhoto(2)] }),
        storedNote({ id: 2 }),
      ],
    })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Xoá ghi chép "Đi xem nhà" ngày 01/10/2026' }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá ghi chép?" })
    expect(getStoredLifePlan().notes).toHaveLength(2)
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá" }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Đã xoá ghi chép "Đi xem nhà"'))
    expect(getStoredLifePlan().notes.map((note) => note.id)).toEqual([2])
    expect(vi.mocked(deleteLifePlanImage).mock.calls).toEqual([
      [cloudPhoto(1).id, SECRET],
      [cloudPhoto(2).id, SECRET],
    ])
    expect(vi.mocked(deleteCachedImage).mock.calls).toEqual([[cloudPhoto(1).id], [cloudPhoto(2).id]])
    expect(screen.queryByText("Đi xem nhà")).not.toBeInTheDocument()
  })

  it("still deletes the note when its photos cannot be deleted on Cloudinary, and says so", async () => {
    vi.mocked(deleteLifePlanImage)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error("Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."))
    seed({ notes: [storedNote({ id: 1, title: "Đi xem nhà", images: [cloudPhoto(1), cloudPhoto(2)] })] })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Xoá ghi chép "Đi xem nhà" ngày 01/10/2026' }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Xoá" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Đã xoá ghi chép, nhưng chưa xoá được ảnh trên Cloudinary.")
    )
    expect(getStoredLifePlan().notes).toEqual([])
    expect(vi.mocked(deleteCachedImage).mock.calls).toEqual([[cloudPhoto(1).id], [cloudPhoto(2).id]])
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("deletes a note without photos without calling Cloudinary", async () => {
    seed({ notes: [storedNote({ id: 1, title: "Chỉ có chữ" })] })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Xoá ghi chép "Chỉ có chữ" ngày 01/10/2026' }))
    fireEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Xoá" }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Đã xoá ghi chép "Chỉ có chữ"'))
    expect(getStoredLifePlan().notes).toEqual([])
    expect(deleteLifePlanImage).not.toHaveBeenCalled()
  })
})

describe("LifePlanView — dòng thời gian", () => {
  it("draws the Hôm nay line between what is ahead and what has passed, with today's note under it", async () => {
    seed({
      notes: [
        storedNote({ id: 1, day: "2025-01-01", title: "Năm mới 2025" }),
        storedNote({ id: 2, day: "2026-10-29", title: "Hôm nay chạy bộ" }),
        storedNote({ id: 3, day: "2026-11-05", title: "Đi khám răng" }),
      ],
      plans: [storedPlan({ id: 1, title: "Mua nhà", targetYear: 2030 })],
    })

    render(<LifePlanView />)

    await waitFor(() => expect(timelineItems()).toHaveLength(5))
    const items = timelineItems()
    expect(items[0]).toContain("Mua nhà")
    expect(items[1]).toContain("Đi khám răng")
    expect(items[2]).toContain("Hôm nay")
    expect(items[3]).toContain("Hôm nay chạy bộ")
    expect(items[4]).toContain("Năm mới 2025")
  })

  it("shows a note's day, text with its line breaks and the plan it belongs to", async () => {
    seed({
      notes: [storedNote({ id: 1, day: "2026-10-28", title: "Xem nhà", content: "Căn 1.\nCăn 2.", planId: 4 })],
      plans: [storedPlan({ id: 4, title: "Mua nhà" })],
    })

    render(<LifePlanView />)

    const item = (await screen.findByText("Xem nhà")).closest("li") as HTMLElement
    expect(within(item).getByText("Thứ Tư, 28/10/2026")).toBeInTheDocument()
    expect(within(item).getByText(/Căn 1\.\s*Căn 2\./)).toHaveClass("whitespace-pre-wrap")
    expect(within(item).getByText("Mua nhà")).toBeInTheDocument()
  })

  it("labels a plan not reached past its target as Quá hạn, still at its target", async () => {
    seed({
      notes: [storedNote({ id: 1, day: "2026-10-01", title: "Đầu tháng" })],
      plans: [
        storedPlan({ id: 1, title: "Học bơi", targetYear: 2026, targetMonth: 9, status: "doing" }),
        storedPlan({ id: 2, title: "Mua nhà", targetYear: 2030 }),
      ],
    })

    render(<LifePlanView />)

    await waitFor(() => expect(timelineItems()).toHaveLength(4))
    const timeline = screen.getByRole("list", { name: "Dòng thời gian" })
    const swim = within(timeline).getByText("Học bơi").closest("li") as HTMLElement
    expect(within(swim).getByText("Quá hạn")).toBeInTheDocument()
    expect(within(swim).getByText("Đang làm")).toBeInTheDocument()
    expect(within(swim).getByText(/tháng 09\/2026/)).toBeInTheDocument()
    const house = within(timeline).getByText("Mua nhà").closest("li") as HTMLElement
    expect(within(house).queryByText("Quá hạn")).not.toBeInTheDocument()
    expect(within(house).getByText("Dự định")).toBeInTheDocument()
    expect(within(house).getByText(/năm 2030/)).toBeInTheDocument()
    // Hạn 30/09/2026 đã qua: vẫn ở đúng hạn của nó, dưới vạch và dưới ghi chép 01/10.
    const items = timelineItems()
    expect(items[0]).toContain("Mua nhà")
    expect(items[1]).toContain("Hôm nay")
    expect(items[2]).toContain("Đầu tháng")
    expect(items[3]).toContain("Học bơi")
  })

  it("filters the timeline to a plan's milestone and its notes, then shows everything again on a second click", async () => {
    seed({
      notes: [
        storedNote({ id: 1, day: "2026-10-01", title: "Xem nhà lần 1", planId: 1 }),
        storedNote({ id: 2, day: "2026-10-02", title: "Chạy bộ" }),
        storedNote({ id: 3, day: "2026-10-03", title: "Học bơi buổi 1", planId: 2 }),
      ],
      plans: [storedPlan({ id: 1, title: "Mua nhà" }), storedPlan({ id: 2, title: "Học bơi", targetYear: 2027 })],
    })
    render(<LifePlanView />)
    const bar = await screen.findByRole("group", { name: "Lọc theo kế hoạch" })

    fireEvent.click(within(bar).getByRole("button", { name: "Mua nhà" }))

    expect(within(bar).getByRole("button", { name: "Mua nhà" })).toHaveAttribute("aria-pressed", "true")
    expect(timelineItems()).toHaveLength(3)
    expect(screen.getByText("Xem nhà lần 1")).toBeInTheDocument()
    expect(screen.queryByText("Chạy bộ")).not.toBeInTheDocument()
    expect(screen.queryByText("Học bơi buổi 1")).not.toBeInTheDocument()

    fireEvent.click(within(bar).getByRole("button", { name: "Mua nhà" }))

    expect(within(bar).getByRole("button", { name: "Mua nhà" })).toHaveAttribute("aria-pressed", "false")
    expect(timelineItems()).toHaveLength(6)
  })

  it("shows 20 entries at a time, with Xem thêm for the next ones", async () => {
    seed({
      notes: Array.from({ length: 25 }, (_, i) =>
        storedNote({ id: i + 1, day: `2026-09-${String(i + 1).padStart(2, "0")}` })
      ),
    })
    render(<LifePlanView />)

    await waitFor(() => expect(timelineItems().filter((text) => text.includes("Ghi chép"))).toHaveLength(20))
    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))

    expect(timelineItems().filter((text) => text.includes("Ghi chép"))).toHaveLength(25)
    expect(screen.getByRole("button", { name: "Thu gọn" })).toBeInTheDocument()
  })

  it("opens a note's photo large from its grid and moves to the next one", async () => {
    setSyncSecret(SECRET)
    seed({ notes: [storedNote({ id: 1, title: "Đà Lạt", images: [cloudPhoto(1), cloudPhoto(2)] })] })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Xem ảnh 1 của ghi chép "Đà Lạt"' }))

    const viewer = screen.getByRole("dialog", { name: 'Ảnh của ghi chép "Đà Lạt"' })
    expect(within(viewer).getByText("1 / 2")).toBeInTheDocument()
    fireEvent.click(within(viewer).getByRole("button", { name: "Ảnh sau" }))
    expect(within(viewer).getByText("2 / 2")).toBeInTheDocument()
    await waitFor(() =>
      expect(within(viewer).getByRole("img", { name: 'Ảnh 2 của ghi chép "Đà Lạt"' }).tagName).toBe("IMG")
    )
  })
})

describe("LifePlanView — kế hoạch", () => {
  it("adds a plan with a year only, which then shows on the timeline and in the filter bar", async () => {
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: "Thêm kế hoạch" }))
    const dialog = screen.getByRole("dialog", { name: "Thêm kế hoạch" })
    typeInto(dialog, "Tên kế hoạch", "Mua nhà")
    typeInto(dialog, "Năm muốn đạt", "2030")
    fireEvent.click(within(dialog).getByRole("button", { name: "Đang làm" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(getStoredLifePlan().plans).toEqual([{ id: 1, title: "Mua nhà", targetYear: 2030, status: "doing" }])
    expect(
      within(screen.getByRole("group", { name: "Lọc theo kế hoạch" })).getByRole("button", { name: "Mua nhà" })
    ).toBeInTheDocument()
    expect(timelineItems()[0]).toContain("Mua nhà")
  })

  it("links a new note to a plan picked in the form", async () => {
    seed({ plans: [storedPlan({ id: 3, title: "Mua nhà" })] })
    render(<LifePlanView />)
    const dialog = await openNoteForm()

    typeInto(dialog, "Tiêu đề", "Xem nhà")
    fireEvent.click(
      within(within(dialog).getByRole("group", { name: "Gắn với kế hoạch" })).getByRole("button", { name: "Mua nhà" })
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(getStoredLifePlan().notes[0]).toMatchObject({ title: "Xem nhà", planId: 3 })
  })

  it("asks before deleting a plan, saying its notes stay, then keeps those notes unlinked", async () => {
    seed({
      notes: [storedNote({ id: 1, title: "Xem nhà", planId: 1 })],
      plans: [storedPlan({ id: 1, title: "Mua nhà" })],
    })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Xoá kế hoạch "Mua nhà"' }))
    const confirm = screen.getByRole("alertdialog", { name: "Xoá kế hoạch?" })
    expect(within(confirm).getByText(/Các ghi chép đã gắn vẫn giữ, chỉ bỏ gắn\./)).toBeInTheDocument()
    fireEvent.click(within(confirm).getByRole("button", { name: "Xoá" }))

    expect(getStoredLifePlan()).toEqual({ notes: [storedNote({ id: 1, title: "Xem nhà" })], plans: [] })
    expect(screen.getByText("Xem nhà")).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Lọc theo kế hoạch" })).not.toBeInTheDocument()
  })

  it("edits a plan to reached, which moves it to today", async () => {
    seed({ plans: [storedPlan({ id: 1, title: "Học bơi", targetYear: 2027, status: "doing" })] })
    render(<LifePlanView />)

    fireEvent.click(await screen.findByRole("button", { name: 'Sửa kế hoạch "Học bơi"' }))
    const dialog = screen.getByRole("dialog", { name: "Sửa kế hoạch" })
    expect(within(dialog).getByLabelText("Tên kế hoạch")).toHaveValue("Học bơi")
    expect(within(dialog).getByLabelText("Năm muốn đạt")).toHaveValue("2027")
    fireEvent.click(within(dialog).getByRole("button", { name: "Đã đạt" }))
    fireEvent.click(within(dialog).getByRole("button", { name: "Lưu" }))

    expect(getStoredLifePlan().plans).toEqual([
      { id: 1, title: "Học bơi", targetYear: 2027, status: "done", doneDay: "2026-10-29" },
    ])
    // Đã đạt hôm nay: nằm dưới vạch "Hôm nay".
    expect(timelineItems()[0]).toContain("Hôm nay")
    expect(timelineItems()[1]).toContain("Học bơi")
  })
})
