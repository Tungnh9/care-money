import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { toast } from "sonner"

import { useLifePlan } from "@/lib/life-plan/use-life-plan"
import {
  LIFE_PLAN_STORAGE_KEY,
  getStoredLifePlan,
  setStoredLifePlan,
  type LifePlanState,
} from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifeNoteInput, LifePlan, LifePlanImage, LifePlanInput } from "@/lib/life-plan/types"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const PHOTO: LifePlanImage = {
  id: "life-plan/development/abcdefghij0123456789",
  bytes: 200_000,
  width: 1600,
  height: 900,
}

function photos(count: number): LifePlanImage[] {
  return Array.from({ length: count }, (_, i) => ({
    ...PHOTO,
    id: `life-plan/development/${String(i).padStart(20, "0")}`,
  }))
}

const NOTE_INPUT: LifeNoteInput = { day: "2026-10-29", title: "Đi xem nhà", content: "Xem 2 căn.", images: [PHOTO] }
const PLAN_INPUT: LifePlanInput = { title: "Mua nhà", targetYear: 2030, status: "planned" }

function storedNote(overrides: Partial<LifeNote> & { id: number }): LifeNote {
  return { day: "2026-10-01", title: `Ghi chép ${overrides.id}`, content: "", images: [], ...overrides }
}

function storedPlan(overrides: Partial<LifePlan> & { id: number }): LifePlan {
  return { title: `Kế hoạch ${overrides.id}`, targetYear: 2030, status: "planned", ...overrides }
}

function seed(state: Partial<LifePlanState>) {
  setStoredLifePlan({ notes: [], plans: [], ...state })
}

async function renderLifePlan() {
  const hook = renderHook(() => useLifePlan())
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true))
  return hook
}

function lifePlanWrites(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(([key]) => key === LIFE_PLAN_STORAGE_KEY).length
}

function errorMessages(): unknown[] {
  return vi.mocked(toast.error).mock.calls.map(([message]) => message)
}

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date(2026, 9, 29, 9, 0))
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
  // Lưới an toàn: 1 test đỏ giữa chừng thì setItem bị giả lỗi không lan sang các test sau.
  vi.restoreAllMocks()
})

describe("useLifePlan", () => {
  it("reports hydrated only once the stored notes and plans have been read", async () => {
    seed({ notes: [storedNote({ id: 1 })], plans: [storedPlan({ id: 1 })] })
    const seen: { hydrated: boolean; notes: number; plans: number }[] = []
    renderHook(() => {
      const lifePlan = useLifePlan()
      seen.push({ hydrated: lifePlan.hydrated, notes: lifePlan.notes.length, plans: lifePlan.plans.length })
      return lifePlan
    })

    expect(seen[0]).toEqual({ hydrated: false, notes: 0, plans: 0 })
    await waitFor(() => expect(seen[seen.length - 1]).toEqual({ hydrated: true, notes: 1, plans: 1 }))
    expect(seen.filter((s) => s.hydrated).every((s) => s.notes === 1 && s.plans === 1)).toBe(true)
  })

  it("replaceLifePlan overwrites the whole state and persists it, e.g. after restoring a backup", async () => {
    seed({ notes: [storedNote({ id: 1 })] })
    const { result } = await renderLifePlan()
    const restored = { notes: [storedNote({ id: 5, planId: 2 })], plans: [storedPlan({ id: 2 })] }

    act(() => {
      result.current.replaceLifePlan(restored)
    })

    expect(result.current.notes).toEqual(restored.notes)
    expect(result.current.plans).toEqual(restored.plans)
    expect(getStoredLifePlan()).toEqual(restored)
  })

  it("replaceLifePlan lets a failed write throw, so restoring a backup can put every key back as it was", async () => {
    seed({ notes: [storedNote({ id: 1 })] })
    const { result } = await renderLifePlan()
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })

    expect(() => result.current.replaceLifePlan({ notes: [], plans: [storedPlan({ id: 2 })] })).toThrow(
      "QuotaExceededError"
    )
    spy.mockRestore()

    expect(result.current.notes).toEqual([storedNote({ id: 1 })])
    expect(getStoredLifePlan()).toEqual({ notes: [storedNote({ id: 1 })], plans: [] })
  })
})

