import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import type { ComponentProps } from "react"
import { toast } from "sonner"

import { deleteCachedImage, getCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import { compressImage } from "../../compress-image"
import { deleteLifePlanImage, fetchLifePlanImage, uploadLifePlanImage } from "../../image-api"
import { NoteFormModal } from "../../components/note-form-modal"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
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

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

function cloudPhoto(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 100_000 * n, width: 1600, height: 1200 }
}

function photos(count: number, from = 1): LifePlanImage[] {
  return Array.from({ length: count }, (_, i) => cloudPhoto(from + i))
}

const NOTE: LifeNote = {
  id: 7,
  day: "2026-10-20",
  title: "Đi xem nhà",
  content: "Căn 1 sáng.\nCăn 2 rộng.",
  images: [cloudPhoto(1)],
  planId: 3,
}

const PLANS: LifePlan[] = [
  { id: 3, title: "Mua nhà", targetYear: 2030, status: "planned" },
  { id: 4, title: "Học bơi", targetYear: 2027, status: "doing" },
]

function renderForm(props: Partial<ComponentProps<typeof NoteFormModal>> = {}) {
  const onSubmit = vi.fn<(input: unknown) => boolean>(() => true)
  const onClose = vi.fn()
  const view = render(
    <NoteFormModal
      note={null}
      plans={PLANS}
      today="2026-10-29"
      photoLockReasons={[]}
      onSubmit={onSubmit}
      onClose={onClose}
      {...props}
    />
  )
  return { ...view, onSubmit, onClose, dialog: screen.getByRole("dialog") }
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

function saveButton(dialog: HTMLElement): HTMLElement {
  return within(dialog).getByRole("button", { name: /^(Lưu|Đang lưu…)$/ })
}

// Promise tự quyết định lúc trả — để giữ 1 lần tải lên ở trạng thái đang chạy.
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
  vi.mocked(getCachedImage).mockResolvedValue(null)
  vi.mocked(putCachedImage).mockResolvedValue(undefined)
  vi.mocked(deleteCachedImage).mockResolvedValue(undefined)
  vi.mocked(deleteLifePlanImage).mockResolvedValue(true)
  // Ảnh cũ của ghi chép đang sửa không có trên máy này: không tải được (như máy đang mất mạng).
  vi.mocked(fetchLifePlanImage).mockRejectedValue(new Error("Không tải được ảnh về. Vui lòng thử lại."))
  let uploads = 100
  vi.mocked(uploadLifePlanImage).mockImplementation(async () => cloudPhoto(++uploads))
  vi.mocked(compressImage).mockImplementation(async (file) => new Blob([`small ${file.name}`], { type: "image/webp" }))
  let created = 0
  URL.createObjectURL = vi.fn(() => `blob:preview-${++created}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  cleanup()
  URL.createObjectURL = originalCreateObjectURL
  URL.revokeObjectURL = originalRevokeObjectURL
})

describe("NoteFormModal — điền sẵn", () => {
  it("starts a new note on today's date with no plan", () => {
    const { dialog } = renderForm()

    expect(screen.getByRole("dialog", { name: "Thêm ghi chép" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Ngày")).toHaveValue("29/10/2026")
    expect(within(dialog).getByLabelText("Tiêu đề")).toHaveValue("")
    const planGroup = within(dialog).getByRole("group", { name: "Gắn với kế hoạch" })
    expect(within(planGroup).getByRole("button", { name: "Không gắn" })).toHaveAttribute("aria-pressed", "true")
    expect(saveButton(dialog)).toBeDisabled()
  })

  it("fills every field from the note being edited", () => {
    const { dialog } = renderForm({ note: NOTE })

    expect(screen.getByRole("dialog", { name: "Sửa ghi chép" })).toBe(dialog)
    expect(within(dialog).getByLabelText("Ngày")).toHaveValue("20/10/2026")
    expect(within(dialog).getByLabelText("Tiêu đề")).toHaveValue("Đi xem nhà")
    expect(within(dialog).getByLabelText("Nội dung")).toHaveValue("Căn 1 sáng.\nCăn 2 rộng.")
    const planGroup = within(dialog).getByRole("group", { name: "Gắn với kế hoạch" })
    expect(within(planGroup).getByRole("button", { name: "Mua nhà" })).toHaveAttribute("aria-pressed", "true")
    expect(within(dialog).getAllByRole("button", { name: /^Bỏ ảnh / })).toHaveLength(1)
    expect(within(dialog).getByText("Ảnh · 1/10")).toBeInTheDocument()
  })
})

describe("NoteFormModal — chọn ảnh", () => {
  it("shrinks the picked photos one at a time and shows them in the order they were picked", async () => {
    let running = 0
    let mostAtOnce = 0
    const shrunk: Blob[] = []
    vi.mocked(compressImage).mockImplementation(async (file) => {
      running++
      mostAtOnce = Math.max(mostAtOnce, running)
      // Ảnh đầu chậm nhất: nén song song thì ảnh 2, 3 đã chạy trong lúc ảnh 1 chưa xong.
      await new Promise((resolve) => setTimeout(resolve, file.name === "a.jpg" ? 20 : 5))
      running--
      const blob = new Blob([`small ${file.name}`], { type: "image/webp" })
      shrunk.push(blob)
      return blob
    })
    const { dialog } = renderForm()

    pickPhotos(dialog, "a.jpg", "b.jpg", "c.jpg")

    await waitForPreviews(dialog, 3)
    expect(mostAtOnce).toBe(1)
    expect(vi.mocked(compressImage).mock.calls.map(([file]) => file.name)).toEqual(["a.jpg", "b.jpg", "c.jpg"])
    expect(vi.mocked(URL.createObjectURL).mock.calls.map(([blob]) => blob)).toEqual(shrunk)
    expect(within(dialog).getByText("Ảnh · 3/10")).toBeInTheDocument()
  })

  it("skips a picked file that cannot be read as a photo, saying which one, and keeps the others", async () => {
    vi.mocked(compressImage).mockImplementation(async (file) => {
      if (file.name === "b.txt") throw new Error('Không đọc được ảnh "b.txt" — file hỏng hoặc không phải ảnh.')
      return new Blob([file.name], { type: "image/webp" })
    })
    const { dialog } = renderForm()

    pickPhotos(dialog, "a.jpg", "b.txt", "c.jpg")

    await waitForPreviews(dialog, 2)
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Không đọc được ảnh "b.txt" — file hỏng hoặc không phải ảnh.')
    )
    expect(compressImage).toHaveBeenCalledTimes(3)
  })

  it("takes only as many photos as fit in 10, counting the ones the note already has", async () => {
    const { dialog } = renderForm({ note: { ...NOTE, images: photos(9) } })

    pickPhotos(dialog, "a.jpg", "b.jpg", "c.jpg")

    await waitForPreviews(dialog, 10)
    expect(vi.mocked(compressImage).mock.calls.map(([file]) => file.name)).toEqual(["a.jpg"])
    expect(toast.error).toHaveBeenCalledWith("Mỗi ghi chép chỉ có tối đa 10 ảnh — đã bỏ qua 2 ảnh chọn thêm.")
    expect(within(dialog).getByRole("button", { name: "Thêm ảnh" })).toBeDisabled()
    expect(within(dialog).getByText("Đã đủ 10 ảnh cho ghi chép này.")).toBeVisible()
  })

  it("drops a picked photo from the form and frees its preview", async () => {
    const { dialog } = renderForm()
    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 1" }))

    await waitForPreviews(dialog, 1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1")
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:preview-2")
  })

  it("frees every preview when the form goes away", async () => {
    const { dialog, unmount } = renderForm()
    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)

    unmount()

    expect(
      vi
        .mocked(URL.revokeObjectURL)
        .mock.calls.map(([url]) => url)
        .sort()
    ).toEqual(["blob:preview-1", "blob:preview-2"])
  })

  it("locks adding photos with every reason written on screen", () => {
    const { dialog } = renderForm({
      photoLockReasons: [
        "Server chưa cấu hình Cloudinary — thêm ảnh tạm khoá.",
        "Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt.",
      ],
    })

    const add = within(dialog).getByRole("button", { name: "Thêm ảnh" })
    expect(add).toBeDisabled()
    expect(within(dialog).getByLabelText("Chọn ảnh")).toBeDisabled()
    expect(within(dialog).getByText("Server chưa cấu hình Cloudinary — thêm ảnh tạm khoá.")).toBeVisible()
    expect(within(dialog).getByText("Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt.")).toBeVisible()
    expect(add).toHaveAccessibleDescription(
      "Server chưa cấu hình Cloudinary — thêm ảnh tạm khoá. Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt."
    )
  })
})

describe("NoteFormModal — lưu", () => {
  it("starts no upload while the title is blank or the day does not exist, even when the form is submitted", async () => {
    const { dialog, onSubmit } = renderForm()
    pickPhotos(dialog, "a.jpg")
    await waitForPreviews(dialog, 1)
    const form = dialog.querySelector("form") as HTMLFormElement

    typeInto(dialog, "Tiêu đề", "   ")
    expect(saveButton(dialog)).toBeDisabled()
    fireEvent.submit(form)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")
    typeInto(dialog, "Ngày", "31/02/2026")
    expect(within(dialog).getByText("Nhập ngày dạng dd/mm/yyyy, vd: 29/10/2026")).toBeInTheDocument()
    expect(saveButton(dialog)).toBeDisabled()
    fireEvent.submit(form)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(uploadLifePlanImage).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("starts no upload for a note already carrying more than 10 photos, until enough are dropped", async () => {
    const { dialog, onSubmit } = renderForm({ note: { ...NOTE, images: photos(11) } })

    expect(within(dialog).getByText("Mỗi ghi chép chỉ có tối đa 10 ảnh — bỏ bớt 1 ảnh để lưu.")).toBeVisible()
    expect(saveButton(dialog)).toBeDisabled()
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 11" }))
    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ images: photos(10) })
    await waitFor(() => expect(deleteLifePlanImage).toHaveBeenCalledWith(cloudPhoto(11).id, SECRET))
  })

  it("keeps Lưu locked while new photos wait and adding photos has been locked meanwhile, until they are dropped", async () => {
    const { dialog, onSubmit, rerender } = renderForm({ note: NOTE })
    pickPhotos(dialog, "a.jpg")
    await waitForPreviews(dialog, 2)
    // Đăng xuất ở tab khác vừa gỡ khoá đồng bộ — trang khoá thêm ảnh, form nhận câu giải thích.
    const reason = "Thêm ảnh cần khoá đồng bộ — nhập ở Cài đặt."
    const props = { note: NOTE, plans: PLANS, today: "2026-10-29", onSubmit, onClose: vi.fn() }
    rerender(<NoteFormModal {...props} photoLockReasons={[reason]} />)

    expect(within(dialog).getByText(reason)).toBeVisible()
    expect(saveButton(dialog)).toBeDisabled()
    fireEvent.submit(dialog.querySelector("form") as HTMLFormElement)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(uploadLifePlanImage).not.toHaveBeenCalled()

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 2" }))
    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ images: [cloudPhoto(1)] })
    expect(uploadLifePlanImage).not.toHaveBeenCalled()
  })

  it("saves trimmed text, the typed day, the kept photos then the new ones, and the picked plan", async () => {
    const { dialog, onSubmit, onClose } = renderForm({ note: NOTE })
    pickPhotos(dialog, "a.jpg")
    await waitForPreviews(dialog, 2)
    typeInto(dialog, "Ngày", "21/10/2026")
    fireEvent.click(
      within(within(dialog).getByRole("group", { name: "Gắn với kế hoạch" })).getByRole("button", { name: "Học bơi" })
    )

    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith({
      day: "2026-10-21",
      title: "Đi xem nhà",
      content: "Căn 1 sáng.\nCăn 2 rộng.",
      images: [cloudPhoto(1), cloudPhoto(101)],
      planId: 4,
    })
    expect(putCachedImage).toHaveBeenCalledWith(cloudPhoto(101).id, expect.any(Blob))
  })

  it("saves a note whose plan was deleted meanwhile as linked to no plan", async () => {
    const { dialog, onSubmit, rerender } = renderForm({ note: NOTE })
    // Kế hoạch 3 vừa bị xoá ở tab khác — trang đọc lại, form nhận danh sách mới.
    rerender(
      <NoteFormModal
        note={NOTE}
        plans={[PLANS[1]]}
        today="2026-10-29"
        photoLockReasons={[]}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    )
    const planGroup = within(dialog).getByRole("group", { name: "Gắn với kế hoạch" })
    expect(within(planGroup).getByRole("button", { name: "Không gắn" })).toHaveAttribute("aria-pressed", "true")

    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("planId")
  })

  it("deletes the photos it just uploaded, on Cloudinary and in the cache, when the note is refused, keeping the form open", async () => {
    const { dialog, onSubmit, onClose } = renderForm()
    onSubmit.mockReturnValue(false)
    pickPhotos(dialog, "a.jpg", "b.jpg")
    await waitForPreviews(dialog, 2)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")

    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(deleteLifePlanImage).toHaveBeenCalledTimes(2))
    expect(vi.mocked(deleteLifePlanImage).mock.calls).toEqual([
      [cloudPhoto(101).id, SECRET],
      [cloudPhoto(102).id, SECRET],
    ])
    expect(vi.mocked(deleteCachedImage).mock.calls).toEqual([[cloudPhoto(101).id], [cloudPhoto(102).id]])
    await waitFor(() => expect(saveButton(dialog)).toBeEnabled())
    expect(onClose).not.toHaveBeenCalled()
    expect(within(dialog).getByLabelText("Tiêu đề")).toHaveValue("Đi Đà Lạt")
    await waitForPreviews(dialog, 2)
  })

  it("stays open while the photos upload, ignoring Escape, then closes once the note is saved", async () => {
    const upload = deferred<LifePlanImage>()
    vi.mocked(uploadLifePlanImage).mockReturnValueOnce(upload.promise)
    const { dialog, onClose, onSubmit } = renderForm()
    pickPhotos(dialog, "a.jpg")
    await waitForPreviews(dialog, 1)
    typeInto(dialog, "Tiêu đề", "Đi Đà Lạt")

    fireEvent.click(saveButton(dialog))

    await waitFor(() => expect(saveButton(dialog)).toHaveTextContent("Đang lưu…"))
    expect(saveButton(dialog)).toBeDisabled()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(onClose).not.toHaveBeenCalled()
    upload.resolve(cloudPhoto(1))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it("says so when a photo dropped from the note cannot be deleted on Cloudinary, after saving the note", async () => {
    vi.mocked(deleteLifePlanImage).mockRejectedValue(new Error("Sai secret đồng bộ."))
    const { dialog, onSubmit, onClose } = renderForm({ note: NOTE })

    fireEvent.click(within(dialog).getByRole("button", { name: "Bỏ ảnh 1" }))
    fireEvent.click(saveButton(dialog))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Đã cập nhật ghi chép, nhưng chưa xoá được ảnh đã bỏ trên Cloudinary.")
    )
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ images: [] })
    expect(onClose).toHaveBeenCalled()
    expect(deleteCachedImage).toHaveBeenCalledWith(cloudPhoto(1).id)
  })
})
