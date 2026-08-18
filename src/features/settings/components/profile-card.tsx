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
  const [name, setName] = useState(displayName)
  const [saved, setSaved] = useState(false)

  const trimmed = name.trim()
  const disabled = !trimmed || trimmed === displayName

  function handleSave() {
    onSave(trimmed)
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
          setName(e.target.value)
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
