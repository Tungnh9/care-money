"use client"

import { useCallback, useEffect, useState } from "react"

import { toast } from "sonner"
import { dayKey } from "@/lib/date"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"
import {
  DEFAULT_LIFE_PLAN_STATE,
  LIFE_PLAN_STORAGE_KEY,
  MAX_NOTE_IMAGES,
  getStoredLifePlan,
  isDayKey,
  isTargetMonth,
  isTargetYear,
  setStoredLifePlan,
  withoutPlan,
  type LifePlanState,
} from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifeNoteInput, LifePlan, LifePlanInput, LifePlanStatus } from "@/lib/life-plan/types"

// Câu báo khi dữ liệu nhập không lưu được, null khi hợp lệ. Form đã tự kiểm — đây là chốt chặn cuối để storage
// không bao giờ nhận 1 ghi chép hay kế hoạch mà dòng thời gian không đặt được.
function noteInputError(input: LifeNoteInput): string | null {
  if (!input.title.trim()) return "Vui lòng nhập tiêu đề ghi chép."
  if (!isDayKey(input.day)) return "Ngày ghi chép không hợp lệ."
  if (input.images.length > MAX_NOTE_IMAGES) return `Mỗi ghi chép chỉ có tối đa ${MAX_NOTE_IMAGES} ảnh.`
  return null
}

function planInputError(input: LifePlanInput): string | null {
  if (!input.title.trim()) return "Vui lòng nhập tên kế hoạch."
  if (!isTargetYear(input.targetYear)) return "Năm muốn đạt phải là số nguyên từ 1000 đến 9999."
  if (input.targetMonth !== undefined && !isTargetMonth(input.targetMonth)) {
    return "Tháng muốn đạt phải là số nguyên từ 1 đến 12."
  }
  return null
}

// Tiêu đề và nội dung cắt khoảng trắng 2 đầu (xuống dòng bên trong giữ nguyên). Chỉ giữ gắn kế hoạch khi kế hoạch đó
// còn trong bản đọc tươi `plans` — mã lạ (NaN, 0, kế hoạch vừa bị xoá ở tab khác) thì không gắn, không có key
// `planId`: NaN qua JSON thành null và cả ghi chép sẽ bị bỏ ở lần đọc sau. Mỗi ảnh chỉ lưu đúng 4 field của
// LifePlanImage — form có thể kèm thêm thứ khác (link xem trước) không được lọt vào storage.
function noteRecord(id: number, input: LifeNoteInput, plans: LifePlan[]): LifeNote {
  const { day, planId } = input
  const title = input.title.trim()
  const images = input.images.map(({ id: imageId, bytes, width, height }) => ({ id: imageId, bytes, width, height }))
  const linked = planId !== undefined && plans.some((plan) => plan.id === planId)
  return { id, day, title, content: input.content.trim(), images, ...(linked ? { planId } : {}) }
}

// Đã đạt thì có ngày đạt: giữ ngày cũ nếu kế hoạch vốn đã đạt (sửa tên 1 kế hoạch đã đạt không dời nó trên dòng
// thời gian), vừa chuyển sang thì là hôm nay — kể cả khi kế hoạch chưa đạt còn sót ngày đạt cũ (bản sao sửa tay).
// Rời "đã đạt" thì bỏ ngày đạt.
function doneDayFor(status: LifePlanStatus, existing: LifePlan | undefined): string | undefined {
  if (status !== "done") return undefined
  if (existing?.status === "done" && existing.doneDay) return existing.doneDay
  return dayKey()
}

// Ghi chú trống thì không có key `note`, không có tháng thì không có key `targetMonth`.
function planRecord(id: number, input: LifePlanInput, existing?: LifePlan): LifePlan {
  const { targetYear, targetMonth, status } = input
  const title = input.title.trim()
  const note = input.note?.trim()
  const doneDay = doneDayFor(status, existing)
  return {
    id,
    title,
    targetYear,
    ...(targetMonth !== undefined ? { targetMonth } : {}),
    status,
    ...(doneDay ? { doneDay } : {}),
    ...(note ? { note } : {}),
  }
}

