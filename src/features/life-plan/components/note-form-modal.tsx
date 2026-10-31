"use client"

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import Image from "next/image"
import { ImagePlus, X } from "lucide-react"
import { toast } from "sonner"

import { ActionTooltip } from "@/components/ob/action-tooltip"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Modal } from "@/components/ui/modal"
import { Textarea } from "@/components/ui/textarea"
import { formatDayInput, parseDayInput } from "@/lib/date"
import { MAX_NOTE_IMAGES } from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifeNoteInput, LifePlan, LifePlanImage as LifePlanImageData } from "@/lib/life-plan/types"
import { getSyncSecret } from "@/lib/sync-secret-storage"
import { cn } from "@/lib/utils"
import { compressImage } from "../compress-image"
import { removePhoto, removePhotos, uploadPhoto } from "../note-photos"
import { uploadNoteImages } from "../save-note-images"
import { LifePlanImage } from "./life-plan-image"

interface NoteFormModalProps {
  // null = ghi chép mới.
  note: LifeNote | null
  plans: LifePlan[]
  today: string
  // Câu giải thích vì sao chưa thêm được ảnh (server chưa có Cloudinary, máy chưa có khoá đồng bộ…); rỗng = thêm được.
  photoLockReasons: string[]
  // addNote / updateNote của trang. Trả true khi đã ghi — mọi nhánh lỗi đã tự báo toast.
  onSubmit: (input: LifeNoteInput) => boolean
  onClose: () => void
}

// Ảnh vừa chọn, đã thu nhỏ, chưa tải lên: tải lên lúc bấm Lưu. `url` là object URL để xem trước.
interface PickedPhoto {
  key: number
  blob: Blob
  url: string
}

const FULL = `Đã đủ ${MAX_NOTE_IMAGES} ảnh cho ghi chép này.`
const DROPPED_NOT_DELETED = "Đã cập nhật ghi chép, nhưng chưa xoá được ảnh đã bỏ trên Cloudinary."

const PILL =
  "max-w-full truncate rounded-[var(--ob-radius-pill)] border-[1.5px] px-[13px] py-[7px] text-[12.5px] font-semibold transition-colors duration-[var(--ob-dur-fast)] ease-[var(--ob-ease-out)]"
const PILL_ON = "border-[var(--ob-color-action)] bg-[var(--ob-color-action-soft)] text-[var(--ob-color-action-strong)]"
const PILL_OFF = "border-[var(--ob-color-border)] bg-transparent text-[var(--ob-color-text-muted)]"

const MICRO_LABEL =
  "mb-[var(--ob-space-2)] block [font:var(--ob-text-micro)] tracking-[var(--ob-track-micro)] text-[var(--ob-color-text-subtle)] uppercase"

// Nút tròn 28px cho vừa ô ảnh nhỏ trên điện thoại; lớp after: nới vùng bấm ra đủ 44px (--ob-hit-min).
const REMOVE_BUTTON =
  "absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-[var(--ob-vo-900)]/70 text-white transition-colors duration-[var(--ob-dur-fast)] after:absolute after:-inset-2 after:content-[''] hover:bg-[var(--ob-color-expense)] disabled:cursor-not-allowed disabled:opacity-45"