describe("useLifePlan — ghi chép", () => {
  it("addNote saves the note on top with the next id, its title and text trimmed", async () => {
    seed({ notes: [storedNote({ id: 4 })], plans: [storedPlan({ id: 2 })] })
    const { result } = await renderLifePlan()

    let ok = false
    act(() => {
      ok = result.current.addNote({
        ...NOTE_INPUT,
        title: "  Đi xem nhà  ",
        content: "  Xem 2 căn.\nCăn 2 sáng hơn.\n ",
        planId: 2,
      })
    })

    const saved = {
      id: 5,
      day: "2026-10-29",
      title: "Đi xem nhà",
      content: "Xem 2 căn.\nCăn 2 sáng hơn.",
      images: [PHOTO],
      planId: 2,
    }
    expect(ok).toBe(true)
    expect(getStoredLifePlan().notes).toEqual([saved, storedNote({ id: 4 })])
    expect(result.current.notes).toEqual([saved, storedNote({ id: 4 })])
    expect(toast.success).toHaveBeenCalledWith('Đã thêm ghi chép "Đi xem nhà"')
  })

  it("addNote takes a future day and exactly 10 photos", async () => {
    const { result } = await renderLifePlan()

    let ok = false
    act(() => {
      ok = result.current.addNote({ ...NOTE_INPUT, day: "2027-03-15", images: photos(10) })
    })

    expect(ok).toBe(true)
    expect(getStoredLifePlan().notes).toEqual([{ ...NOTE_INPUT, id: 1, day: "2027-03-15", images: photos(10) }])
  })

  it("refuses a note with a blank title, a day that does not exist or 11 photos, writing nothing", async () => {
    const { result } = await renderLifePlan()
    const attempts: LifeNoteInput[] = [
      { ...NOTE_INPUT, title: "   " },
      { ...NOTE_INPUT, day: "2026-02-30" },
      { ...NOTE_INPUT, day: "29/10/2026" },
      { ...NOTE_INPUT, images: photos(11) },
    ]

    const outcomes: boolean[] = []
    act(() => {
      for (const input of attempts) outcomes.push(result.current.addNote(input))
    })

    expect(outcomes).toEqual([false, false, false, false])
    expect(errorMessages()).toEqual([
      "Vui lòng nhập tiêu đề ghi chép.",
      "Ngày ghi chép không hợp lệ.",
      "Ngày ghi chép không hợp lệ.",
      "Mỗi ghi chép chỉ có tối đa 10 ảnh.",
    ])
    expect(getStoredLifePlan().notes).toEqual([])
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("updateNote replaces the day, text, photos and plan of that note only", async () => {
    seed({
      notes: [storedNote({ id: 1, planId: 2, images: [PHOTO] }), storedNote({ id: 2 })],
      plans: [storedPlan({ id: 2 })],
    })
    const { result } = await renderLifePlan()

    let ok = false
    act(() => {
      ok = result.current.updateNote(1, {
        day: "2026-11-05",
        title: " Xem nhà lần 2 ",
        content: "Chốt căn sáng.",
        images: [],
      })
    })

    const updated = { id: 1, day: "2026-11-05", title: "Xem nhà lần 2", content: "Chốt căn sáng.", images: [] }
    expect(ok).toBe(true)
    expect(getStoredLifePlan().notes).toEqual([updated, storedNote({ id: 2 })])
    expect(result.current.notes).toEqual([updated, storedNote({ id: 2 })])
    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật ghi chép "Xem nhà lần 2"')
  })

  it("addNote keeps the plan link only to a plan that exists, so a stray id never lands in storage", async () => {
    seed({ plans: [storedPlan({ id: 2 })] })
    const { result } = await renderLifePlan()

    act(() => {
      result.current.addNote({ ...NOTE_INPUT, title: "Không có kế hoạch 9", planId: 9 })
      result.current.addNote({ ...NOTE_INPUT, title: "Mã 0", planId: 0 })
      result.current.addNote({ ...NOTE_INPUT, title: "Mã NaN", planId: Number.NaN })
      result.current.addNote({ ...NOTE_INPUT, title: "Gắn kế hoạch 2", planId: 2 })
    })

    // Đọc chuỗi thô: getStoredLifePlan tự bỏ gắn khi đọc, nên chỉ chuỗi thô cho thấy mã lạ có bị ghi xuống không.
    const raw = JSON.parse(window.localStorage.getItem(LIFE_PLAN_STORAGE_KEY) ?? "{}") as { notes: LifeNote[] }
    expect(raw.notes.map((note) => [note.title, "planId" in note ? note.planId : "none"])).toEqual([
      ["Gắn kế hoạch 2", 2],
      ["Mã NaN", "none"],
      ["Mã 0", "none"],
      ["Không có kế hoạch 9", "none"],
    ])
    expect(result.current.notes.map((note) => note.planId)).toEqual([2, undefined, undefined, undefined])
    // NaN từng thành null trong JSON, và schema bỏ cả ghi chép mang planId null ở lần đọc sau.
    expect(getStoredLifePlan().notes).toHaveLength(4)
  })

  it("updateNote drops the link to a plan another tab deleted while the form was open", async () => {
    seed({ notes: [storedNote({ id: 1, planId: 2 })], plans: [storedPlan({ id: 2 })] })
    const { result } = await renderLifePlan()
    // Tab khác vừa xoá kế hoạch 2 (và bỏ gắn ghi chép) — ghi thẳng, chưa kịp đọc lại.
    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify({ notes: [storedNote({ id: 1 })], plans: [] }))

    act(() => {
      result.current.updateNote(1, { ...NOTE_INPUT, planId: 2 })
    })

    const raw = JSON.parse(window.localStorage.getItem(LIFE_PLAN_STORAGE_KEY) ?? "{}") as { notes: LifeNote[] }
    expect(raw.notes[0]).not.toHaveProperty("planId")
    expect(result.current.notes[0]).not.toHaveProperty("planId")
  })

  it("stores only the id, size and dimensions of each photo, not whatever else the form carried", async () => {
    const { result } = await renderLifePlan()
    const withPreview = { ...PHOTO, url: "blob:http://localhost/preview", file: "IMG_0001.HEIC" } as LifePlanImage

    act(() => {
      result.current.addNote({ ...NOTE_INPUT, images: [withPreview] })
    })

    const raw = JSON.parse(window.localStorage.getItem(LIFE_PLAN_STORAGE_KEY) ?? "{}") as { notes: LifeNote[] }
    expect(raw.notes[0].images).toEqual([PHOTO])
    expect(Object.keys(raw.notes[0].images[0]).sort()).toEqual(["bytes", "height", "id", "width"])
    expect(Object.keys(result.current.notes[0].images[0]).sort()).toEqual(["bytes", "height", "id", "width"])
  })

  it("updateNote refuses 11 photos and keeps the note as it was", async () => {
    seed({ notes: [storedNote({ id: 1 })] })
    const { result } = await renderLifePlan()

    let ok = true
    act(() => {
      ok = result.current.updateNote(1, { ...NOTE_INPUT, images: photos(11) })
    })

    expect(ok).toBe(false)
    expect(errorMessages()).toEqual(["Mỗi ghi chép chỉ có tối đa 10 ảnh."])
    expect(getStoredLifePlan().notes).toEqual([storedNote({ id: 1 })])
  })

  it("updateNote refuses with an error toast when the note was deleted elsewhere, so the form stays open", async () => {
    seed({ notes: [storedNote({ id: 1 })] })
    const { result } = await renderLifePlan()
    // Tab khác vừa xoá ghi chép này — ghi thẳng, chưa kịp đọc lại.
    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify({ notes: [], plans: [] }))

    let ok = true
    act(() => {
      ok = result.current.updateNote(1, NOTE_INPUT)
    })

    expect(ok).toBe(false)
    expect(errorMessages()).toEqual(["Ghi chép này vừa bị xoá ở nơi khác — không còn gì để cập nhật."])
    expect(getStoredLifePlan().notes).toEqual([])
  })

  it("removeNote deletes the note and hands it back so its photos can be deleted too", async () => {
    const withPhotos = storedNote({ id: 1, images: [PHOTO], planId: 3 })
    seed({ notes: [withPhotos, storedNote({ id: 2 })], plans: [storedPlan({ id: 3 })] })
    const { result } = await renderLifePlan()

    let removed: LifeNote | null = null
    act(() => {
      removed = result.current.removeNote(1)
    })

    expect(removed).toEqual(withPhotos)
    expect(getStoredLifePlan().notes).toEqual([storedNote({ id: 2 })])
    expect(result.current.notes).toEqual([storedNote({ id: 2 })])
  })

  it("removeNote hands back nothing and writes nothing for a note that is already gone", async () => {
    seed({ notes: [storedNote({ id: 2 })] })
    const { result } = await renderLifePlan()

    const spy = vi.spyOn(Storage.prototype, "setItem")
    let removed: LifeNote | null = storedNote({ id: 1 })
    act(() => {
      removed = result.current.removeNote(1)
    })
    const writes = lifePlanWrites(spy)
    spy.mockRestore()

    expect(removed).toBeNull()
    expect(writes).toBe(0)
    expect(getStoredLifePlan().notes).toEqual([storedNote({ id: 2 })])
  })
})

