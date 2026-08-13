"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import type { Profile } from "@/lib/settings-storage"

interface ProfileCardProps {
  profile: Profile
  onChange: (profile: Partial<Profile>) => void
}

function ProfileCard({ profile, onChange }: ProfileCardProps) {
  return (
    <Card label="Hồ sơ">
      <div className="mb-[18px] flex items-center gap-[14px]">
        <span className="size-[52px] flex-none rounded-full bg-[var(--ob-vo-200)]" />
        <Button variant="ghost" size="sm" type="button">
          Đổi ảnh
        </Button>
      </div>
      <Field
        label="Tên hiển thị"
        value={profile.displayName}
        onChange={(e) => onChange({ displayName: e.target.value })}
      />
      <div className="h-[14px]" />
      <Field
        label="Lời chào buổi sáng"
        value={profile.greeting}
        onChange={(e) => onChange({ greeting: e.target.value })}
      />
    </Card>
  )
}

export { ProfileCard }