function useLifePlan() {
  const [state, setState] = useState<LifePlanState>(DEFAULT_LIFE_PLAN_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredLifePlan())
    setHydrated(true)
  }, [])

  // Tab khác (hay 1 lần nhập file/tải xuống từ cloud) ghi life-plan-data sau khi trang đã mở.
  const reload = useCallback(() => setState(getStoredLifePlan()), [])
  useStorageSync(LIFE_PLAN_STORAGE_KEY, reload)

  const persist = useCallback((next: LifePlanState) => {
    setStoredLifePlan(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi dựng từ getStoredLifePlan() đọc tươi, không từ `state` trong closure — kể cả nextId, để
  // ghi chép hay kế hoạch tab khác vừa thêm không bị ghi đè mất hay trùng id.

  // Ghi chép mới lên đầu danh sách. Trả true khi đã ghi — form chỉ đóng khi true, mọi nhánh lỗi đã tự báo toast.
  const addNote = useCallback(
    (input: LifeNoteInput): boolean => {
      const error = noteInputError(input)
      if (error) {
        toast.error(error)
        return false
      }
      const current = getStoredLifePlan()
      try {
        const note = noteRecord(nextId(current.notes), input, current.plans)
        persist({ ...current, notes: [note, ...current.notes] })
        toast.success(`Đã thêm ghi chép "${note.title}"`)
        return true
      } catch {
        toast.error("Không thể thêm ghi chép. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const updateNote = useCallback(
    (id: number, input: LifeNoteInput): boolean => {
      const error = noteInputError(input)
      if (error) {
        toast.error(error)
        return false
      }
      const current = getStoredLifePlan()
      // Tab khác vừa xoá ghi chép này: báo lỗi và giữ form mở, thay vì báo "Đã cập nhật" mà không ghi gì.
      if (!current.notes.some((note) => note.id === id)) {
        toast.error("Ghi chép này vừa bị xoá ở nơi khác — không còn gì để cập nhật.")
        return false
      }
      try {
        const updated = noteRecord(id, input, current.plans)
        persist({ ...current, notes: current.notes.map((note) => (note.id === id ? updated : note)) })
        toast.success(`Đã cập nhật ghi chép "${updated.title}"`)
        return true
      } catch {
        toast.error("Không thể cập nhật ghi chép. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  // Trả ghi chép vừa xoá để nơi gọi xoá tiếp ảnh của nó trên Cloudinary và trong cache; null khi không xoá gì
  // (không còn ghi chép đó, hay ghi lỗi — lỗi đã báo toast). Không báo "Đã xoá" ở đây: nơi gọi báo sau khi biết
  // ảnh có xoá được hay không.
  const removeNote = useCallback(
    (id: number): LifeNote | null => {
      const current = getStoredLifePlan()
      const removed = current.notes.find((note) => note.id === id)
      if (!removed) return null
      try {
        persist({ ...current, notes: current.notes.filter((note) => note.id !== id) })
        return removed
      } catch {
        toast.error("Không thể xoá ghi chép. Vui lòng thử lại.")
        return null
      }
    },
    [persist]
  )

  // Kế hoạch mới xếp sau các kế hoạch đã có.
  const addPlan = useCallback(
    (input: LifePlanInput): boolean => {
      const error = planInputError(input)
      if (error) {
        toast.error(error)
        return false
      }
      const current = getStoredLifePlan()
      try {
        const plan = planRecord(nextId(current.plans), input)
        persist({ ...current, plans: [...current.plans, plan] })
        toast.success(`Đã thêm kế hoạch "${plan.title}"`)
        return true
      } catch {
        toast.error("Không thể thêm kế hoạch. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  const updatePlan = useCallback(
    (id: number, input: LifePlanInput): boolean => {
      const error = planInputError(input)
      if (error) {
        toast.error(error)
        return false
      }
      const current = getStoredLifePlan()
      const existing = current.plans.find((plan) => plan.id === id)
      if (!existing) {
        toast.error("Kế hoạch này vừa bị xoá ở nơi khác — không còn gì để cập nhật.")
        return false
      }
      try {
        const updated = planRecord(id, input, existing)
        persist({ ...current, plans: current.plans.map((plan) => (plan.id === id ? updated : plan)) })
        toast.success(`Đã cập nhật kế hoạch "${updated.title}"`)
        return true
      } catch {
        toast.error("Không thể cập nhật kế hoạch. Vui lòng thử lại.")
        return false
      }
    },
    [persist]
  )

  // Các ghi chép đã gắn vẫn giữ, chỉ bỏ gắn — trong CÙNG 1 lần ghi với việc xoá kế hoạch, để không bao giờ còn
  // ghi chép trỏ tới kế hoạch đã mất.
  const removePlan = useCallback(
    (id: number) => {
      const current = getStoredLifePlan()
      const removed = current.plans.find((plan) => plan.id === id)
      if (!removed) return
      try {
        persist({
          ...current,
          notes: current.notes.map((note) => (note.planId === id ? withoutPlan(note) : note)),
          plans: current.plans.filter((plan) => plan.id !== id),
        })
        toast.success(`Đã xoá kế hoạch "${removed.title}"`)
      } catch {
        toast.error("Không thể xoá kế hoạch. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  return {
    notes: state.notes,
    plans: state.plans,
    hydrated,
    addNote,
    updateNote,
    removeNote,
    addPlan,
    updatePlan,
    removePlan,
    // Khôi phục bản sao lưu / tải xuống từ cloud: ghi lỗi thì NÉM ra để nơi gọi trả mọi key về như cũ.
    replaceLifePlan: persist,
  }
}

export { useLifePlan }
