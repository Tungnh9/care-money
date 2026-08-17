"use client"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import type { ModuleToggle } from "@/lib/settings-storage"

interface ModulesCardProps {
  modules: ModuleToggle[]
  onToggle: (index: number) => void
}

function ModulesCard({ modules, onToggle }: ModulesCardProps) {
  return (
    <Card label="Module hiển thị" className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        Tắt bớt phần bạn không dùng để màn hình chính gọn hơn.
      </p>
      <div className="flex flex-col gap-1">
        {modules.map((m, i) => (
          <Switch
            key={m.key}
            label={m.label}
            hint={m.hint}
            checked={m.on}
            onCheckedChange={() => onToggle(i)}
          />
        ))}
      </div>
    </Card>
  )
}

export { ModulesCard }
