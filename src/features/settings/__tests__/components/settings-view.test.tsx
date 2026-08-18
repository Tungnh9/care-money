import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { setStoredJournal } from "@/features/journal/journal-storage"
import { setStoredFinance, DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { getStoredSettings } from "@/lib/settings-storage"
import { EXPORT_VERSION } from "../../data-transfer"
import { SettingsView } from "../../components/settings-view"

describe("SettingsView", () => {
  beforeEach(() => {
    window.localStorage.clear()
    URL.createObjectURL = vi.fn(() => "blob:mock")
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
  })

  it("renders every settings card", async () => {
    render(<SettingsView />)

    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())
    expect(screen.getByText("Tâm trạng dùng trong nhật ký")).toBeInTheDocument()
    expect(screen.getByText("Module hiển thị")).toBeInTheDocument()
    expect(screen.getByText("Dữ liệu")).toBeInTheDocument()
    expect(screen.getByText("Bắt đầu lại")).toBeInTheDocument()
  })

  it("exports a JSON backup and shows the file info banner", async () => {
    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "Xuất file JSON" }))

    expect(await screen.findByText("kiểm tra thư mục Tải xuống", { exact: false })).toBeInTheDocument()
  })

  it("shows the real content counts before wiping, then clears storage and shows the done state", async () => {
    setStoredJournal({ entries: [{ id: 1, text: "Bài 1", time: "09:00", date: "13/08", words: 2, mood: null }] })
    setStoredFinance({ ...DEFAULT_FINANCE_STATE, savings: [{ name: "Quỹ A", amount: 1, target: 2 }] })

    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: "Xoá toàn bộ dữ liệu" }))

    expect(screen.getByText("1 bài nhật ký", { exact: false })).toBeInTheDocument()
    expect(screen.getByText("1 quỹ tiết kiệm", { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Xoá vĩnh viễn" }))

    expect(screen.getByText("Đã xoá sạch.")).toBeInTheDocument()
  })

  it("wraps the settings cards in the ob-card-grid entrance animation class", async () => {
    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    const grid = screen.getByText("Module hiển thị").closest("section")?.parentElement
    expect(grid).toHaveClass("ob-card-grid")
  })

  it("restores settings from an imported backup and shows the success banner", async () => {
    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    const payload = {
      version: EXPORT_VERSION,
      settings: {
        profile: { displayName: "Khôi phục", greeting: "Chào buổi sáng, Khôi phục" },
        budget: { amount: "10.000.000", cycleStart: "1" },
        moods: [],
        modules: [],
      },
    }
    const file = new File([JSON.stringify(payload)], "backup.json", { type: "application/json" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText("Đã nạp backup.json", { exact: false })).toBeInTheDocument()
  })

  it("saves a new display name, keeping the greeting prefix and persisting both to localStorage", async () => {
    render(<SettingsView />)
    await waitFor(() => expect(screen.getByText("Module hiển thị")).toBeInTheDocument())

    const originalGreeting = getStoredSettings().profile.greeting

    fireEvent.change(screen.getByLabelText("Tên hiển thị", { exact: false }), {
      target: { value: "Tùng mới" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }))

    expect(getStoredSettings().profile.displayName).toBe("Tùng mới")
    expect(getStoredSettings().profile.greeting).toBe(
      originalGreeting.replace("Tungnh2k1", "Tùng mới")
    )
    expect(screen.getByLabelText("Tên hiển thị", { exact: false })).toHaveValue("Tùng mới")
  })
})
