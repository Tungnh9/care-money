import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import { DEFAULT_BUDGET_STATE } from "@/features/budget/budget-storage"
import { DEFAULT_FINANCE_STATE } from "@/features/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/features/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/features/study/study-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/features/overview/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings-storage"
import { setSyncSecret } from "@/lib/sync-secret-storage"
import type { PendingRestore } from "../../hooks/use-data-management"
import { setAutoBackupStatus } from "../../auto-backup-storage"
import { DataCard } from "../../components/data-card"

const BASE_PROPS = {
  exported: null,
  imported: null,
  syncing: false,
  syncResult: null,
  pendingRestore: null,
  onExport: vi.fn(),
  onImport: vi.fn(),
  onPushToCloud: vi.fn(),
  onPullFromCloud: vi.fn(),
  onConfirmRestore: vi.fn(),
  onCancelRestore: vi.fn(),
}

const PENDING_CLOUD_RESTORE: PendingRestore = {
  source: "cloud",
  data: {
    journal: DEFAULT_JOURNAL_STATE,
    finance: DEFAULT_FINANCE_STATE,
    study: DEFAULT_STUDY_STATE,
    settings: DEFAULT_SETTINGS,
    budget: DEFAULT_BUDGET_STATE,
    netWorthHistory: DEFAULT_NET_WORTH_HISTORY,
  },
  summary: "0 bài nhật ký",
  exportedAt: new Date(2026, 7, 14, 9, 5).toISOString(),
  incomingCounts: "3 bài nhật ký · 0 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
  localCounts: "5 bài nhật ký · 2 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
}