// Thêm/sửa 1 ghi chép. Nơi gọi chỉ dựng form lúc mở (và đổi `key` theo ghi chép), nên state khởi tạo từ `note` là đủ;
// form đóng là gỡ hẳn, mọi link xem trước được thu hồi.
function NoteFormModal({ note, plans, today, photoLockReasons, onSubmit, onClose }: NoteFormModalProps) {
  const titleId = useId()
  const notesId = useId()
  const [dayText, setDayText] = useState(formatDayInput(note?.day ?? today))
  const [title, setTitle] = useState(note?.title ?? "")
  const [content, setContent] = useState(note?.content ?? "")
  const [planId, setPlanId] = useState<number | undefined>(note?.planId)
  // Ảnh cũ còn giữ (ảnh đã nằm trên Cloudinary) và ảnh mới chọn — tối đa 10 ảnh tính cả 2.
  const [kept, setKept] = useState<LifePlanImageData[]>(note?.images ?? [])
  const [picked, setPicked] = useState<PickedPhoto[]>([])
  const [compressing, setCompressing] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nextKeyRef = useRef(0)
  const aliveRef = useRef(true)
  // Mọi link xem trước đang sống, để thu hồi hết khi form gỡ khỏi trang.
  const previewUrlsRef = useRef(new Set<string>())

  useEffect(() => {
    aliveRef.current = true
    const previewUrls = previewUrlsRef.current
    return () => {
      aliveRef.current = false
      // Form gỡ khỏi trang (Huỷ, Lưu xong, rời trang): thu hồi mọi link xem trước còn lại.
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      previewUrls.clear()
    }
  }, [])

  const day = parseDayInput(dayText)
  const photoCount = kept.length + picked.length
  const overLimit = photoCount - MAX_NOTE_IMAGES
  // Kế hoạch đã bị xoá (ở tab khác) trong lúc form mở thì coi như không gắn: chọn hiện ra đúng là cái sẽ được lưu.
  const linkedPlanId = planId !== undefined && plans.some((plan) => plan.id === planId) ? planId : undefined
  const busy = compressing || saving
  const locked = photoLockReasons.length > 0
  // Mọi điều kiện hook sẽ kiểm (tiêu đề, ngày, tối đa 10 ảnh) được kiểm ở đây, TRƯỚC khi tải ảnh: form không lưu
  // được thì không tải gì lên Cloudinary. Ảnh mới đang chờ mà thêm ảnh vừa bị khoá (đăng xuất ở tab khác gỡ khoá đồng
  // bộ…) thì cũng chưa lưu được — câu giải thích đã hiện ngay dưới nút Thêm ảnh; bỏ các ảnh mới là lưu được chữ.
  const invalid = !title.trim() || day === null || overLimit > 0 || (locked && picked.length > 0)
  const addDisabled = locked || photoCount >= MAX_NOTE_IMAGES || busy
  const photoNotes = [
    ...photoLockReasons,
    ...(overLimit > 0
      ? [`Mỗi ghi chép chỉ có tối đa ${MAX_NOTE_IMAGES} ảnh — bỏ bớt ${overLimit} ảnh để lưu.`]
      : photoCount === MAX_NOTE_IMAGES
        ? [FULL]
        : []),
  ]

  function close() {
    // Đang tải ảnh lên thì không đóng: đóng giữa chừng vẫn lưu khi tải xong, trái ý người vừa bấm Huỷ.
    if (!saving) onClose()
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    // Chọn lại đúng file vừa bỏ vẫn phải kích hoạt onChange lần nữa.
    event.target.value = ""
    if (!files.length || addDisabled) return
    const room = MAX_NOTE_IMAGES - photoCount
    const accepted = files.slice(0, room)
    if (files.length > accepted.length) {
      toast.error(
        `Mỗi ghi chép chỉ có tối đa ${MAX_NOTE_IMAGES} ảnh — đã bỏ qua ${files.length - accepted.length} ảnh chọn thêm.`
      )
    }
    if (!accepted.length) return
    setCompressing(true)
    // Thu nhỏ LẦN LƯỢT từng ảnh, không song song: 10 ảnh gốc cỡ 12MP giải nén cùng lúc làm điện thoại hết bộ nhớ.
    // Ảnh nào xong thì hiện ngay; ảnh hỏng hay không phải ảnh thì báo và bỏ riêng ảnh đó.
    for (const file of accepted) {
      try {
        const blob = await compressImage(file)
        if (!aliveRef.current) return
        const url = URL.createObjectURL(blob)
        previewUrlsRef.current.add(url)
        const key = nextKeyRef.current++
        setPicked((current) => [...current, { key, blob, url }])
      } catch (error) {
        if (!aliveRef.current) return
        toast.error(error instanceof Error && error.message ? error.message : `Không đọc được ảnh "${file.name}".`)
      }
    }
    setCompressing(false)
  }

  function dropPicked(photo: PickedPhoto) {
    URL.revokeObjectURL(photo.url)
    previewUrlsRef.current.delete(photo.url)
    setPicked((current) => current.filter((item) => item.key !== photo.key))
  }

  function dropKept(image: LifePlanImageData) {
    setKept((current) => current.filter((item) => item.id !== image.id))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (invalid || busy || day === null) return
    setSaving(true)
    const secret = getSyncSecret()
    // Tải lên lần lượt; 1 ảnh lỗi thì các ảnh đã lên trong lần này bị xoá lại (cả trong cache) và không ghi gì.
    const uploaded = await uploadNoteImages(
      picked.map((photo) => photo.blob),
      (blob) => uploadPhoto(blob, secret),
      (id) => removePhoto(id, secret)
    )
    if (!uploaded.ok) {
      toast.error(uploaded.error)
      setSaving(false)
      return
    }
    const input: LifeNoteInput = {
      day,
      title: title.trim(),
      content: content.trim(),
      images: [...kept, ...uploaded.images],
      ...(linkedPlanId !== undefined ? { planId: linkedPlanId } : {}),
    }
    if (!onSubmit(input)) {
      // Ghi chép không ghi được dù ảnh đã lên (vừa bị xoá ở tab khác, bộ nhớ đầy…): xoá lại ảnh vừa tải lên cho lần
      // lưu này, giữ form với mọi thứ đã nhập — bấm Lưu lần nữa là tải lại từ đầu.
      const uploadedIds = uploaded.images.map((image) => image.id)
      await removePhotos(uploadedIds, secret)
      setSaving(false)
      return
    }
    onClose()
    // Ảnh cũ đã bỏ khỏi ghi chép: xoá trên Cloudinary và trong cache sau khi ghi chép đã lưu. Xoá trên cloud lỗi thì
    // vẫn giữ ghi chép như đã lưu và báo — chấp nhận còn ảnh mồ côi.
    const droppedIds = (note?.images ?? [])
      .filter((image) => !kept.some((item) => item.id === image.id))
      .map((image) => image.id)
    if (droppedIds.length && !(await removePhotos(droppedIds, secret))) toast.error(DROPPED_NOT_DELETED)
  }

  return (
    <Modal open onOpenChange={(open) => !open && close()} ariaLabelledBy={titleId} panelClassName="max-w-[520px]">
      <div id={titleId} className="mb-4 text-[17px] font-bold">
        {note ? "Sửa ghi chép" : "Thêm ghi chép"}
      </div>
      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
          <div className="flex flex-wrap gap-3">
            <Field
              className="min-w-0 flex-[1_1_140px]"
              label="Ngày"
              placeholder="dd/mm/yyyy"
              value={dayText}
              onChange={(e) => setDayText(e.target.value)}
              invalid={day === null}
              hint={day === null ? `Nhập ngày dạng dd/mm/yyyy, vd: ${formatDayInput(today)}` : undefined}
            />
            <Field
              className="min-w-0 flex-[3_1_220px]"
              label="Tiêu đề"
              placeholder="vd: Đi xem nhà lần đầu"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <Textarea
            label="Nội dung"
            placeholder="Không bắt buộc"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {plans.length ? (
            <div>
              <span className={MICRO_LABEL}>Gắn với kế hoạch</span>
              <div role="group" aria-label="Gắn với kế hoạch" className="flex flex-wrap gap-[6px]">
                <button
                  type="button"
                  aria-pressed={linkedPlanId === undefined}
                  onClick={() => setPlanId(undefined)}
                  className={cn(PILL, linkedPlanId === undefined ? PILL_ON : PILL_OFF)}
                >
                  Không gắn
                </button>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    aria-pressed={linkedPlanId === plan.id}
                    onClick={() => setPlanId(plan.id)}
                    className={cn(PILL, linkedPlanId === plan.id ? PILL_ON : PILL_OFF)}
                  >
                    {plan.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <span className={MICRO_LABEL}>{`Ảnh · ${photoCount}/${MAX_NOTE_IMAGES}`}</span>
            {photoCount ? (
              <div className="mb-3 grid grid-cols-4 gap-2">
                {kept.map((image, index) => (
                  <div key={image.id} className="relative">
                    <LifePlanImage image={image} alt={`Ảnh ${index + 1}`} />
                    <ActionTooltip label="Bỏ ảnh">
                      <button
                        type="button"
                        aria-label={`Bỏ ảnh ${index + 1}`}
                        onClick={() => dropKept(image)}
                        className={REMOVE_BUTTON}
                      >
                        <X size={14} />
                      </button>
                    </ActionTooltip>
                  </div>
                ))}
                {picked.map((photo, index) => (
                  <div
                    key={photo.key}
                    className="relative aspect-square overflow-hidden rounded-[var(--ob-radius-sm)] bg-[var(--ob-color-surface-sunken)]"
                  >
                    <Image
                      src={photo.url}
                      alt={`Ảnh ${kept.length + index + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    <ActionTooltip label="Bỏ ảnh">
                      <button
                        type="button"
                        aria-label={`Bỏ ảnh ${kept.length + index + 1}`}
                        onClick={() => dropPicked(photo)}
                        className={REMOVE_BUTTON}
                      >
                        <X size={14} />
                      </button>
                    </ActionTooltip>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={addDisabled}
                aria-describedby={photoNotes.length ? photoNotes.map((_, i) => `${notesId}-${i}`).join(" ") : undefined}
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus size={16} />
                Thêm ảnh
              </Button>
              {compressing ? (
                <span className="text-[12.5px] text-[var(--ob-color-text-subtle)]">Đang thu nhỏ ảnh…</span>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label="Chọn ảnh"
              disabled={addDisabled}
              onChange={handleFiles}
            />
            {/* Câu giải thích hiện thẳng trên màn hình — màn cảm ứng không có tooltip. */}
            {photoNotes.map((text, i) => (
              <p
                key={text}
                id={`${notesId}-${i}`}
                className="mt-2 text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)]"
              >
                {text}
              </p>
            ))}
          </div>

          <div className="mt-2 flex justify-end gap-[10px]">
            <Button variant="ghost" size="sm" type="button" onClick={close}>
              Huỷ
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={invalid || busy}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}

export { NoteFormModal }
