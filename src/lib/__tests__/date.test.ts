import { describe, it, expect } from "vitest"

import {
  dayKey,
  formatDayKey,
  formatMonthKey,
  monthKey,
  monthKeyFromDayKey,
  monthsFrom,
  monthsThroughYearEnd,
  shiftMonth,
} from "../date"

describe("dayKey", () => {
  it("formats as yyyy-mm-dd with zero-padded month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20")
  })
})

describe("monthKey", () => {
  it("formats as yyyy-mm with zero-padded month", () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01")
    expect(monthKey(new Date(2026, 10, 20))).toBe("2026-11")
  })
})

describe("formatDayKey", () => {
  it("formats a yyyy-mm-dd key as weekday + zero-padded dd/mm", () => {
    // 2026-09-01 là Thứ Ba
    expect(formatDayKey("2026-09-01")).toBe("Thứ Ba, 01/09")
    // 2026-01-05 là Thứ Hai
    expect(formatDayKey("2026-01-05")).toBe("Thứ Hai, 05/01")
  })
})

describe("monthsFrom", () => {
  it("generates the given count of consecutive month keys starting at the given month", () => {
    expect(monthsFrom("2026-10", 3)).toEqual(["2026-10", "2026-11", "2026-12"])
  })

  it("rolls over into the next year", () => {
    expect(monthsFrom("2026-11", 4)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"])
  })

  it("returns just the start month when count is 1", () => {
    expect(monthsFrom("2026-10", 1)).toEqual(["2026-10"])
  })
})

describe("monthKeyFromDayKey", () => {
  it("derives the yyyy-mm prefix from a yyyy-mm-dd day key", () => {
    expect(monthKeyFromDayKey("2026-01-05")).toBe("2026-01")
    expect(monthKeyFromDayKey("2026-11-20")).toBe("2026-11")
  })
})

describe("shiftMonth", () => {
  it("moves forward and backward within the same year", () => {
    expect(shiftMonth("2026-09", 1)).toBe("2026-10")
    expect(shiftMonth("2026-09", -1)).toBe("2026-08")
  })

  it("rolls over across a year boundary in both directions", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
  })
})

describe("formatMonthKey", () => {
  it("formats a yyyy-mm key as 'Tháng M, YYYY'", () => {
    expect(formatMonthKey("2026-09")).toBe("Tháng 9, 2026")
    expect(formatMonthKey("2026-01")).toBe("Tháng 1, 2026")
  })
})

describe("monthsThroughYearEnd", () => {
  it("generates every month from the given month through December of the same year", () => {
    expect(monthsThroughYearEnd("2026-09")).toEqual(["2026-09", "2026-10", "2026-11", "2026-12"])
  })

  it("returns all 12 months when starting in January", () => {
    expect(monthsThroughYearEnd("2026-01")).toHaveLength(12)
    expect(monthsThroughYearEnd("2026-01")[11]).toBe("2026-12")
  })

  it("returns just December itself when starting in December", () => {
    expect(monthsThroughYearEnd("2026-12")).toEqual(["2026-12"])
  })
})
