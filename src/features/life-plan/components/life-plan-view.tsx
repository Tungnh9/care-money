"use client"

import { useState } from "react"
import { Flag, NotebookPen } from "lucide-react"
import { toast } from "sonner"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { dayKey } from "@/lib/date"
import { buildTimeline, imageBytesUsed } from "@/lib/life-plan/life-plan-calculations"
import type { LifeNote, LifePlan, LifePlanImage as LifePlanImageData } from "@/lib/life-plan/types"
import { useLifePlan } from "@/lib/life-plan/use-life-plan"
import { getSyncSecret } from "@/lib/sync-secret-storage"
import { usePhotoLock } from "../hooks/use-photo-lock"
import { formatMegabytes, toInputDate } from "../labels"
import { removePhotos } from "../note-photos"
import { ImageViewer } from "./image-viewer"
import { NoteFormModal } from "./note-form-modal"
import { PlanBar } from "./plan-bar"
import { PlanFormModal } from "./plan-form-modal"
import { Timeline } from "./timeline"

const EMPTY = "Chưa có ghi chép nào — thêm ghi chép đầu tiên để bắt đầu dòng thời gian."
const NOTE_PHOTOS_NOT_DELETED = "Đã xoá ghi chép, nhưng chưa xoá được ảnh trên Cloudinary."

// Form đang mở. `note`/`plan` null = thêm mới; form chỉ được dựng khi đang mở, đóng là gỡ hẳn.
interface NoteFormState {
  note: LifeNote | null
}

interface PlanFormState {
  plan: LifePlan | null
}

interface ViewerState {
  images: LifePlanImageData[]
  title: string
  index: number
}