describe("DataCard", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders the export and import buttons with no banners by default", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByRole("button", { name: "Xuất file JSON" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nhập từ file" })).toBeInTheDocument()
    expect(screen.queryByText("kiểm tra thư mục Tải xuống", { exact: false })).not.toBeInTheDocument()
  })

  it("calls onExport when the export button is clicked", () => {
    const onExport = vi.fn()
    render(<DataCard {...BASE_PROPS} onExport={onExport} />)

    fireEvent.click(screen.getByRole("button", { name: "Xuất file JSON" }))

    expect(onExport).toHaveBeenCalled()
  })

  it("shows the exported file info banner", () => {
    render(
      <DataCard
        {...BASE_PROPS}
        exported={{ file: "orange-banana-2026-08-14.json", size: "1,2 KB", time: "09:00" }}
      />
    )

    expect(screen.getByText("Đã tải orange-banana-2026-08-14.json")).toBeInTheDocument()
    expect(screen.getByText("1,2 KB · 09:00 · kiểm tra thư mục Tải xuống")).toBeInTheDocument()
  })

  it("calls onImport with the chosen file", () => {
    const onImport = vi.fn()
    render(<DataCard {...BASE_PROPS} onImport={onImport} />)

    const file = new File(["{}"], "backup.json", { type: "application/json" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    expect(onImport).toHaveBeenCalledWith(file)
  })

  it("shows a success banner for a valid import and an error banner for an invalid one", () => {
    const { rerender } = render(
      <DataCard {...BASE_PROPS} imported={{ ok: true, file: "backup.json", summary: "3 bài nhật ký" }} />
    )
    expect(screen.getByText("Đã nạp backup.json")).toBeInTheDocument()
    expect(screen.getByText("3 bài nhật ký")).toBeInTheDocument()

    rerender(
      <DataCard {...BASE_PROPS} imported={{ ok: false, error: "File không phải JSON hợp lệ." }} />
    )
    expect(screen.getByText("Không đọc được file")).toBeInTheDocument()
    expect(screen.getByText("File không phải JSON hợp lệ.")).toBeInTheDocument()
  })

  it("disables the sync buttons until a secret is entered, then calls onPushToCloud/onPullFromCloud with it", () => {
    const onPushToCloud = vi.fn()
    const onPullFromCloud = vi.fn()
    render(<DataCard {...BASE_PROPS} onPushToCloud={onPushToCloud} onPullFromCloud={onPullFromCloud} />)

    expect(screen.getByRole("button", { name: "Tải lên" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Tải xuống" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), {
      target: { value: "abc123" },
    })

    expect(screen.getByRole("button", { name: "Tải lên" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Tải lên" }))
    expect(onPushToCloud).toHaveBeenCalledWith("abc123")

    fireEvent.click(screen.getByRole("button", { name: "Tải xuống" }))
    expect(onPullFromCloud).toHaveBeenCalledWith("abc123")
  })

  it("preloads a secret already saved on this device and persists edits", () => {
    setSyncSecret("saved-secret")
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("saved-secret")

    fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), {
      target: { value: "new-secret" },
    })

    expect(window.localStorage.getItem("sync-secret")).toBe("new-secret")
  })

  it("shows 'Đang đồng bộ…' and disables both buttons while syncing", () => {
    render(<DataCard {...BASE_PROPS} syncing />)

    fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), {
      target: { value: "abc123" },
    })

    const syncButtons = screen.getAllByRole("button", { name: "Đang đồng bộ…" })
    expect(syncButtons).toHaveLength(2)
    syncButtons.forEach((button) => expect(button).toBeDisabled())
  })

  it("copies the current secret to the clipboard and shows a brief confirmation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    setSyncSecret("saved-secret")
    render(<DataCard {...BASE_PROPS} />)

    fireEvent.click(screen.getByRole("button", { name: "Copy secret" }))

    expect(writeText).toHaveBeenCalledWith("saved-secret")
    expect(await screen.findByRole("button", { name: "Đã copy" })).toBeInTheDocument()
  })

  it("disables the copy button when there is no secret to copy", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByRole("button", { name: "Copy secret" })).toBeDisabled()
  })

  it("shows a success banner for a completed sync and an error banner for a failed one", () => {
    const { rerender } = render(<DataCard {...BASE_PROPS} syncResult={{ ok: true, summary: "Đã tải lên" }} />)
    expect(screen.getByText("Đã đồng bộ")).toBeInTheDocument()
    expect(screen.getByText("Đã tải lên")).toBeInTheDocument()

    rerender(<DataCard {...BASE_PROPS} syncResult={{ ok: false, error: "Sai secret đồng bộ." }} />)
    expect(screen.getByText("Đồng bộ không thành công")).toBeInTheDocument()
    expect(screen.getByText("Sai secret đồng bộ.")).toBeInTheDocument()
  })

  it("shows auto-backup as temporarily disabled when no secret is configured", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByText("tạm ngưng", { exact: false })).toBeInTheDocument()
  })

  it("shows auto-backup as temporarily disabled even when a secret is configured", () => {
    // Tự động tải lên đang tạm ngưng bất kể có secret hay không — tránh 2 máy âm thầm ghi đè
    // dữ liệu của nhau (chỉ tự động tải lên, không tự động tải xuống hay gộp dữ liệu).
    setSyncSecret("abc123")
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByText("tạm ngưng", { exact: false })).toBeInTheDocument()
  })

  it("still surfaces the last real auto-backup time and error for context, even while disabled", () => {
    setSyncSecret("abc123")
    setAutoBackupStatus({ lastSyncedAt: "2026-08-14T09:05:00.000Z", lastError: "Sai secret đồng bộ." })
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.getByText("Lần tự động gần nhất", { exact: false })).toBeInTheDocument()
    expect(screen.getByText("Lần gần nhất lỗi: Sai secret đồng bộ.")).toBeInTheDocument()
  })

  it("asks before replacing this device's data, showing when the incoming copy was made and both sets of counts", () => {
    render(<DataCard {...BASE_PROPS} pendingRestore={PENDING_CLOUD_RESTORE} />)

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("Thay dữ liệu trên máy này?")).toBeInTheDocument()
    expect(within(dialog).getByText("Bản trên đám mây được tạo lúc", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("09:05 ngày 14/08/2026")).toBeInTheDocument()
    expect(within(dialog).getByText("Bản sắp nạp: 3 bài nhật ký", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("Trên máy này: 5 bài nhật ký", { exact: false })).toBeInTheDocument()
  })

  it("names the file and says the time is unknown when a hand-made backup has no exportedAt", () => {
    render(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={{ ...PENDING_CLOUD_RESTORE, source: "file", fileName: "backup.json", exportedAt: null }}
      />
    )

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText("File backup.json được tạo lúc", { exact: false })).toBeInTheDocument()
    expect(within(dialog).getByText("không rõ thời điểm")).toBeInTheDocument()
  })

  it("calls onConfirmRestore from 'Thay dữ liệu' and onCancelRestore from 'Huỷ'", () => {
    const onConfirmRestore = vi.fn()
    const onCancelRestore = vi.fn()
    const { rerender } = render(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={PENDING_CLOUD_RESTORE}
        onConfirmRestore={onConfirmRestore}
        onCancelRestore={onCancelRestore}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Huỷ" }))
    expect(onCancelRestore).toHaveBeenCalledTimes(1)
    expect(onConfirmRestore).not.toHaveBeenCalled()

    rerender(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={{ ...PENDING_CLOUD_RESTORE }}
        onConfirmRestore={onConfirmRestore}
        onCancelRestore={onCancelRestore}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Thay dữ liệu" }))
    expect(onConfirmRestore).toHaveBeenCalledTimes(1)
  })

  it("shows no confirm dialog while nothing is waiting to be restored", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })
})
