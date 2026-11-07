import { describe, it, expect } from "vitest"

import { backupReminder, formatBackupAge, latestBackupAt, type BackupOverview } from "@/lib/backup/backup-reminder"

const TODAY = "2026-11-07"

function view(extra: Partial<BackupOverview>): BackupOverview {
  return { ready: true, empty: false, changed: true, fileAt: null, cloudAt: null, ...extra }
}

// Giữa trưa giờ máy — không lệch ngày dù múi giờ nào.
function daysAgo(days: number): string {
  return new Date(2026, 10, 7 - days, 12, 0).toISOString()
}

describe("backupReminder", () => {
  it("says nothing before storage has been read", () => {
    expect(backupReminder(view({ ready: false, empty: true }), TODAY)).toBeNull()
  })

  it("offers to restore on a device with no data", () => {
    expect(backupReminder(view({ empty: true, fileAt: daysAgo(1) }), TODAY)).toEqual({ kind: "empty" })
  })

  it("asks for a first backup when nothing was ever backed up", () => {
    expect(backupReminder(view({}), TODAY)).toEqual({ kind: "never" })
  })

  it("stays quiet when nothing changed since the last backup, however old", () => {
    expect(backupReminder(view({ changed: false, fileAt: daysAgo(60) }), TODAY)).toBeNull()
  })

  it("stays quiet for 6 days after the newest backup, then reminds from day 7", () => {
    expect(backupReminder(view({ fileAt: daysAgo(6) }), TODAY)).toBeNull()
    expect(backupReminder(view({ fileAt: daysAgo(7) }), TODAY)).toEqual({
      kind: "stale",
      days: 7,
      latestAt: daysAgo(7),
    })
  })

  it("counts from whichever backup is newer, file or cloud", () => {
    expect(backupReminder(view({ fileAt: daysAgo(30), cloudAt: daysAgo(2) }), TODAY)).toBeNull()
    expect(backupReminder(view({ fileAt: daysAgo(9), cloudAt: daysAgo(30) }), TODAY)).toMatchObject({ days: 9 })
  })
})

describe("latestBackupAt", () => {
  it("is the newer of the two, or null", () => {
    expect(latestBackupAt({ fileAt: daysAgo(3), cloudAt: daysAgo(1) })).toBe(daysAgo(1))
    expect(latestBackupAt({ fileAt: null, cloudAt: null })).toBeNull()
  })
})

describe("formatBackupAge", () => {
  it("counts calendar days on this device", () => {
    expect(formatBackupAge(daysAgo(0), TODAY)).toBe("hôm nay")
    expect(formatBackupAge(daysAgo(1), TODAY)).toBe("hôm qua")
    expect(formatBackupAge(daysAgo(12), TODAY)).toBe("12 ngày trước")
    expect(formatBackupAge("not a date", TODAY)).toBe("không rõ lúc nào")
  })
})
