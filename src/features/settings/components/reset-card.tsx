"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useT } from "@/components/locale-provider"

interface ResetCardProps {
  counts: string[]
  onWipe: () => void
  onExport: () => void
}

function ResetCard({ counts, onWipe, onExport }: ResetCardProps) {
  const t = useT()
  const [step, setStep] = useState<0 | 1 | 2>(0)

  if (step === 2) {
    return (
      <Card label={t("settings.reset.title")} className="min-w-0 flex-[1_1_300px]">
        <div className="flex items-start gap-[11px]">
          <span className="flex size-[38px] flex-none items-center justify-center">
            <Image src="/assets/icons/check.svg" width={36} height={36} alt="" />
          </span>
          <div className="text-[13.5px] leading-[1.6] text-[var(--ob-color-text-muted)]">
            <strong className="font-bold text-[var(--ob-color-text)]">
              {t("settings.reset.wipedTitle")}
            </strong>
            <br />
            {t("settings.reset.wipedBody")}
          </div>
        </div>
      </Card>
    )
  }

  if (step === 1) {
    return (
      <Card label={t("settings.reset.title")} className="min-w-0 flex-[1_1_300px]">
        <div className="mb-4 flex items-start gap-[11px] rounded-[var(--ob-radius-md)] bg-[#FDEBF2] px-[15px] py-[13px] text-[#B92E63]">
          <AlertTriangle size={18} className="mt-[1px] flex-none" />
          <div className="text-[13.5px] leading-[1.5]">
            {counts.length ? (
              <>
                {t("settings.reset.confirmPrefix")}
                <strong className="font-bold">{counts.join(", ")}</strong>
                {t("settings.reset.confirmSuffix")}
              </>
            ) : (
              t("settings.reset.confirmEmpty")
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-[10px]">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="!border-[var(--ob-color-expense)] !text-[var(--ob-color-expense)]"
            onClick={() => {
              onWipe()
              setStep(2)
            }}
          >
            {t("settings.reset.deleteForever")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => {
              setStep(0)
              onExport()
            }}
          >
            {t("settings.reset.exportFirst")}
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={() => setStep(0)}>
            {t("common.cancel")}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card label={t("settings.reset.title")} className="min-w-0 flex-[1_1_300px]">
      <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ob-color-text-muted)]">
        {t("settings.reset.hint")}
      </p>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        className="!border-[var(--ob-color-expense)] !text-[var(--ob-color-expense)]"
        onClick={() => setStep(1)}
      >
        {t("settings.reset.deleteAll")}
      </Button>
    </Card>
  )
}

export { ResetCard }