describe("useLifePlan — kế hoạch", () => {
  it("addPlan adds a trimmed plan after the others with the next id", async () => {
    seed({ plans: [storedPlan({ id: 2 })] })
    const { result } = await renderLifePlan()

    let ok = false
    act(() => {
      ok = result.current.addPlan({
        title: "  Mua xe  ",
        targetYear: 2027,
        targetMonth: 6,
        status: "doing",
        note: " Xe điện ",
      })
    })

    const added = { id: 3, title: "Mua xe", targetYear: 2027, targetMonth: 6, status: "doing", note: "Xe điện" }
    expect(ok).toBe(true)
    expect(getStoredLifePlan().plans).toEqual([storedPlan({ id: 2 }), added])
    expect(result.current.plans).toEqual([storedPlan({ id: 2 }), added])
    expect(toast.success).toHaveBeenCalledWith('Đã thêm kế hoạch "Mua xe"')
  })

  it("addPlan leaves out a blank note, and records today as the day a plan added as reached was reached", async () => {
    const { result } = await renderLifePlan()

    act(() => {
      result.current.addPlan({ ...PLAN_INPUT, note: "   " })
    })
    act(() => {
      result.current.addPlan({ ...PLAN_INPUT, title: "Học bơi", status: "done" })
    })

    expect(getStoredLifePlan().plans).toEqual([
      { id: 1, title: "Mua nhà", targetYear: 2030, status: "planned" },
      { id: 2, title: "Học bơi", targetYear: 2030, status: "done", doneDay: "2026-10-29" },
    ])
  })

  it("refuses a plan with a blank title, a month outside 1–12 or a year outside 1000–9999, writing nothing", async () => {
    const { result } = await renderLifePlan()
    const attempts: LifePlanInput[] = [
      { ...PLAN_INPUT, title: "  " },
      { ...PLAN_INPUT, targetMonth: 13 },
      { ...PLAN_INPUT, targetMonth: 0 },
      { ...PLAN_INPUT, targetMonth: 6.5 },
      { ...PLAN_INPUT, targetYear: 999 },
      { ...PLAN_INPUT, targetYear: 10000 },
      { ...PLAN_INPUT, targetYear: 2030.5 },
    ]

    const outcomes: boolean[] = []
    act(() => {
      for (const input of attempts) outcomes.push(result.current.addPlan(input))
    })

    expect(outcomes).toEqual([false, false, false, false, false, false, false])
    expect(errorMessages()).toEqual([
      "Vui lòng nhập tên kế hoạch.",
      "Tháng muốn đạt phải là số nguyên từ 1 đến 12.",
      "Tháng muốn đạt phải là số nguyên từ 1 đến 12.",
      "Tháng muốn đạt phải là số nguyên từ 1 đến 12.",
      "Năm muốn đạt phải là số nguyên từ 1000 đến 9999.",
      "Năm muốn đạt phải là số nguyên từ 1000 đến 9999.",
      "Năm muốn đạt phải là số nguyên từ 1000 đến 9999.",
    ])
    expect(getStoredLifePlan().plans).toEqual([])
  })

  it("updatePlan to done records today as the day it was reached, and moving back to doing drops it", async () => {
    seed({ plans: [storedPlan({ id: 1, status: "doing" }), storedPlan({ id: 2 })] })
    const { result } = await renderLifePlan()

    let ok = false
    act(() => {
      ok = result.current.updatePlan(1, { ...PLAN_INPUT, status: "done" })
    })
    expect(ok).toBe(true)
    expect(getStoredLifePlan().plans).toEqual([
      { id: 1, title: "Mua nhà", targetYear: 2030, status: "done", doneDay: "2026-10-29" },
      storedPlan({ id: 2 }),
    ])
    expect(toast.success).toHaveBeenCalledWith('Đã cập nhật kế hoạch "Mua nhà"')

    act(() => {
      result.current.updatePlan(1, { ...PLAN_INPUT, status: "doing" })
    })
    expect(getStoredLifePlan().plans).toEqual([
      { id: 1, title: "Mua nhà", targetYear: 2030, status: "doing" },
      storedPlan({ id: 2 }),
    ])
    expect(result.current.plans[0]).toEqual({ id: 1, title: "Mua nhà", targetYear: 2030, status: "doing" })
  })

  it("updatePlan keeps the day a reached plan was reached, but not a stale day left on a plan not reached", async () => {
    seed({
      plans: [
        storedPlan({ id: 1, status: "done", doneDay: "2026-05-01" }),
        // Bản sao sửa tay: kế hoạch chưa đạt mà vẫn còn ngày đạt cũ.
        storedPlan({ id: 2, status: "doing", doneDay: "2020-01-01" }),
      ],
    })
    const { result } = await renderLifePlan()

    act(() => {
      result.current.updatePlan(1, { ...PLAN_INPUT, title: "Mua nhà ở Hà Nội", status: "done" })
    })
    act(() => {
      result.current.updatePlan(2, { ...PLAN_INPUT, status: "done" })
    })

    expect(getStoredLifePlan().plans.map((p) => p.doneDay)).toEqual(["2026-05-01", "2026-10-29"])
  })

  it("updatePlan refuses a month of 13 and keeps the plan as it was", async () => {
    seed({ plans: [storedPlan({ id: 1 })] })
    const { result } = await renderLifePlan()

    let ok = true
    act(() => {
      ok = result.current.updatePlan(1, { ...PLAN_INPUT, targetMonth: 13 })
    })

    expect(ok).toBe(false)
    expect(errorMessages()).toEqual(["Tháng muốn đạt phải là số nguyên từ 1 đến 12."])
    expect(getStoredLifePlan().plans).toEqual([storedPlan({ id: 1 })])
  })

  it("updatePlan refuses with an error toast when the plan was deleted elsewhere", async () => {
    seed({ plans: [storedPlan({ id: 1 })] })
    const { result } = await renderLifePlan()
    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify({ notes: [], plans: [] }))

    let ok = true
    act(() => {
      ok = result.current.updatePlan(1, PLAN_INPUT)
    })

    expect(ok).toBe(false)
    expect(errorMessages()).toEqual(["Kế hoạch này vừa bị xoá ở nơi khác — không còn gì để cập nhật."])
    expect(getStoredLifePlan().plans).toEqual([])
  })

  it("removePlan deletes the plan and unlinks every note attached to it in a single write", async () => {
    seed({
      notes: [storedNote({ id: 1, planId: 1 }), storedNote({ id: 2, planId: 2 }), storedNote({ id: 3, planId: 1 })],
      plans: [storedPlan({ id: 1 }), storedPlan({ id: 2 })],
    })
    const { result } = await renderLifePlan()

    const spy = vi.spyOn(Storage.prototype, "setItem")
    act(() => {
      result.current.removePlan(1)
    })
    const writes = lifePlanWrites(spy)
    spy.mockRestore()

    const after = {
      notes: [storedNote({ id: 1 }), storedNote({ id: 2, planId: 2 }), storedNote({ id: 3 })],
      plans: [storedPlan({ id: 2 })],
    }
    expect(writes).toBe(1)
    expect(getStoredLifePlan()).toEqual(after)
    expect(result.current.notes).toEqual(after.notes)
    expect(result.current.plans).toEqual(after.plans)
    expect(toast.success).toHaveBeenCalledWith('Đã xoá kế hoạch "Kế hoạch 1"')
  })
})

