import { describe, it, expect, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { DataCard } from "../../components/data-card"

describe("DataCard", () => {
  it("renders the export and import buttons with no banners by default", () => {
    render(<DataCard exported={null} imported={null} onExport={vi.fn()} onImport={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Xuất file JSON" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nhập từ file" })).toBeInTheDocument()
    expect(screen.queryByText("kiểm tra thư mục Tải xuống", { exact: false })).not.toBeInTheDocument()
  })

  it("calls onExport when the export button is clicked", () => {
    const onExport = vi.fn()
    render(<DataCard exported={null} imported={null} onExport={onExport} onImport={vi.fn()} />)

    fireEvent.click(screen.getByRole("button", { name: "Xuất file JSON" }))

    expect(onExport).toHaveBeenCalled()
  })

  it("shows the exported file info banner", () => {
    render(
      <DataCard
        exported={{ file: "orange-banana-2026-08-14.json", size: "1,2 KB", time: "09:00" }}
        imported={null}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )

    expect(screen.getByText("Đã tải orange-banana-2026-08-14.json")).toBeInTheDocument()
    expect(screen.getByText("1,2 KB · 09:00 · kiểm tra thư mục Tải xuống")).toBeInTheDocument()
  })

  it("calls onImport with the chosen file", () => {
    const onImport = vi.fn()
    render(<DataCard exported={null} imported={null} onExport={vi.fn()} onImport={onImport} />)

    const file = new File(["{}"], "backup.json", { type: "application/json" })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    expect(onImport).toHaveBeenCalledWith(file)
  })

  it("shows a success banner for a valid import and an error banner for an invalid one", () => {
    const { rerender } = render(
      <DataCard
        exported={null}
        imported={{ ok: true, file: "backup.json", summary: "3 bài nhật ký" }}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )
    expect(screen.getByText("Đã nạp backup.json")).toBeInTheDocument()
    expect(screen.getByText("3 bài nhật ký")).toBeInTheDocument()

    rerender(
      <DataCard
        exported={null}
        imported={{ ok: false, error: "File không phải JSON hợp lệ." }}
        onExport={vi.fn()}
        onImport={vi.fn()}
      />
    )
    expect(screen.getByText("Không đọc được file")).toBeInTheDocument()
    expect(screen.getByText("File không phải JSON hợp lệ.")).toBeInTheDocument()
  })
})
