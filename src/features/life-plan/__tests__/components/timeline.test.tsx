import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { getCachedImage } from "@/lib/life-plan/image-cache"
import { buildTimeline } from "@/lib/life-plan/life-plan-calculations"
import type { LifeNote, LifePlan, LifePlanImage } from "@/lib/life-plan/types"
import { Timeline } from "../../components/timeline"

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

const TODAY = "2026-10-29"

function note(overrides: Partial<LifeNote> & { id: number }): LifeNote {
  return { day: "2026-10-01", title: `Ghi chép ${overrides.id}`, content: "", images: [], ...overrides }
}

function plan(overrides: Partial<LifePlan> & { id: number }): LifePlan {
  return { title: `Kế hoạch ${overrides.id}`, targetYear: 2030, status: "planned", ...overrides }
}

function cloudPhoto(n: number): LifePlanImage {
  return { id: `life-plan/development/${String(n).padStart(20, "0")}`, bytes: 1000, width: 1600, height: 1200 }
}

function renderTimeline(notes: LifeNote[], plans: LifePlan[]) {
  const handlers = {
    onEditNote: vi.fn(),
    onDeleteNote: vi.fn(),
    onEditPlan: vi.fn(),
    onDeletePlan: vi.fn(),
    onOpenImage: vi.fn(),
  }
  render(<Timeline entries={buildTimeline({ notes, plans }, null, TODAY)} plans={plans} today={TODAY} {...handlers} />)
  return handlers
}

function items(): HTMLElement[] {
  return within(screen.getByRole("list", { name: "Dòng thời gian" })).getAllByRole("listitem")
}

beforeEach(() => {
  vi.resetAllMocks()
  // Ảnh không có trên máy — lưới chỉ hiện ô chờ, đủ để bấm.
  vi.mocked(getCachedImage).mockReturnValue(new Promise(() => {}))
})

describe("Timeline", () => {
  it("writes a plan's target as a month or a year, and the day a reached plan was reached", () => {
    renderTimeline(
      [],
      [
        plan({ id: 1, title: "Mua nhà", targetYear: 2030, targetMonth: 6 }),
        plan({ id: 2, title: "Mua xe", targetYear: 2028 }),
        plan({ id: 3, title: "Học bơi", targetYear: 2027, status: "done", doneDay: "2026-05-01" }),
      ]
    )

    const [house, car, , swim] = items()
    expect(house).toHaveTextContent("Mua nhà")
    expect(house).toHaveTextContent("tháng 06/2030")
    expect(within(house).getByText("Dự định")).toBeInTheDocument()
    expect(car).toHaveTextContent("năm 2028")
    expect(swim).toHaveTextContent("Học bơi")
    expect(within(swim).getByText("Đã đạt")).toBeInTheDocument()
    expect(swim).toHaveTextContent("01/05/2026")
  })

  it("shows the Hôm nay line with today's date", () => {
    renderTimeline([note({ id: 1 })], [])

    expect(items()[0]).toHaveTextContent("Hôm nay")
    expect(items()[0]).toHaveTextContent("29/10/2026")
  })

  it("counts 20 notes and plans per batch, not the Hôm nay line, and folds back with Thu gọn", () => {
    const notes = Array.from({ length: 45 }, (_, i) => note({ id: i + 1, day: `2026-0${(i % 9) + 1}-10` }))
    renderTimeline(notes, [])

    expect(items()).toHaveLength(21)
    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))
    expect(items()).toHaveLength(41)
    fireEvent.click(screen.getByRole("button", { name: "Xem thêm" }))
    expect(items()).toHaveLength(46)
    fireEvent.click(screen.getByRole("button", { name: "Thu gọn" }))
    expect(items()).toHaveLength(21)
  })

  it("has no Xem thêm when everything fits in one batch", () => {
    renderTimeline(
      Array.from({ length: 20 }, (_, i) => note({ id: i + 1 })),
      []
    )

    expect(items()).toHaveLength(21)
    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument()
  })

  it("hands the note or plan to the Sửa and Xoá buttons, and the photo's place to its thumbnail", () => {
    const visit = note({ id: 1, day: "2026-10-20", title: "Đà Lạt", images: [cloudPhoto(1), cloudPhoto(2)] })
    const house = plan({ id: 5, title: "Mua nhà" })
    const handlers = renderTimeline([visit], [house])

    fireEvent.click(screen.getByRole("button", { name: 'Sửa ghi chép "Đà Lạt" ngày 20/10/2026' }))
    fireEvent.click(screen.getByRole("button", { name: 'Xoá ghi chép "Đà Lạt" ngày 20/10/2026' }))
    fireEvent.click(screen.getByRole("button", { name: 'Sửa kế hoạch "Mua nhà"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Xoá kế hoạch "Mua nhà"' }))
    fireEvent.click(screen.getByRole("button", { name: 'Xem ảnh 2 của ghi chép "Đà Lạt"' }))

    expect(handlers.onEditNote).toHaveBeenCalledWith(visit)
    expect(handlers.onDeleteNote).toHaveBeenCalledWith(visit)
    expect(handlers.onEditPlan).toHaveBeenCalledWith(house)
    expect(handlers.onDeletePlan).toHaveBeenCalledWith(house)
    expect(handlers.onOpenImage).toHaveBeenCalledWith(visit, 1)
  })

  it("shows a note linked to a plan that is gone as linked to nothing", () => {
    renderTimeline([note({ id: 1, title: "Mồ côi", planId: 9 })], [plan({ id: 1, title: "Mua nhà" })])

    const orphan = screen.getByText("Mồ côi").closest("li") as HTMLElement
    expect(within(orphan).queryByText("Mua nhà")).not.toBeInTheDocument()
  })
})