describe("useLifePlan — lỗi ghi", () => {
  it("reports every failed write with a toast instead of throwing, and keeps what was stored", async () => {
    const before = { notes: [storedNote({ id: 1 })], plans: [storedPlan({ id: 1 })] }
    seed(before)
    const { result } = await renderLifePlan()

    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    const outcomes: unknown[] = []
    act(() => {
      outcomes.push(result.current.addNote(NOTE_INPUT))
      outcomes.push(result.current.updateNote(1, NOTE_INPUT))
      outcomes.push(result.current.removeNote(1))
      outcomes.push(result.current.addPlan(PLAN_INPUT))
      outcomes.push(result.current.updatePlan(1, PLAN_INPUT))
      outcomes.push(result.current.removePlan(1))
    })
    spy.mockRestore()

    expect(outcomes).toEqual([false, false, null, false, false, undefined])
    expect(errorMessages()).toEqual([
      "Không thể thêm ghi chép. Vui lòng thử lại.",
      "Không thể cập nhật ghi chép. Vui lòng thử lại.",
      "Không thể xoá ghi chép. Vui lòng thử lại.",
      "Không thể thêm kế hoạch. Vui lòng thử lại.",
      "Không thể cập nhật kế hoạch. Vui lòng thử lại.",
      "Không thể xoá kế hoạch. Vui lòng thử lại.",
    ])
    expect(toast.success).not.toHaveBeenCalled()
    expect(getStoredLifePlan()).toEqual(before)
    expect(result.current.notes).toEqual(before.notes)
    expect(result.current.plans).toEqual(before.plans)
  })
})

