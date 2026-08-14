"use client"

import { useRef, type ChangeEvent } from "react"
import { AlertTriangle, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ExportedInfo, ImportedInfo } from "../hooks/use-data-management"

interface DataCardProps {
  exported: ExportedInfo | null
  imported: ImportedInfo | null
  onExport: () => void
  onImport: (file: File) => void
}

function DataCard({ exported, imported, onExport, onImport }: DataCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onImport(file)
    event.target.value = ""
  }

  return (
    <Card label="Dữ liệu">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Không có tài khoản, không có máy chủ. Nên xuất một bản sao mỗi tháng.
      </p>
      {exported ? (
        <div className="mb-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] bg-[#E7F6EF] px-[15px] py-[13px] text-[#0E7A50]">
          <Check size={18} className="mt-[1px] flex-none" />
          <div className="text-[13.5px] leading-[1.5]">
            <strong className="font-bold">Đã tải {exported.file}</strong>
            <br />
            {exported.size} · {exported.time} · kiểm tra thư mục Tải xuống
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="secondary" size="sm" type="button" onClick={onExport}>
          Xuất file JSON
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => fileRef.current?.click()}>
          Nhập từ file
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
      />
      {imported ? (
        <div
          className="mt-[14px] flex items-start gap-[11px] rounded-[var(--ob-radius-md)] px-[15px] py-[13px] text-[13.5px] leading-[1.5]"
          style={{
            background: imported.ok ? "#E7F6EF" : "#FDEBF2",
            color: imported.ok ? "#0E7A50" : "#B92E63",
          }}
        >
          {imported.ok ? (
            <Check size={17} className="mt-[1px] flex-none" />
          ) : (
            <AlertTriangle size={17} className="mt-[1px] flex-none" />
          )}
          <div>
            {imported.ok ? (
              <>
                <strong className="font-bold">Đã nạp {imported.file}</strong>
                <br />
                {imported.summary}
              </>
            ) : (
              <>
                <strong className="font-bold">Không đọc được file</strong>
                <br />
                {imported.error}
              </>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

export { DataCard }
