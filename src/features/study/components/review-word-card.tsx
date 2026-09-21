"use client"

import { useState } from "react"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/ob/image-with-fallback"
import { SpeakButton } from "@/components/ob/speak-button"
import type { ReviewGrade, VocabEntry } from "../types"

interface ReviewWordCardProps {
  entry: VocabEntry
  onGrade: (wordId: string, grade: ReviewGrade) => void
}

const GRADE_BUTTONS: { grade: ReviewGrade; label: string; variant: "outline" | "primary" | "reward" }[] = [
  { grade: "again", label: "Quên", variant: "outline" },
  { grade: "hard", label: "Khó", variant: "outline" },
  { grade: "good", label: "Nhớ", variant: "primary" },
  { grade: "easy", label: "Dễ", variant: "reward" },
]

function ReviewWordCard({ entry, onGrade }: ReviewWordCardProps) {
  const [revealed, setRevealed] = useState(false)
  const [graded, setGraded] = useState<ReviewGrade | null>(null)

  function handleGrade(grade: ReviewGrade) {
    onGrade(entry.id, grade)
    setGraded(grade)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--ob-radius-md)] border border-[var(--ob-color-border)] bg-[var(--ob-color-surface)]">
      <ImageWithFallback
        // Ảnh cũng ẩn cho tới khi hiện nghĩa — nhiều ảnh minh hoạ gợi ý nghĩa trực tiếp, hiện sớm
        // sẽ làm mất tác dụng của bước tự nhớ trước khi xem đáp án.
        src={revealed ? entry.image : undefined}
        alt={entry.word}
        iconSize={28}
        imageSizes="(max-width: 639px) 45vw, (max-width: 767px) 30vw, (max-width: 1023px) 22vw, 15vw"
      >
        <SpeakButton word={entry.word} size="md" className="absolute top-2 left-2" />
      </ImageWithFallback>
      <div className="flex flex-1 flex-col gap-2 p-[14px]">
        <div className="flex flex-wrap items-baseline gap-[7px]">
          <span className="text-base font-bold">{entry.word}</span>
          {entry.phonetic ? (
            <span className="[font-family:var(--ob-font-num)] text-[12px] text-[var(--ob-color-text-subtle)]">
              {entry.phonetic}
            </span>
          ) : null}
        </div>

        {!revealed ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed(true)}>
            <Eye size={15} />
            Hiện nghĩa
          </Button>
        ) : (
          <>
            <div className="text-sm font-medium">{entry.meaning}</div>
            {entry.example ? (
              <div className="text-[12.5px] leading-[1.5] text-[var(--ob-color-text-subtle)] italic">
                {entry.example}
              </div>
            ) : null}

            {graded ? (
              <p className="mt-1 text-[12.5px] font-bold text-[var(--ob-color-income)]">
                ✓ Đã chấm: {GRADE_BUTTONS.find((g) => g.grade === graded)!.label}
              </p>
            ) : (
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {GRADE_BUTTONS.map(({ grade, label, variant }) => (
                  <Button key={grade} type="button" variant={variant} size="sm" onClick={() => handleGrade(grade)}>
                    {label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { ReviewWordCard }
