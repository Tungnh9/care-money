"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field } from "@/components/ui/field"

interface ProfileCardProps {
  displayName: string
  onSave: (name: string) => void
}

function ProfileCard({ displayName, onSave }: ProfileCardProps) {
  // null = người dùng chưa gõ gì → ô luôn hiện đúng tên đang lưu, kể cả khi tên đổi sau lúc mount
  // (store settings hydrate xong sau lượt render đầu, nhập file, tải xuống, tab khác đổi tên).
  // Chỉ khi đang gõ dở mới giữ bản nháp, để 1 lần nạp lại dữ liệu không xoá chữ đang gõ.
  const [draft, setDraft] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const name = draft ?? displayName
  const trimmed = name.trim()
  const disabled = !trimmed || trimmed === displayName

  function handleSave() {
    onSave(trimmed)
    setDraft(null)
    setSaved(true)
  }

  return (
    <Card label="Hồ sơ" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Tên hiển thị dùng ở sidebar và lời chào Tổng quan.
      </p>
      <Field
        label="Tên hiển thị"
        value={name}
        onChange={(e) => {
          setDraft(e.target.value)
          setSaved(false)
        }}
      />
      <div className="mt-[14px] flex items-center gap-[10px]">
        <Button variant="secondary" size="sm" type="button" disabled={disabled} onClick={handleSave}>
          Lưu
        </Button>
        {saved ? (
          <span className="flex items-center gap-1 text-[13px] text-[#0E7A50]">
            <Check size={15} /> Đã lưu
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { ProfileCard }
