"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { History } from "lucide-react"

import { AlertDialog } from "@/components/ui/alert-dialog"
import { dayKey, longDate } from "@/lib/date"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings/use-settings"
import { useJournal } from "@/lib/journal/use-journal"
import {
  clearJournalDraft,
  getJournalDraft,
  setJournalDraft,
  type JournalDraft,
} from "@/lib/journal/journal-draft-storage"
import { findOnThisDay } from "../journal-calculations"
import { JournalEditor, type EditorDraft } from "./journal-editor"
import { JournalEntriesCard } from "./journal-entries-card"
import { JournalSaveSuccess } from "./journal-save-success"
import { MoodPickerCard } from "./mood-picker-card"
import { OnThisDayCard } from "./on-this-day-card"
import type { JournalEntry, MoodSnapshot } from "@/lib/journal/types"

const EMPTY_DRAFT: EditorDraft = { html: "", words: 0 }
// Gõ liên tục thì gom lại ghi 1 lần; rời trang, ẩn tab hay đóng app thì ghi ngay phần đang chờ.
const DRAFT_SAVE_DELAY_MS = 600

// "lúc 21:30" nếu nháp từ hôm nay, "lúc 21:30 ngày 05/11" nếu từ hôm khác.
function restoredLabel(savedAt: string): string {
  const at = new Date(savedAt)
  if (Number.isNaN(at.getTime())) return ""
  const time = at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  if (dayKey(at) === dayKey()) return `lúc ${time}`
  return `lúc ${time} ngày ${String(at.getDate()).padStart(2, "0")}/${String(at.getMonth() + 1).padStart(2, "0")}`
}

