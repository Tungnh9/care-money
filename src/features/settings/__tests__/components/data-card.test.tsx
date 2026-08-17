import { describe, it, expect, vi, beforeEach } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { setSyncSecret } from "@/lib/sync-secret-storage"
import { DataCard } from "../../components/data-card"

const BASE_PROPS = {
  exported: null,
  imported: null,
  syncing: false,
  syncResult: null,
  onExport: vi.fn(),
  onImport: vi.fn(),
  onPushToCloud: vi.fn(),
  onPullFromCloud: vi.fn(),
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
})
