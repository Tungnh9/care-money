import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"

import { DEFAULT_BUDGET_STATE } from "@/lib/budget/budget-storage"
import { DEFAULT_FINANCE_STATE } from "@/lib/finance/finance-storage"
import { DEFAULT_JOURNAL_STATE } from "@/lib/journal/journal-storage"
import { DEFAULT_STUDY_STATE } from "@/lib/study/study-storage"
import { DEFAULT_NET_WORTH_HISTORY } from "@/lib/net-worth/net-worth-history-storage"
import { DEFAULT_SETTINGS } from "@/lib/settings/settings-storage"
import { DEFAULT_WORK_STATE } from "@/lib/work/work-storage"
import { DEFAULT_LIFE_PLAN_STATE } from "@/lib/life-plan/life-plan-storage"
import { clearSyncSecret, setSyncSecret } from "@/lib/sync-secret-storage"
import { setStoredJournal } from "@/lib/journal/journal-storage"
import { dataFingerprint, setBackupStatus } from "@/lib/backup/backup-status-storage"
import type { PendingRestore } from "../../hooks/use-data-management"
import { DataCard } from "../../components/data-card"

const BASE_PROPS = {
  exported: null,
  imported: null,
  syncing: false,
  syncResult: null,
  pendingRestore: null,
  restoreUndo: null,
  pushConflict: null,
  cloudVersions: null,
  onExport: vi.fn(),
  onImport: vi.fn(),
  onPushToCloud: vi.fn(),
  onPullFromCloud: vi.fn(),
  onConfirmRestore: vi.fn(),
  onCancelRestore: vi.fn(),
  onUndoRestore: vi.fn(),
  onCancelPushConflict: vi.fn(),
  onLoadCloudVersions: vi.fn(),
  onCloseCloudVersions: vi.fn(),
  onPullCloudVersion: vi.fn(),
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
    work: DEFAULT_WORK_STATE,
    lifePlan: DEFAULT_LIFE_PLAN_STATE,
  },
  summary: "0 bài nhật ký",
  exportedAt: new Date(2026, 7, 14, 9, 5).toISOString(),
  incomingCounts: "3 bài nhật ký · 0 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
  localCounts: "5 bài nhật ký · 2 khoản chi · 1 quỹ tiết kiệm · 0 lần mua vàng · 0 từ đã học",
  localOnly: null,
  etag: "etag-1",
  old: false,
}

const ONE_ENTRY = { entries: [{ id: 1, text: "Bài", time: "09:00", date: "07/11", words: 1, mood: null }] }

