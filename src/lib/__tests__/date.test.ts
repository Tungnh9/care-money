import { describe, it, expect } from "vitest"

import {
  dayKey,
  dayKeyFromIso,
  daysBetween,
  daysInMonth,
  formatDayKey,
  formatDayKeyWithYear,
  formatMonthKey,
  formatShortDate,
  isMonthKey,
  monthKey,
  monthKeyFromDayKey,
  parseDayInput,
  monthsFrom,
  monthsThroughYearEnd,
  shiftDay,
  shiftMonth,
} from "../date"

describe("dayKey", () => {
  it("formats as yyyy-mm-dd with zero-padded month and day", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05")
    expect(dayKey(new Date(2026, 10, 20))).toBe("2026-11-20")
  })
})

describe("dayKeyFromIso", () => {
  it("returns the local day of the instant, not its UTC date", () => {
    expect(dayKeyFromIso(new Date(2026, 9, 1, 0, 30).toISOString())).toBe("2026-10-01")
    expect(dayKeyFromIso(new Date(2026, 8, 30, 23, 30).toISOString())).toBe("2026-09-30")
  })

  it("returns null for an empty or unreadable string", () => {
    expect(dayKeyFromIso("")).toBeNull()
    expect(dayKeyFromIso("not a date")).toBeNull()
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

describe("isMonthKey", () => {
  it("accepts a yyyy-mm key", () => {
    expect(isMonthKey("2026-09")).toBe(true)
  })

  it("rejects an empty string, an unpadded month and a month outside 01–12", () => {
    expect(isMonthKey("")).toBe(false)
    expect(isMonthKey("2026-9")).toBe(false)
    expect(isMonthKey("2026-13")).toBe(false)
    expect(isMonthKey("2026-00")).toBe(false)
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

describe("shiftDay", () => {
  it("moves forward and backward within the same month", () => {
    expect(shiftDay("2026-09-15", 1)).toBe("2026-09-16")
    expect(shiftDay("2026-09-15", -1)).toBe("2026-09-14")
  })

  it("rolls over across a month boundary backward", () => {
    expect(shiftDay("2026-09-01", -1)).toBe("2026-08-31")
  })

  it("rolls over across a year boundary backward", () => {
    expect(shiftDay("2026-01-01", -1)).toBe("2025-12-31")
  })
})

describe("formatDayKeyWithYear", () => {
  it("formats a yyyy-mm-dd key as weekday + zero-padded dd/mm/yyyy", () => {
    // 2026-09-01 là Thứ Ba
    expect(formatDayKeyWithYear("2026-09-01")).toBe("Thứ Ba, 01/09/2026")
    // 2028-01-05 là Thứ Tư
    expect(formatDayKeyWithYear("2028-01-05")).toBe("Thứ Tư, 05/01/2028")
  })
})

describe("daysInMonth", () => {
  it("returns 30 for a 30-day month", () => {
    expect(daysInMonth("2026-04")).toBe(30)
  })

  it("returns 31 for a 31-day month", () => {
    expect(daysInMonth("2026-08")).toBe(31)
  })

  it("returns 28 for February in a non-leap year", () => {
    expect(daysInMonth("2026-02")).toBe(28)
  })

  it("returns 29 for February in a leap year", () => {
    expect(daysInMonth("2028-02")).toBe(29)
  })
})

describe("daysBetween", () => {
  it("returns 0 for the same day", () => {
    expect(daysBetween("2026-09-01", "2026-09-01")).toBe(0)
  })

  it("counts days forward within the same month", () => {
    expect(daysBetween("2026-09-01", "2026-09-15")).toBe(14)
  })

  it("counts days across a month boundary", () => {
    expect(daysBetween("2026-09-20", "2026-10-05")).toBe(15)
  })

  it("returns a negative count when `to` is before `from`", () => {
    expect(daysBetween("2026-09-15", "2026-09-01")).toBe(-14)
  })
})

describe("formatShortDate", () => {
  const now = new Date(2026, 8, 30, 9, 0)

  it("shows dd/mm for a date in the same year as now", () => {
    expect(formatShortDate(new Date(2026, 8, 29, 8, 30), now)).toBe("29/09")
    expect(formatShortDate(new Date(2026, 0, 5), now)).toBe("05/01")
  })

  it("adds the year for a date in another year", () => {
    expect(formatShortDate(new Date(2025, 8, 29, 8, 30), now)).toBe("29/09/2025")
    expect(formatShortDate(new Date(2027, 0, 5), now)).toBe("05/01/2027")
  })
})

describe("parseDayInput", () => {
  it("reads dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy and yyyy-mm-dd into a dayKey", () => {
    expect(parseDayInput("13/10/2026")).toBe("2026-10-13")
    expect(parseDayInput("3/1/2026")).toBe("2026-01-03")
    expect(parseDayInput("03-01-2026")).toBe("2026-01-03")
    expect(parseDayInput("03.01.2026")).toBe("2026-01-03")
    expect(parseDayInput("2026-01-03")).toBe("2026-01-03")
    expect(parseDayInput("  13/10/2026  ")).toBe("2026-10-13")
  })

  it("rejects dates that do not exist, mixed separators and other text", () => {
    expect(parseDayInput("31/04/2026")).toBeNull()
    expect(parseDayInput("29/02/2026")).toBeNull()
    expect(parseDayInput("13/10-2026")).toBeNull()
    expect(parseDayInput("13/10")).toBeNull()
    expect(parseDayInput("01/01/0999")).toBeNull()
    expect(parseDayInput("hôm nay")).toBeNull()
    expect(parseDayInput("")).toBeNull()
  })

  it("accepts 29/02 in a leap year", () => {
    expect(parseDayInput("29/02/2028")).toBe("2028-02-29")
  })
})
