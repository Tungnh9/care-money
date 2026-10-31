import { describe, it, expect, beforeEach } from "vitest"

import {
  LIFE_PLAN_STORAGE_KEY,
  getStoredLifePlan,
  parseLifePlanState,
  setStoredLifePlan,
} from "@/lib/life-plan/life-plan-storage"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"

const PHOTO: LifePlanImage = {
  id: "life-plan/production/a1b2c3d4e5f6g7h8i9j0",
  bytes: 245_000,
  width: 1600,
  height: 1200,
}
const PHOTO_2: LifePlanImage = {
  id: "life-plan/production/k1l2m3n4o5p6q7r8s9t0",
  bytes: 180_500,
  width: 1200,
  height: 1600,
}

// Đọc trả về bản đã qua schema (field lạ bị bỏ) — field nào thiếu khỏi schema sẽ âm thầm rụng ở lần ghi kế tiếp.
// Required<...>: thêm 1 field vào kiểu thì fixture này buộc phải đổi theo.
const PLAN: Required<LifePlan> = {
  id: 3,
  title: "Mua nhà",
  targetYear: 2030,
  targetMonth: 6,
  status: "done",
  doneDay: "2026-05-01",
  note: "Căn 2 phòng ngủ",
}

const NOTE: Required<LifeNote> = {
  id: 1,
  day: "2026-10-29",
  title: "Đi xem nhà",
  content: "Xem 2 căn ở Cầu Giấy.\nCăn thứ hai sáng hơn.",
  images: [PHOTO, PHOTO_2],
  planId: 3,
}

function store(value: unknown) {
  window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, JSON.stringify(value))
}

describe("getStoredLifePlan", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("keeps every field of a note with two photos and of a plan through a stored round trip", () => {
    setStoredLifePlan({ notes: [NOTE], plans: [PLAN] })

    expect(getStoredLifePlan()).toEqual({ notes: [NOTE], plans: [PLAN] })
  })

  it("drops only the note without a title, keeping its siblings", () => {
    const untitled = { id: 2, day: "2026-10-28", content: "Quên đặt tiêu đề", images: [] }
    store({ notes: [untitled, NOTE], plans: [PLAN] })

    expect(getStoredLifePlan().notes).toEqual([NOTE])
  })

  it("drops only the photo without bytes, keeping the note and its other photo", () => {
    const noBytes = { id: PHOTO.id, width: PHOTO.width, height: PHOTO.height }
    store({ notes: [{ ...NOTE, images: [noBytes, PHOTO_2] }], plans: [PLAN] })

    expect(getStoredLifePlan().notes).toEqual([{ ...NOTE, images: [PHOTO_2] }])
  })

  it("keeps the text of a note whose photo list is missing or not a list, with no photos", () => {
    const { id, day, title, content } = NOTE
    store({
      notes: [
        { id, day, title, content },
        { id: 2, day, title, content, images: "hỏng" },
      ],
      plans: [],
    })

    expect(getStoredLifePlan().notes).toEqual([
      { id, day, title, content, images: [] },
      { id: 2, day, title, content, images: [] },
    ])
  })

  it("drops only the note whose day is not a real yyyy-mm-dd day", () => {
    const other = { ...NOTE, id: 4 }
    store({ notes: [{ ...NOTE, day: "2026-02-30" }, { ...NOTE, id: 2, day: "29/10/2026" }, other], plans: [PLAN] })

    expect(getStoredLifePlan().notes).toEqual([other])
  })

  it("drops only the plan whose target year is out of range", () => {
    store({
      notes: [],
      plans: [
        { ...PLAN, id: 4, targetYear: 999 },
        { ...PLAN, id: 5, targetYear: 10000 },
        { ...PLAN, id: 6, targetYear: 2030.5 },
        PLAN,
      ],
    })

    expect(getStoredLifePlan().plans).toEqual([PLAN])
  })

  it("keeps a plan and its notes when an optional field is broken, reading that field as absent", () => {
    // Bản sao sửa tay: tháng ngoài 1–12 hay null, ngày đạt sai dạng, ghi chú không phải chữ. Bỏ cả kế hoạch thì mọi
    // ghi chép gắn vào nó cũng bị bỏ gắn — không lấy lại được.
    const { title, targetYear, status } = PLAN
    store({
      notes: [NOTE],
      plans: [
        { ...PLAN, targetMonth: 13 },
        { ...PLAN, id: 4, targetMonth: null, doneDay: "01/05/2026", note: 42 },
      ],
    })

    expect(getStoredLifePlan()).toEqual({
      notes: [NOTE],
      plans: [
        { ...PLAN, targetMonth: undefined },
        { id: 4, title, targetYear, status },
      ],
    })
  })

  it("unlinks a note from a plan that is no longer there, so a later plan cannot take it over", () => {
    // Kế hoạch 4 hỏng (trạng thái lạ) nên bị bỏ khi đọc — ghi chép trỏ tới nó thành không gắn.
    store({ notes: [NOTE, { ...NOTE, id: 2, planId: 4 }], plans: [PLAN, { ...PLAN, id: 4, status: "doing!" }] })

    expect(getStoredLifePlan().notes).toEqual([
      NOTE,
      { id: 2, day: NOTE.day, title: NOTE.title, content: NOTE.content, images: NOTE.images },
    ])
  })

  it("keeps a note whose plan link is not a number, reading it as linked to no plan", () => {
    // NaN đi qua JSON thành null; bản sao sửa tay có thể mang chuỗi. Chữ của ghi chép không được mất vì 1 mã kế hoạch.
    const { id, day, title, content, images } = NOTE
    store({
      notes: [
        { ...NOTE, planId: null },
        { ...NOTE, id: 2, planId: "3" },
      ],
      plans: [PLAN],
    })

    const notes = getStoredLifePlan().notes
    expect(notes).toEqual([
      { id, day, title, content, images },
      { id: 2, day, title, content, images },
    ])
    expect(notes.some((note) => "planId" in note)).toBe(false)
  })

  it("reads an empty life plan when nothing is stored, the JSON is broken or the stored value is null", () => {
    expect(getStoredLifePlan()).toEqual({ notes: [], plans: [] })

    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, "{not valid json")
    expect(getStoredLifePlan()).toEqual({ notes: [], plans: [] })

    window.localStorage.setItem(LIFE_PLAN_STORAGE_KEY, "null")
    expect(getStoredLifePlan()).toEqual({ notes: [], plans: [] })
  })
})

describe("parseLifePlanState", () => {
  it("reads an empty life plan from a backup made before the page existed, or from anything not an object", () => {
    expect(parseLifePlanState(undefined)).toEqual({ notes: [], plans: [] })
    expect(parseLifePlanState(null)).toEqual({ notes: [], plans: [] })
    expect(parseLifePlanState("x")).toEqual({ notes: [], plans: [] })
  })

  it("reads a list that is not an array as empty, keeping the other list", () => {
    expect(parseLifePlanState({ notes: "hỏng", plans: [PLAN] })).toEqual({ notes: [], plans: [PLAN] })
  })
})