function typeSecret(value = "abc123") {
  fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), { target: { value } })
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

  it("opens with how much browser storage the data uses, above the file backup", () => {
    window.localStorage.setItem("k", "a".repeat(420 * 512 - 1))

    render(<DataCard {...BASE_PROPS} />)

    const usage = screen.getByText(/^Dữ liệu đang dùng/)
    expect(usage).toHaveTextContent("Dữ liệu đang dùng 420 KB / 5 MB")
    expect(usage.compareDocumentPosition(screen.getByText("Sao lưu file"))).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it("calls onExport when the export button is clicked", () => {
    const onExport = vi.fn()
    render(<DataCard {...BASE_PROPS} onExport={onExport} />)

    fireEvent.click(screen.getByRole("button", { name: "Xuất file JSON" }))

    expect(onExport).toHaveBeenCalled()
  })

  it("shows the exported file info banner", () => {
    render(
      <DataCard {...BASE_PROPS} exported={{ file: "orange-banana-2026-08-14.json", size: "1,2 KB", time: "09:00" }} />
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

    rerender(<DataCard {...BASE_PROPS} imported={{ ok: false, error: "File không phải JSON hợp lệ." }} />)
    expect(screen.getByText("Nhập file không thành công")).toBeInTheDocument()
    expect(screen.getByText("File không phải JSON hợp lệ.")).toBeInTheDocument()
  })

  it("heads a write failure with the same import-error heading, not 'could not read the file'", () => {
    const error =
      "Không ghi được dữ liệu vào máy (bộ nhớ trình duyệt có thể đã đầy). Dữ liệu trên máy vẫn giữ nguyên như trước."
    render(<DataCard {...BASE_PROPS} imported={{ ok: false, error }} />)

    expect(screen.getByText("Nhập file không thành công")).toBeInTheDocument()
    expect(screen.getByText(error)).toBeInTheDocument()
    expect(screen.queryByText("Không đọc được file")).not.toBeInTheDocument()
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

  it("keeps Nhập từ file disabled while a cloud sync is running", () => {
    // Một bản đám mây về muộn sẽ thế chỗ bản từ file đang chờ xác nhận ngay dưới hộp thoại.
    const { rerender } = render(<DataCard {...BASE_PROPS} syncing />)
    expect(screen.getByRole("button", { name: "Nhập từ file" })).toBeDisabled()

    rerender(<DataCard {...BASE_PROPS} syncing={false} />)
    expect(screen.getByRole("button", { name: "Nhập từ file" })).toBeEnabled()
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
        pendingRestore={{
          ...PENDING_CLOUD_RESTORE,
          source: "file",
          fileName: "backup.json",
          exportedAt: null,
        }}
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
    expect(onConfirmRestore).toHaveBeenCalledWith(false)
  })

  it("offers to keep what only this device has, listing it, and confirms with keepLocal", () => {
    const onConfirmRestore = vi.fn()
    render(
      <DataCard
        {...BASE_PROPS}
        pendingRestore={{ ...PENDING_CLOUD_RESTORE, localOnly: "2 bài nhật ký · 1 ghi chép Plan" }}
        onConfirmRestore={onConfirmRestore}
      />
    )

    const dialog = screen.getByRole("alertdialog")
    expect(
      within(dialog).getByText("Chỉ có trên máy này, bản sắp nạp không có: 2 bài nhật ký · 1 ghi chép Plan.", {
        exact: false,
      })
    ).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole("button", { name: "Nạp và giữ" }))

    expect(onConfirmRestore).toHaveBeenCalledWith(true)
  })

  it("has no keep option when the incoming copy already holds everything on this device", () => {
    render(<DataCard {...BASE_PROPS} pendingRestore={PENDING_CLOUD_RESTORE} />)

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).queryByRole("button", { name: "Nạp và giữ" })).not.toBeInTheDocument()
    expect(within(dialog).queryByText("Chỉ có trên máy này", { exact: false })).not.toBeInTheDocument()
    expect(within(dialog).getByText("Hoàn tác được ngay sau khi nạp", { exact: false })).toBeInTheDocument()
  })

  it("names an older cloud version as such", () => {
    render(<DataCard {...BASE_PROPS} pendingRestore={{ ...PENDING_CLOUD_RESTORE, etag: null, old: true }} />)

    expect(
      within(screen.getByRole("alertdialog")).getByText("Bản cũ trên đám mây được tạo lúc", { exact: false })
    ).toBeInTheDocument()
  })

  describe("hoàn tác lần nạp", () => {
    it("offers Hoàn tác under the banner of the restore that just finished, and only there", () => {
      const onUndoRestore = vi.fn()
      render(
        <DataCard
          {...BASE_PROPS}
          imported={{ ok: true, file: "backup.json", summary: "3 bài nhật ký" }}
          syncResult={{ ok: true, summary: "Đã tải lên" }}
          restoreUndo={{ source: "file", status: "ready" }}
          onUndoRestore={onUndoRestore}
        />
      )

      const undoButtons = screen.getAllByRole("button", { name: "Hoàn tác" })
      expect(undoButtons).toHaveLength(1)
      expect(screen.getByText("Đã nạp backup.json").parentElement).toContainElement(undoButtons[0])
      expect(screen.getByText("Được tới khi bạn sửa dữ liệu hay rời trang Cài đặt.")).toBeInTheDocument()

      fireEvent.click(undoButtons[0])

      expect(onUndoRestore).toHaveBeenCalledTimes(1)
    })

    it("offers it under the sync banner after a cloud restore", () => {
      render(
        <DataCard
          {...BASE_PROPS}
          syncResult={{ ok: true, summary: "1 bài nhật ký" }}
          restoreUndo={{ source: "cloud", status: "ready" }}
        />
      )

      expect(screen.getByText("Đã đồng bộ").parentElement).toContainElement(
        screen.getByRole("button", { name: "Hoàn tác" })
      )
    })

    it("says the restore was undone once it has been", () => {
      const { rerender } = render(<DataCard {...BASE_PROPS} restoreUndo={{ source: "file", status: "done" }} />)

      expect(screen.getByText("Đã hoàn tác lần nạp")).toBeInTheDocument()
      expect(screen.getByText("Dữ liệu trên máy đã về như trước khi nạp file.")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Hoàn tác" })).not.toBeInTheDocument()

      rerender(<DataCard {...BASE_PROPS} restoreUndo={{ source: "cloud", status: "done" }} />)
      expect(screen.getByText("Đã hoàn tác lần tải xuống")).toBeInTheDocument()
      expect(screen.getByText("Dữ liệu trên máy đã về như trước khi tải xuống.")).toBeInTheDocument()
    })

    it("shows no Hoàn tác once the undo has expired", () => {
      render(<DataCard {...BASE_PROPS} imported={{ ok: true, file: "backup.json", summary: "3 bài nhật ký" }} />)

      expect(screen.getByText("Đã nạp backup.json")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Hoàn tác" })).not.toBeInTheDocument()
    })
  })

  describe("xung đột khi tải lên", () => {
    it("explains that another device uploaded since this one last synced, and offers to download first", () => {
      const onPullFromCloud = vi.fn()
      const onCancelPushConflict = vi.fn()
      render(
        <DataCard
          {...BASE_PROPS}
          pushConflict={{ cloudUploadedAt: new Date(2026, 10, 6, 21, 5).toISOString(), hasBase: true }}
          onPullFromCloud={onPullFromCloud}
          onCancelPushConflict={onCancelPushConflict}
        />
      )
      typeSecret()

      const dialog = screen.getByRole("alertdialog")
      expect(within(dialog).getByText("Máy khác đã tải lên sau lần đồng bộ trước")).toBeInTheDocument()
      expect(within(dialog).getByText("21:05 ngày 06/11/2026")).toBeInTheDocument()

      fireEvent.click(within(dialog).getByRole("button", { name: "Tải xuống trước" }))

      expect(onPullFromCloud).toHaveBeenCalledWith("abc123")
      expect(onCancelPushConflict).toHaveBeenCalled()
    })

    it("says this device never downloaded the cloud copy, and overwrites only on 'Vẫn tải lên'", () => {
      const onPushToCloud = vi.fn()
      render(
        <DataCard
          {...BASE_PROPS}
          pushConflict={{ cloudUploadedAt: null, hasBase: false }}
          onPushToCloud={onPushToCloud}
        />
      )
      typeSecret()

      const dialog = screen.getByRole("alertdialog")
      expect(within(dialog).getByText("Đám mây đang có 1 bản khác")).toBeInTheDocument()
      expect(within(dialog).getByText("máy này chưa tải bản đó xuống lần nào", { exact: false })).toBeInTheDocument()

      fireEvent.click(within(dialog).getByRole("button", { name: "Vẫn tải lên" }))

      expect(onPushToCloud).toHaveBeenCalledWith("abc123", true)
    })
  })

  describe("bản cũ trên đám mây", () => {
    const VERSIONS = [
      { id: "1762437900000", uploadedAt: new Date(2026, 10, 6, 21, 5).toISOString(), size: 245_000 },
      { id: "1762000000000", uploadedAt: new Date(2026, 10, 1, 8, 0).toISOString(), size: 2_400_000 },
    ]

    it("loads the list with the secret, and is disabled until a secret is entered", () => {
      const onLoadCloudVersions = vi.fn()
      render(<DataCard {...BASE_PROPS} onLoadCloudVersions={onLoadCloudVersions} />)

      expect(screen.getByRole("button", { name: "Bản cũ" })).toBeDisabled()
      typeSecret()
      fireEvent.click(screen.getByRole("button", { name: "Bản cũ" }))

      expect(onLoadCloudVersions).toHaveBeenCalledWith("abc123")
    })

    it("lists the versions newest first and restores the chosen one", () => {
      const onPullCloudVersion = vi.fn()
      render(
        <DataCard
          {...BASE_PROPS}
          cloudVersions={{ status: "ready", versions: VERSIONS }}
          onPullCloudVersion={onPullCloudVersion}
        />
      )
      typeSecret()

      const rows = screen.getAllByRole("listitem")
      expect(rows[0]).toHaveTextContent("21:05 ngày 06/11/2026 · 239 KB")
      expect(rows[1]).toHaveTextContent("08:00 ngày 01/11/2026 · 2,3 MB")

      fireEvent.click(within(rows[1]).getByRole("button", { name: "Nạp bản này" }))

      expect(onPullCloudVersion).toHaveBeenCalledWith("abc123", VERSIONS[1])
    })

    it("shows loading, error and empty states, and closes", () => {
      const onCloseCloudVersions = vi.fn()
      const { rerender } = render(<DataCard {...BASE_PROPS} cloudVersions={{ status: "loading" }} />)
      expect(screen.getByText("Đang tải danh sách…")).toBeInTheDocument()

      rerender(<DataCard {...BASE_PROPS} cloudVersions={{ status: "error", error: "Sai secret đồng bộ." }} />)
      expect(screen.getByText("Sai secret đồng bộ.")).toBeInTheDocument()

      rerender(
        <DataCard
          {...BASE_PROPS}
          cloudVersions={{ status: "ready", versions: [] }}
          onCloseCloudVersions={onCloseCloudVersions}
        />
      )
      expect(screen.getByText("Chưa có bản cũ nào", { exact: false })).toBeInTheDocument()

      fireEvent.click(screen.getByRole("button", { name: "Đóng danh sách bản cũ" }))
      expect(onCloseCloudVersions).toHaveBeenCalled()
    })
  })

  describe("sao lưu gần nhất", () => {
    it("says nothing has been backed up yet and that there are unsaved changes", () => {
      setStoredJournal(ONE_ENTRY)

      render(<DataCard {...BASE_PROPS} />)

      expect(screen.getByText(/^Sao lưu gần nhất:/)).toHaveTextContent(
        "Sao lưu gần nhất: file chưa có · đám mây chưa có"
      )
      expect(screen.getByText("Có thay đổi chưa nằm trong bản sao nào.")).toBeInTheDocument()
    })

    it("shows how long ago each backup was and that everything is backed up", () => {
      setStoredJournal(ONE_ENTRY)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setBackupStatus({
        fileAt: new Date().toISOString(),
        cloudAt: yesterday.toISOString(),
        fingerprint: dataFingerprint(),
        cloudEtag: null,
      })

      render(<DataCard {...BASE_PROPS} />)

      expect(screen.getByText(/^Sao lưu gần nhất:/)).toHaveTextContent(
        "Sao lưu gần nhất: file hôm nay · đám mây hôm qua"
      )
      expect(screen.getByText("Mọi thay đổi đã có trong bản sao.")).toBeInTheDocument()
    })

    it("follows a write made after the page opened", () => {
      setStoredJournal(ONE_ENTRY)
      setBackupStatus({
        fileAt: new Date().toISOString(),
        cloudAt: null,
        fingerprint: dataFingerprint(),
        cloudEtag: null,
      })
      render(<DataCard {...BASE_PROPS} />)
      expect(screen.getByText("Mọi thay đổi đã có trong bản sao.")).toBeInTheDocument()

      act(() => {
        setStoredJournal({ entries: [...ONE_ENTRY.entries, { ...ONE_ENTRY.entries[0], id: 2, text: "Bài mới" }] })
      })

      expect(screen.getByText("Có thay đổi chưa nằm trong bản sao nào.")).toBeInTheDocument()
    })

    it("says nothing about changes on a device with no data yet", () => {
      render(<DataCard {...BASE_PROPS} />)

      expect(screen.getByText(/^Sao lưu gần nhất:/)).toBeInTheDocument()
      expect(screen.queryByText("Có thay đổi chưa nằm trong bản sao nào.")).not.toBeInTheDocument()
      expect(screen.queryByText("Mọi thay đổi đã có trong bản sao.")).not.toBeInTheDocument()
    })

    it("is the target of the Overview reminder link", () => {
      render(<DataCard {...BASE_PROPS} />)

      expect(document.getElementById("data")).toContainElement(screen.getByRole("button", { name: "Xuất file JSON" }))
    })
  })

  it("shows no confirm dialog while nothing is waiting to be restored", () => {
    render(<DataCard {...BASE_PROPS} />)

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("empties the secret field when the saved secret is removed from this device", () => {
    setSyncSecret("saved-secret")
    render(<DataCard {...BASE_PROPS} />)
    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("saved-secret")

    act(() => {
      clearSyncSecret()
    })

    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("")
    expect(screen.getByRole("button", { name: "Tải xuống" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Copy secret" })).toBeDisabled()
  })

  it("empties a secret typed on this page when another tab logs out and removes it", () => {
    render(<DataCard {...BASE_PROPS} />)
    fireEvent.change(screen.getByLabelText("Secret đồng bộ", { exact: false }), {
      target: { value: "typed-secret" },
    })

    act(() => {
      window.localStorage.removeItem("sync-secret")
      window.dispatchEvent(new StorageEvent("storage", { key: "sync-secret" }))
    })

    expect(screen.getByLabelText("Secret đồng bộ", { exact: false })).toHaveValue("")
  })
})
