import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"

import { setStoredJournal } from "@/lib/journal/journal-storage"
import { dataFingerprint, setBackupStatus } from "@/lib/backup/backup-status-storage"
import { BackupReminderCard } from "../../components/backup-reminder-card"

const ENTRY = { id: 1, text: "Bài", time: "09:00", date: "07/11", words: 1, mood: null }

describe("BackupReminderCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 10, 7, 9, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("offers to restore on a device with no data, linking to the data card", () => {
    render(<BackupReminderCard />)

    expect(screen.getByText("Máy này chưa có dữ liệu")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Khôi phục dữ liệu" })).toHaveAttribute("href", "/settings#data")
  })

  it("asks for a first backup once there is data that was never backed up", () => {
    setStoredJournal({ entries: [ENTRY] })

    render(<BackupReminderCard />)

    expect(screen.getByText("Dữ liệu chưa được sao lưu")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sao lưu ngay" })).toHaveAttribute("href", "/settings#data")
  })

  it("stays hidden for a recent backup, then counts the days once it is a week old", () => {
    setStoredJournal({ entries: [ENTRY] })
    setBackupStatus({
      fileAt: new Date(2026, 10, 2, 20, 0).toISOString(),
      cloudAt: null,
      fingerprint: "older-data",
      cloudEtag: null,
    })
    const { unmount } = render(<BackupReminderCard />)
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    unmount()

    setBackupStatus({
      fileAt: new Date(2026, 9, 25, 20, 0).toISOString(),
      cloudAt: null,
      fingerprint: "older-data",
      cloudEtag: null,
    })
    render(<BackupReminderCard />)

    expect(screen.getByText("Đã 13 ngày chưa sao lưu")).toBeInTheDocument()
    expect(screen.getByText("Có thay đổi từ bản sao gần nhất (13 ngày trước)", { exact: false })).toBeInTheDocument()
  })

  it("stays hidden when nothing changed since an old backup", () => {
    setStoredJournal({ entries: [ENTRY] })
    setBackupStatus({
      fileAt: new Date(2026, 6, 1).toISOString(),
      cloudAt: null,
      fingerprint: dataFingerprint(),
      cloudEtag: null,
    })

    render(<BackupReminderCard />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("goes away as soon as a backup is made, from any tab", () => {
    setStoredJournal({ entries: [ENTRY] })
    render(<BackupReminderCard />)
    expect(screen.getByText("Dữ liệu chưa được sao lưu")).toBeInTheDocument()

    act(() => {
      setBackupStatus({
        fileAt: new Date().toISOString(),
        cloudAt: null,
        fingerprint: dataFingerprint(),
        cloudEtag: null,
      })
    })

    expect(screen.queryByText("Dữ liệu chưa được sao lưu")).not.toBeInTheDocument()
  })
})
