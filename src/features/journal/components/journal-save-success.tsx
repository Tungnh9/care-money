"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Confetti } from "@/components/ob/confetti"
import { Monkey } from "@/components/ob/monkey"
import { useT } from "@/components/locale-provider"
import type { JournalEntry } from "../types"

interface JournalSaveSuccessProps {
  entry: JournalEntry
  onWriteMore: () => void
  onViewEntries: () => void
}

function JournalSaveSuccess({ entry, onWriteMore, onViewEntries }: JournalSaveSuccessProps) {
  const t = useT()

  return (
    <Card tone="soft" className="ob-tada relative col-span-full">
      <Confetti />
      <div className="mb-4 flex items-center gap-[14px]">
        <Monkey pose="cheer" size={62} />
        <div>
          <div className="[font:var(--ob-text-h3)]">{t("journal.savedTitle")}</div>
          <div className="mt-[3px] text-[13.5px] text-[var(--ob-color-text-muted)]">
            {entry.time} · {t("overview.journal.wordCount", { count: entry.words })}
            {entry.mood ? ` · ${entry.mood.emoji} ${entry.mood.label}` : ""}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="primary" size="sm" type="button" onClick={onWriteMore}>
          {t("overview.journal.writeMore")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onViewEntries}>
          {t("journal.viewSaved")}
        </Button>
      </div>
    </Card>
  )
}

export { JournalSaveSuccess }