function LifePlanView() {
  const lifePlan = useLifePlan()
  const { notes, plans, hydrated } = lifePlan
  const today = dayKey()
  const photoLock = usePhotoLock()
  const [filter, setFilter] = useState<number | null>(null)
  const [noteForm, setNoteForm] = useState<NoteFormState | null>(null)
  const [planForm, setPlanForm] = useState<PlanFormState | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null)
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null)
  const [viewer, setViewer] = useState<ViewerState | null>(null)

  // Tra lại theo id mỗi lần render: kế hoạch đang lọc hay mục đang chờ xoá vừa biến mất (xoá ở đây hay ở tab khác)
  // thì bỏ luôn trạng thái đó — giữ lại thì 1 mục mới lấy lại đúng id đó (nextId) sẽ tự bị lọc/hỏi xoá.
  const filteredPlan = plans.find((plan) => plan.id === filter) ?? null
  const deletingNote = notes.find((note) => note.id === deletingNoteId) ?? null
  const deletingPlan = plans.find((plan) => plan.id === deletingPlanId) ?? null
  if (hydrated && filter !== null && !filteredPlan) setFilter(null)
  if (deletingNoteId !== null && !deletingNote) setDeletingNoteId(null)
  if (deletingPlanId !== null && !deletingPlan) setDeletingPlanId(null)

  const activeFilter = filteredPlan ? filteredPlan.id : null
  const entries = buildTimeline({ notes, plans }, activeFilter, today)
  const hasEntries = entries.some((entry) => entry.kind !== "today")
  const hasNotes = entries.some((entry) => entry.kind === "note")
  const emptyText = hasNotes
    ? null
    : filteredPlan
      ? `Chưa có ghi chép nào gắn với kế hoạch "${filteredPlan.title}".`
      : EMPTY

  function openNoteForm(note: LifeNote | null) {
    // Lần trước không hỏi được server ảnh (mất mạng…): hỏi lại, để nút thêm ảnh không khoá mãi tới khi tải lại trang.
    photoLock.retry()
    setNoteForm({ note })
  }

  // Xoá ghi chép trên máy trước, rồi xoá ảnh của nó trên Cloudinary và trong cache. Xoá trên cloud lỗi thì ghi chép
  // vẫn đã xoá — báo để chủ app biết còn ảnh mồ côi.
  async function deleteNote(id: number) {
    const removed = lifePlan.removeNote(id)
    if (!removed) return
    const photoIds = removed.images.map((image) => image.id)
    if (photoIds.length && !(await removePhotos(photoIds, getSyncSecret()))) {
      toast.error(NOTE_PHOTOS_NOT_DELETED)
      return
    }
    toast.success(`Đã xoá ghi chép "${removed.title}"`)
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Plan</h1>
          <p className="text-sm text-[var(--ob-color-text-subtle)]">
            {`${notes.length} ghi chép · ${plans.length} kế hoạch · `}
            <span className="whitespace-nowrap">{`Ảnh đã dùng: ${formatMegabytes(imageBytesUsed({ notes, plans }))} MB`}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="sm" type="button" onClick={() => openNoteForm(null)}>
            <NotebookPen size={16} />
            Thêm ghi chép
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={() => setPlanForm({ plan: null })}>
            <Flag size={16} />
            Thêm kế hoạch
          </Button>
        </div>
      </div>

      {/* Bấm 1 kế hoạch để chỉ xem chặng của nó, bấm lại để bỏ lọc. */}
      <PlanBar
        plans={plans}
        activeId={activeFilter}
        onToggle={(id) => setFilter((current) => (current === id ? null : id))}
      />

      <div className="ob-card-grid flex flex-col gap-5">
        <Card label={filteredPlan ? `Dòng thời gian · ${filteredPlan.title}` : "Dòng thời gian"}>
          {/* Chưa đọc xong storage thì chưa vẽ gì — tránh chớp câu "Chưa có ghi chép nào" mỗi lần mở trang. */}
          {hydrated ? (
            <>
              {emptyText ? (
                <p className="mb-3 text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">{emptyText}</p>
              ) : null}
              {hasEntries ? (
                // Đổi kế hoạch lọc thì dòng thời gian hiện lại từ đợt đầu.
                <Timeline
                  key={activeFilter ?? "all"}
                  entries={entries}
                  plans={plans}
                  today={today}
                  onEditNote={(note) => openNoteForm(note)}
                  onDeleteNote={(note) => setDeletingNoteId(note.id)}
                  onEditPlan={(plan) => setPlanForm({ plan })}
                  onDeletePlan={(plan) => setDeletingPlanId(plan.id)}
                  onOpenImage={(note, index) => setViewer({ images: note.images, title: note.title, index })}
                />
              ) : null}
            </>
          ) : null}
        </Card>
      </div>

      {noteForm ? (
        <NoteFormModal
          key={noteForm.note?.id ?? "new"}
          note={noteForm.note}
          plans={plans}
          today={today}
          photoLockReasons={photoLock.reasons}
          onSubmit={(input) => (noteForm.note ? lifePlan.updateNote(noteForm.note.id, input) : lifePlan.addNote(input))}
          onClose={() => setNoteForm(null)}
        />
      ) : null}

      {planForm ? (
        <PlanFormModal
          key={planForm.plan?.id ?? "new"}
          plan={planForm.plan}
          onSubmit={(input) => (planForm.plan ? lifePlan.updatePlan(planForm.plan.id, input) : lifePlan.addPlan(input))}
          onClose={() => setPlanForm(null)}
        />
      ) : null}

      {viewer ? (
        <ImageViewer
          images={viewer.images}
          title={viewer.title}
          initialIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      ) : null}

      <AlertDialog
        open={deletingNote !== null}
        onOpenChange={(open) => !open && setDeletingNoteId(null)}
        title="Xoá ghi chép?"
        description={
          deletingNote ? (
            <>
              Xoá ghi chép <strong>{`"${deletingNote.title}"`}</strong> ngày {toInputDate(deletingNote.day)}
              {deletingNote.images.length ? ` cùng ${deletingNote.images.length} ảnh của nó trên Cloudinary` : ""} sẽ
              không thể hoàn tác.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingNote) void deleteNote(deletingNote.id)
        }}
      />

      <AlertDialog
        open={deletingPlan !== null}
        onOpenChange={(open) => !open && setDeletingPlanId(null)}
        title="Xoá kế hoạch?"
        description={
          deletingPlan ? (
            <>
              Xoá kế hoạch <strong>{`"${deletingPlan.title}"`}</strong>. Các ghi chép đã gắn vẫn giữ, chỉ bỏ gắn.
            </>
          ) : null
        }
        confirmLabel="Xoá"
        destructive
        onConfirm={() => {
          if (deletingPlan) lifePlan.removePlan(deletingPlan.id)
        }}
      />
    </div>
  )
}

export { LifePlanView }