describe("useLifePlan — dữ liệu do nơi khác ghi", () => {
  it("shows what another tab saved without reloading the page", async () => {
    const { result } = await renderLifePlan()

    // Tab khác ghi thẳng vào localStorage, trình duyệt bắn sự kiện "storage" sang tab này.
    act(() => {
      window.localStorage.setItem(
        LIFE_PLAN_STORAGE_KEY,
        JSON.stringify({ notes: [storedNote({ id: 7, planId: 1 })], plans: [storedPlan({ id: 1 })] })
      )
      window.dispatchEvent(new StorageEvent("storage", { key: LIFE_PLAN_STORAGE_KEY }))
    })

    expect(result.current.notes).toEqual([storedNote({ id: 7, planId: 1 })])
    expect(result.current.plans).toEqual([storedPlan({ id: 1 })])
  })

  it("keeps the note and plan another tab saved when adding here, with fresh ids", async () => {
    const { result } = await renderLifePlan()

    // Ghi thẳng, KHÔNG bắn sự kiện — khoảng hở trước khi hook kịp đọc lại.
    window.localStorage.setItem(
      LIFE_PLAN_STORAGE_KEY,
      JSON.stringify({ notes: [storedNote({ id: 1 })], plans: [storedPlan({ id: 1 })] })
    )
    act(() => {
      result.current.addNote(NOTE_INPUT)
    })
    act(() => {
      result.current.addPlan(PLAN_INPUT)
    })

    expect(getStoredLifePlan().notes.map((n) => n.id)).toEqual([2, 1])
    expect(getStoredLifePlan().plans.map((p) => p.id)).toEqual([1, 2])
  })
})