function JournalView() {
  const { settings } = useSettings()
  const { entries, saveEntry, updateEntry, deleteEntry } = useJournal()
  const [mood, setMood] = useState("")
  const [justSaved, setJustSaved] = useState<JournalEntry | null>(null)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [highlight, setHighlight] = useState<{ id: number; nonce: number } | null>(null)
  // Bản nháp bài mới (chữ + số từ + mood) được cất lúc bấm Sửa 1 bài cũ — khung soạn remount mỗi lần đổi
  // bài nên tự nó không giữ được; Huỷ sửa hay Cập nhật xong thì khung soạn bài mới hiện lại đúng bản này.
  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT)
  const [draftMood, setDraftMood] = useState("")
  // Bài muốn chuyển sang sửa trong lúc bài đang sửa còn thay đổi chưa cập nhật — mở hộp hỏi lại.
  const [pendingEdit, setPendingEdit] = useState<JournalEntry | null>(null)
  // 2 giá trị dưới chỉ đọc trong hàm xử lý sự kiện, không dùng để render — để trong ref thì mỗi phím gõ
  // không render lại cả trang (danh sách bài lọc HTML từng bài mỗi lần render).
  const latestDraftRef = useRef<EditorDraft>(EMPTY_DRAFT)
  const editDirtyRef = useRef(false)
  // Bản nháp bài mới lấy lại từ máy (lần trước rời trang khi đang viết dở): thời điểm lưu, để báo kèm "Bỏ nháp".
  const [restoredAt, setRestoredAt] = useState<string | null>(null)
  // Tăng lên để khung soạn bài mới remount: nó chỉ đọc initialDraft lúc mount.
  const [editorVersion, setEditorVersion] = useState(0)
  // Bản nháp chờ ghi xuống máy (gom các lần gõ liền nhau) và hẹn giờ ghi.
  const pendingDraftRef = useRef<JournalDraft | null>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Chỉ đọc ref nên ổn định qua mọi lần render — dùng được trong effect lắng nghe ẩn tab/rời trang.
  const flushDraft = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = null
    if (pendingDraftRef.current) setJournalDraft(pendingDraftRef.current)
    pendingDraftRef.current = null
  }, [])

  function scheduleDraftSave(next: EditorDraft, draftMoodLabel: string) {
    pendingDraftRef.current = { ...next, mood: draftMoodLabel, savedAt: new Date().toISOString() }
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(flushDraft, DRAFT_SAVE_DELAY_MS)
  }

  function dropSavedDraft() {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = null
    pendingDraftRef.current = null
    clearJournalDraft()
    setRestoredAt(null)
  }

  // Mở trang: lấy lại bản nháp bài mới còn trên máy. localStorage không có lúc SSR, chỉ đọc được sau khi mount.
  useEffect(() => {
    const saved = getJournalDraft()
    if (!saved) return
    const restored = { html: saved.html, words: saved.words }
    latestDraftRef.current = restored
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(restored)
    setDraftMood(saved.mood)
    setMood(saved.mood)
    setRestoredAt(saved.savedAt)
    setEditorVersion((version) => version + 1)
  }, [])

  // Ẩn tab, đóng app hay rời trang Nhật ký: ghi ngay bản nháp đang chờ, không đợi hết giờ hẹn.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "hidden") flushDraft()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", flushDraft)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", flushDraft)
      flushDraft()
    }
  }, [flushDraft])

  const moodEnabled = settings.modules.find((m) => m.key === "tamtrang")?.on ?? true
  const selectedMood = settings.moods.find((m) => m.label === mood)
  // Bài đang sửa vẫn chọn đúng mood đã lưu thì giữ nguyên snapshot đã lưu (đóng băng như Expense.tag) — kể
  // cả khi mood đó đã bị tắt, bị xoá hay được tạo lại trong Cài đặt. Chỉ khi chọn mood khác (hoặc viết bài
  // mới) mới dựng snapshot từ Cài đặt.
  const keptEntryMood = editingEntry?.mood && editingEntry.mood.label === mood ? editingEntry.mood : null
  const selectedMoodSnapshot: MoodSnapshot | null =
    keptEntryMood ??
    (selectedMood
      ? { emoji: selectedMood.emoji, label: selectedMood.label, tint: selectedMood.tint, score: selectedMood.score }
      : null)
  const onThisDay = findOnThisDay(entries)

  function startEditing(entry: JournalEntry) {
    setJustSaved(null)
    setEditingEntry(entry)
    setMood(entry.mood?.label ?? "")
    editDirtyRef.current = false
  }

  // Dùng chung cho Huỷ sửa, Cập nhật xong và xoá đúng bài đang sửa: khung soạn bài mới hiện lại bản nháp
  // đã cất (prop initialDraft), mood quay về mood của bản nháp.
  function leaveEditMode() {
    setEditingEntry(null)
    setMood(draftMood)
    editDirtyRef.current = false
  }

  function handleSave(input: { text: string; words: number; mood: typeof selectedMoodSnapshot }): boolean {
    if (editingEntry) {
      // Ghi lỗi (hay bài vừa bị xoá ở tab khác) thì ở lại chế độ sửa: khung soạn còn nguyên chữ để thử lại.
      if (!updateEntry(editingEntry.id, input)) return false
      leaveEditMode()
      return true
    }
    const entry = saveEntry(input)
    if (!entry) return false
    // Bản nháp đã thành bài — lần sau khung soạn bài mới bắt đầu trống, và không còn nháp trên máy.
    latestDraftRef.current = EMPTY_DRAFT
    setDraft(EMPTY_DRAFT)
    dropSavedDraft()
    setJustSaved(entry)
    return true
  }

  // "Bỏ nháp" ở dòng báo khôi phục: xoá nháp trên máy, khung soạn bài mới trống lại, bỏ mood đã chọn.
  function discardRestoredDraft() {
    dropSavedDraft()
    latestDraftRef.current = EMPTY_DRAFT
    setDraft(EMPTY_DRAFT)
    setDraftMood("")
    setMood("")
    setEditorVersion((version) => version + 1)
  }

  function handleEdit(entry: JournalEntry) {
    if (entry.id === editingEntry?.id) return
    if (editingEntry && editDirtyRef.current) {
      // Thay đổi của 1 bài cũ không có chỗ cất hợp lý — hỏi trước khi bỏ.
      setPendingEdit(entry)
      return
    }
    if (!editingEntry) {
      // Rời khung soạn bài mới: cất bản nháp và mood đang chọn để trả lại khi sửa xong.
      setDraft(latestDraftRef.current)
      setDraftMood(mood)
    }
    startEditing(entry)
  }

  function handleDraftChange(next: EditorDraft) {
    if (editingEntry) {
      editDirtyRef.current = true
      return
    }
    latestDraftRef.current = next
    scheduleDraftSave(next, mood)
    // "Xoá nháp" trong khung soạn: không còn gì để báo đã khôi phục.
    if (!next.words && restoredAt) setRestoredAt(null)
  }

  function handleSelectMood(label: string) {
    setMood(label)
    if (editingEntry) editDirtyRef.current = true
    else if (latestDraftRef.current.words) scheduleDraftSave(latestDraftRef.current, label)
  }

  function handleDelete(id: number) {
    // Xoá đúng bài đang sửa thì rời chế độ sửa — không thì nút "Cập nhật" trỏ vào 1 bài không còn nữa.
    if (deleteEntry(id) && editingEntry?.id === id) leaveEditMode()
  }

  function handleViewEntries() {
    if (!justSaved) return
    // nonce buộc React remount đúng dòng đó để phát lại hiệu ứng nhấp nháy, kể cả khi
    // bấm liên tiếp nhiều lần vào cùng 1 bài (setState cùng id sẽ không tự re-render).
    setHighlight({ id: justSaved.id, nonce: Date.now() })
    const el = document.getElementById(`journal-entry-${justSaved.id}`) ?? document.getElementById("ds-entries")
    el?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  return (
    <div>
      <h1 className="mb-1 [font:var(--ob-text-h2)] tracking-[var(--ob-track-heading)]">Nhật ký</h1>
      <p className="mb-5 text-sm text-[var(--ob-color-text-subtle)]">{longDate()} · viết bao nhiêu cũng được</p>
      <div className="ob-card-grid flex flex-wrap gap-5">
        <div className="min-w-0 flex-[1_1_100%]">
          {justSaved ? (
            <JournalSaveSuccess
              entry={justSaved}
              onWriteMore={() => setJustSaved(null)}
              onViewEntries={handleViewEntries}
            />
          ) : (
            <>
              {restoredAt && !editingEntry ? (
                <div
                  role="status"
                  className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--ob-radius-md)] border-[1.5px] border-[var(--ob-cam-200)] bg-[var(--ob-cam-50)] px-4 py-1 text-[13.5px]"
                >
                  <History size={16} aria-hidden className="flex-none text-[var(--ob-color-action-strong)]" />
                  <span>
                    <strong className="font-bold">Đã khôi phục bản nháp</strong> {restoredLabel(restoredAt)}
                  </span>
                  <button
                    type="button"
                    onClick={discardRestoredDraft}
                    className="ml-auto min-h-[var(--ob-hit-min)] font-semibold text-[var(--ob-color-action-strong)] underline underline-offset-2"
                  >
                    Bỏ nháp
                  </button>
                </div>
              ) : null}
              <JournalEditor
                key={editingEntry?.id ?? `new-${editorVersion}`}
                selectedMood={selectedMoodSnapshot}
                onSave={handleSave}
                editingEntry={editingEntry}
                onCancelEdit={leaveEditMode}
                initialDraft={draft}
                onDraftChange={handleDraftChange}
              />
            </>
          )}
        </div>
        {onThisDay ? (
          <div className="min-w-0 flex-[1_1_100%]">
            <OnThisDayCard result={onThisDay} />
          </div>
        ) : null}
        {moodEnabled ? (
          <div className="min-w-0 flex-[1_1_300px] [&>*]:h-full">
            <MoodPickerCard
              moods={settings.moods}
              selected={mood}
              onSelect={handleSelectMood}
              entryMood={editingEntry?.mood ?? null}
            />
          </div>
        ) : null}
        <div className={cn("min-w-0 [&>*]:h-full", entries.length ? "flex-[1_1_100%]" : "flex-[2_1_360px]")}>
          <JournalEntriesCard
            entries={entries}
            onDelete={handleDelete}
            onEdit={handleEdit}
            highlightEntryId={highlight?.id ?? null}
            highlightNonce={highlight?.nonce}
          />
        </div>
      </div>
      <AlertDialog
        open={pendingEdit !== null}
        onOpenChange={(open) => !open && setPendingEdit(null)}
        title="Bỏ thay đổi chưa lưu?"
        description="Bài đang sửa có thay đổi chưa cập nhật. Chuyển sang sửa bài khác thì các thay đổi đó sẽ mất."
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục sửa"
        destructive
        onConfirm={() => {
          if (pendingEdit) startEditing(pendingEdit)
        }}
      />
    </div>
  )
}

export { JournalView }
