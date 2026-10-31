import { describe, it, expect } from "vitest"

import {
  buildTimeline,
  imageBytesUsed,
  isPlanOverdue,
  planTargetDay,
  planTimelineDay,
  type TimelineEntry,
} from "@/lib/life-plan/life-plan-calculations"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"

const TODAY = "2026-10-29"

function note(overrides: Partial<LifeNote> & { id: number }): LifeNote {
  return { day: TODAY, title: `Ghi chép ${overrides.id}`, content: "", images: [], ...overrides }
}

function plan(overrides: Partial<LifePlan> & { id: number }): LifePlan {
  return { title: `Kế hoạch ${overrides.id}`, targetYear: 2030, status: "planned", ...overrides }
}

function photo(bytes: number): LifePlanImage {
  return { id: `life-plan/development/${String(bytes).padStart(20, "0")}`, bytes, width: 1600, height: 1200 }
}

// "plan 1" / "note 2" / "today" — đọc thứ tự dòng thời gian trong 1 dòng.
function label(entry: TimelineEntry): string {
  if (entry.kind === "today") return "today"
  return entry.kind === "plan" ? `plan ${entry.plan.id}` : `note ${entry.note.id}`
}

describe("planTargetDay", () => {
  it("puts a plan with only a year on the last day of that year", () => {
    expect(planTargetDay({ targetYear: 2030 })).toBe("2030-12-31")
  })

  it("puts a plan with a month on the last day of that month", () => {
    expect(planTargetDay({ targetYear: 2028, targetMonth: 2 })).toBe("2028-02-29")
    expect(planTargetDay({ targetYear: 2027, targetMonth: 2 })).toBe("2027-02-28")
    expect(planTargetDay({ targetYear: 2027, targetMonth: 4 })).toBe("2027-04-30")
  })
})

describe("planTimelineDay", () => {
  it("places a reached plan on the day it was reached", () => {
    expect(planTimelineDay(plan({ id: 1, status: "done", doneDay: "2026-05-01" }))).toBe("2026-05-01")
  })

  it("places a plan not reached yet, or reached with no day recorded, on its target day", () => {
    expect(planTimelineDay(plan({ id: 1, targetMonth: 3, status: "doing" }))).toBe("2030-03-31")
    expect(planTimelineDay(plan({ id: 2, status: "done" }))).toBe("2030-12-31")
  })
})

describe("isPlanOverdue", () => {
  it("flags a plan not reached yet only once its target day has passed", () => {
    const due = plan({ id: 1, targetYear: 2026, targetMonth: 9, status: "doing" })

    expect(isPlanOverdue(due, "2026-09-30")).toBe(false)
    expect(isPlanOverdue(due, "2026-10-01")).toBe(true)
    expect(isPlanOverdue({ ...due, status: "planned" }, TODAY)).toBe(true)
  })

  it("never flags a reached plan", () => {
    expect(isPlanOverdue(plan({ id: 1, targetYear: 2020, status: "done" }), TODAY)).toBe(false)
  })
})

describe("buildTimeline", () => {
  it("puts the newest first and the Hôm nay marker between what is ahead and what has passed", () => {
    const state = {
      notes: [note({ id: 1, day: TODAY }), note({ id: 2, day: "2026-11-05" }), note({ id: 3, day: "2025-01-01" })],
      plans: [plan({ id: 1, targetYear: 2030 })],
    }

    const timeline = buildTimeline(state, null, TODAY)

    expect(timeline.map((entry) => entry.kind)).toEqual(["plan", "note", "today", "note", "note"])
    expect(timeline.map((entry) => entry.day)).toEqual(["2030-12-31", "2026-11-05", TODAY, TODAY, "2025-01-01"])
    expect(timeline.map(label)).toEqual(["plan 1", "note 2", "today", "note 1", "note 3"])
  })

  it("puts a plan above the notes of the same day, and the larger id first within each kind", () => {
    const state = {
      notes: [note({ id: 1, day: "2030-12-31" }), note({ id: 3, day: "2030-12-31" }), note({ id: 2, day: TODAY })],
      plans: [plan({ id: 1 }), plan({ id: 2 }), plan({ id: 4, status: "done", doneDay: TODAY })],
    }

    expect(buildTimeline(state, null, TODAY).map(label)).toEqual([
      "plan 2",
      "plan 1",
      "note 3",
      "note 1",
      "today",
      "plan 4",
      "note 2",
    ])
  })

  it("puts the marker on top when nothing lies ahead, at the bottom when nothing has passed, and alone when empty", () => {
    const past = { notes: [note({ id: 1, day: "2026-10-28" })], plans: [] }
    const ahead = { notes: [note({ id: 1, day: "2026-10-30" })], plans: [] }

    expect(buildTimeline(past, null, TODAY).map(label)).toEqual(["today", "note 1"])
    expect(buildTimeline(ahead, null, TODAY).map(label)).toEqual(["note 1", "today"])
    expect(buildTimeline({ notes: [], plans: [] }, null, TODAY)).toEqual([{ kind: "today", day: TODAY }])
  })

  it("leaves an overdue plan not reached yet at its own target day, below the marker, not moved up to today", () => {
    const overdue = plan({ id: 1, targetYear: 2026, targetMonth: 9, status: "doing" })
    const entries = buildTimeline({ notes: [note({ id: 2, day: "2026-09-15" })], plans: [overdue] }, null, TODAY)

    expect(isPlanOverdue(overdue, TODAY)).toBe(true)
    expect(entries.map(label)).toEqual(["today", "plan 1", "note 2"])
    expect(entries[1].day).toBe("2026-09-30")
  })

  it("keeps only the chosen plan and the notes attached to it, still with the marker", () => {
    const state = {
      notes: [
        note({ id: 1, planId: 1, day: "2026-10-01" }),
        note({ id: 2, planId: 2 }),
        note({ id: 3 }),
        note({ id: 4, planId: 1, day: "2026-11-01" }),
      ],
      plans: [plan({ id: 1 }), plan({ id: 2 })],
    }

    expect(buildTimeline(state, 1, TODAY).map(label)).toEqual(["plan 1", "note 4", "today", "note 1"])
  })

  it("still shows a note pointing at a plan that no longer exists when not filtering", () => {
    const state = { notes: [note({ id: 1, planId: 99, day: "2026-10-01" })], plans: [plan({ id: 1 })] }

    expect(buildTimeline(state, null, TODAY).map(label)).toEqual(["plan 1", "today", "note 1"])
  })

  it("carries the note and the plan themselves in their entries", () => {
    const attached = note({ id: 1, planId: 1, title: "Đi xem nhà" })
    const target = plan({ id: 1, title: "Mua nhà" })

    expect(buildTimeline({ notes: [attached], plans: [target] }, null, TODAY)).toEqual([
      { kind: "plan", day: "2030-12-31", plan: target },
      { kind: "today", day: TODAY },
      { kind: "note", day: TODAY, note: attached },
    ])
  })
})

describe("imageBytesUsed", () => {
  it("adds up the size of every photo of every note", () => {
    const state = {
      notes: [
        note({ id: 1, images: [photo(120_000), photo(250_500)] }),
        note({ id: 2 }),
        note({ id: 3, images: [photo(80_000)] }),
      ],
      plans: [],
    }

    expect(imageBytesUsed(state)).toBe(450_500)
  })

  it("is zero with no photos at all", () => {
    expect(imageBytesUsed({ notes: [note({ id: 1 })], plans: [] })).toBe(0)
  })
})
