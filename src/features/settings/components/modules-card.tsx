"use client"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useT } from "@/components/locale-provider"
import type { TranslationKey } from "@/lib/i18n"
import type { ModuleToggle } from "@/lib/settings-storage"

const MODULE_TEXT: Record<string, { label: TranslationKey; hint: TranslationKey }> = {
  taichinh: { label: "settings.modules.taichinh.label", hint: "settings.modules.taichinh.hint" },
  nhatky: { label: "settings.modules.nhatky.label", hint: "settings.modules.nhatky.hint" },
  hoctap: { label: "settings.modules.hoctap.label", hint: "settings.modules.hoctap.hint" },
  muctieu: { label: "settings.modules.muctieu.label", hint: "settings.modules.muctieu.hint" },
  tamtrang: { label: "settings.modules.tamtrang.label", hint: "settings.modules.tamtrang.hint" },
}

interface ModulesCardProps {
  modules: ModuleToggle[]
  onToggle: (index: number) => void
}

function ModulesCard({ modules, onToggle }: ModulesCardProps) {
  const t = useT()

  return (
    <Card label={t("settings.modulesCard.title")} className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        {t("settings.modulesCard.hint")}
      </p>
      <div className="flex flex-col gap-1">
        {modules.map((m, i) => {
          const text = MODULE_TEXT[m.key]
          return (
            <Switch
              key={m.key}
              label={text ? t(text.label) : m.label}
              hint={text ? t(text.hint) : m.hint}
              checked={m.on}
              onCheckedChange={() => onToggle(i)}
            />
          )
        })}
      </div>
    </Card>
  )
}

export { ModulesCard }
