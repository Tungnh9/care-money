import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Confetti } from "@/components/ob/confetti"
import { Monkey } from "@/components/ob/monkey"
import type { JournalEntry } from "../types"

interface JournalSaveSuccessProps {
  entry: JournalEntry
  onWriteMore: () => void
  onViewEntries: () => void
}

function JournalSaveSuccess({ entry, onWriteMore, onViewEntries }: JournalSaveSuccessProps) {
  return (
    <Card tone="soft" className="ob-tada relative col-span-full">
      <Confetti />
      <div className="mb-4 flex items-center gap-[14px]">
        <Monkey pose="cheer" size={62} />
        <div>
          <div className="[font:var(--ob-text-h3)]">Đã lưu vào nhật ký</div>
          <div className="mt-[3px] text-[13.5px] text-[var(--ob-color-text-muted)]">
            {entry.time} · {entry.words} từ
            {entry.mood ? ` · ${entry.mood.emoji} ${entry.mood.label}` : ""}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-[10px]">
        <Button variant="primary" size="sm" type="button" onClick={onWriteMore}>
          Viết thêm một bài
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={onViewEntries}>
          Xem lại bài vừa viết
        </Button>
      </div>
    </Card>
  )
}

export { JournalSaveSuccess }
