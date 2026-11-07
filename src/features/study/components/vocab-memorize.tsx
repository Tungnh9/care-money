"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react"
import { preload } from "react-dom"
import { getImageProps } from "next/image"
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ImageWithFallback } from "@/components/ob/image-with-fallback"
import { SpeakButton } from "@/components/ob/speak-button"
import { speakWord } from "@/lib/speak"
import { cn } from "@/lib/utils"
import type { VocabEntry } from "@/lib/study/types"
import { gradeAnswer } from "../memorize-answer"

// idle: chưa chấm (hay đang gõ lại sau lần sai); correct/revealed là chốt — ô nhập khoá, chỉ "Làm lại" mới xoá.
type AnswerStatus = "idle" | "correct" | "wrong" | "revealed"

interface Answer {
  text: string
  status: AnswerStatus
  // Đúng nhờ 1 từ khác cùng nghĩa (gõ famous ở thẻ popular): báo "Cũng đúng" kèm từ của chính thẻ này.
  synonym: boolean
}

const EMPTY_ANSWER: Answer = { text: "", status: "idle", synonym: false }
// Hàng Trước/Xác nhận/Sau: thu chữ "Trước"/"Sau" về chỉ còn mũi tên khi thẻ hẹp hơn 270px (điện thoại ~340px trở
// xuống), không thì 3 nút không co được (whitespace-nowrap) lòi ra khỏi thẻ, kéo cả trang cuộn ngang.
const NAV_LABEL = "sr-only @min-[270px]:not-sr-only"
// Cùng chuỗi sizes với ảnh đang hiện — ảnh tải trước mới đúng là ảnh trình duyệt sẽ dùng.
const IMAGE_SIZES = "(max-width: 639px) 90vw, 460px"

function isLocked(status: AnswerStatus | undefined): boolean {
  return status === "correct" || status === "revealed"
}

// Bấm nút không lấy focus khỏi ô nhập: bàn phím điện thoại không tắt, Enter vẫn chạy tiếp ở từ sau.
function keepInputFocus(event: MouseEvent) {
  event.preventDefault()
}

interface VocabMemorizeProps {
  // Các từ đang xem: 1 chủ đề, đã lọc theo cấp, đúng thứ tự trên lưới.
  words: VocabEntry[]
  // Cả kho từ: tìm từ khác cùng nghĩa tiếng Việt (xem gradeAnswer).
  pool: VocabEntry[]
}

// Chế độ Ghi nhớ của 1 chủ đề: lần lượt từng từ hiện ảnh + nghĩa tiếng Việt, gõ lại từ tiếng Anh rồi "Xác nhận" để
// chấm (cách chấm: memorize-answer.ts). "Trước"/"Sau" đi lại giữa các từ; chữ đã gõ và kết quả từng từ giữ trong
// lượt này — không lưu, không tính vào "Đã học" hay lịch ôn; tắt chế độ hay đổi cấp là bắt đầu lượt mới.
function VocabMemorize({ words, pool }: VocabMemorizeProps) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)

  const currentStatus = words[index] ? answers[words[index].id]?.status : undefined
  const lockedCount = words.filter((word) => isLocked(answers[word.id]?.status)).length

  // Vào chế độ: kéo cả bài vào khung nhìn (chừa thanh trên/dưới cố định của bản điện thoại).
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "nearest" })
  }, [])

  // Vào chế độ và mỗi lần đổi từ: con trỏ vào ô nhập để gõ ngay. Không để trình duyệt tự cuộn tới ô — nó đưa ô vào
  // giữa màn, cắt mất ảnh.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [index])

  // Đổi từ, vừa chấm, vừa xong lượt: dải Trước/Xác nhận/Sau phải còn trong khung nhìn ("nearest": đang thấy thì thôi).
  useEffect(() => {
    controlsRef.current?.scrollIntoView({ block: "nearest" })
  }, [index, currentStatus, lockedCount])

  if (!words.length) {
    return <p className="text-[13.5px] text-[var(--ob-color-text-muted)]">Chưa có từ nào để ghi nhớ.</p>
  }

  const entry = words[index]
  const answer = answers[entry.id] ?? EMPTY_ANSWER
  const locked = isLocked(answer.status)
  const correctCount = words.filter((word) => answers[word.id]?.status === "correct").length
  // Vị trí các từ chưa xong (chưa đúng, chưa xem đáp án) — để Enter và lời nhắc cuối lượt đưa về đúng chỗ.
  const open = words.flatMap((word, i) => (isLocked(answers[word.id]?.status) ? [] : [i]))
  const finished = open.length === 0
  const isLast = index === words.length - 1
  const skipped = isLast ? open.find((i) => i !== index) : undefined

  // Tải trước ảnh của 2 từ kề bên — bấm "Sau"/"Trước" không thấy khung ảnh trống.
  for (const near of [words[index + 1], words[index - 1]]) {
    if (!near?.image) continue
    const { props } = getImageProps({ src: near.image, alt: "", fill: true, sizes: IMAGE_SIZES })
    preload(props.src, { as: "image", imageSrcSet: props.srcSet, imageSizes: props.sizes })
  }

  function setAnswer(next: Answer) {
    setAnswers((prev) => ({ ...prev, [entry.id]: next }))
  }

  function focusInput() {
    inputRef.current?.focus({ preventScroll: true })
  }

  function confirm() {
    if (locked || !answer.text.trim()) return
    const grade = gradeAnswer(answer.text, entry, pool)
    setAnswer({ ...answer, status: grade ? "correct" : "wrong", synonym: grade === "synonym" })
    if (grade) speakWord(entry.word)
    focusInput()
  }

  function reveal() {
    setAnswer({ ...answer, status: "revealed" })
    focusInput()
  }

  function goTo(next: number) {
    setIndex(Math.min(Math.max(next, 0), words.length - 1))
  }

  function restart() {
    setAnswers({})
    setIndex(0)
    focusInput()
  }

  // Enter: chấm từ đang gõ; từ đã chốt thì sang từ chưa xong kế tiếp (hết thì vòng lại từ đầu).
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return
    event.preventDefault()
    if (!locked) {
      confirm()
      return
    }
    const next = open.find((i) => i > index) ?? open[0]
    if (next !== undefined) goTo(next)
  }

  return (
    <div ref={rootRef} className="mx-auto flex w-full max-w-[460px] scroll-mt-[72px] scroll-mb-[96px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-[var(--ob-color-text-muted)] tabular-nums">
          {`Từ ${index + 1}/${words.length} · Đúng ${correctCount}`}
        </span>
        <Button variant="ghost" size="sm" type="button" onClick={restart} disabled={!Object.keys(answers).length}>
          <RotateCcw size={15} />
          Làm lại
        </Button>
      </div>

      {/* alt là nghĩa tiếng Việt — đọc từ tiếng Anh ra là lộ đáp án. Cao tối đa 35% màn hình: ảnh 4:3 đủ rộng sẽ đẩy
          ô nhập và các nút xuống dưới mép màn. */}
      <ImageWithFallback
        key={entry.id}
        src={entry.image}
        alt={`Ảnh minh hoạ: ${entry.meaning}`}
        iconSize={40}
        imageSizes={IMAGE_SIZES}
        className="max-h-[35svh] overflow-hidden rounded-[var(--ob-radius-md)]"
      />
      <div className="text-center">
        <p className="text-[20px] leading-[1.35] font-bold">{entry.meaning}</p>
        {entry.pos ? <p className="mt-1 text-[12.5px] text-[var(--ob-color-text-subtle)]">{entry.pos}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="text"
        aria-label={`Từ tiếng Anh của "${entry.meaning}"`}
        placeholder="Gõ từ tiếng Anh..."
        value={answer.text}
        readOnly={locked}
        onChange={(event) => setAnswer({ ...answer, text: event.target.value, status: "idle", synonym: false })}
        onKeyDown={handleKeyDown}
        // Tắt tự hoàn thành/tự viết hoa/tự sửa của bàn phím — phải tự nhớ đúng từng chữ.
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        // text-base (16px): iPhone tự phóng to cả trang khi focus 1 ô nhập có chữ nhỏ hơn 16px. Viền báo đúng/sai
        // không bị viền focus đè (ô gần như luôn có focus) — viền focus chỉ khi đang gõ.
        className={cn(
          "h-11 w-full rounded-[var(--ob-radius-md)] border-[1.5px] bg-[var(--ob-color-surface)] px-3 text-center [font-family:var(--ob-font-num)] text-base font-bold text-[var(--ob-color-text)] outline-none placeholder:font-normal placeholder:text-[var(--ob-color-text-subtle)]",
          answer.status === "correct"
            ? "border-[var(--ob-color-income)]"
            : answer.status === "wrong"
              ? "border-[var(--ob-color-expense)]"
              : answer.status === "revealed"
                ? "border-[var(--ob-color-border)]"
                : "border-[var(--ob-color-border)] focus:border-[var(--ob-color-focus)]"
        )}
      />

      {/* Kết quả, lời nhắc từ còn sót và lời báo xong lượt nằm chung 1 vùng đọc to cho trình đọc màn hình. */}
      <div role="status" aria-live="polite" className="flex min-h-[44px] flex-col gap-3 text-center text-[13.5px]">
        {locked ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {answer.status === "correct" ? (
              <span className="inline-flex items-center gap-1 font-bold text-[var(--ob-color-income)]">
                <Check size={16} />
                {answer.synonym ? "Cũng đúng! Từ của thẻ này là" : "Chính xác!"}
              </span>
            ) : (
              <span className="font-semibold text-[var(--ob-color-text-muted)]">Đáp án:</span>
            )}
            <span className="font-bold">{entry.word}</span>
            {entry.phonetic ? (
              <span className="[font-family:var(--ob-font-num)] text-[12px] text-[var(--ob-color-text-subtle)]">
                {entry.phonetic}
              </span>
            ) : null}
            <SpeakButton word={entry.word} size="sm" />
          </div>
        ) : (
          // "Xem đáp án" luôn có khi từ chưa chốt — gặp từ chưa biết (hay gặp ở B2/C1) thì không phải gõ bừa 1 lần
          // cho sai mới được xem.
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            {answer.status === "wrong" ? (
              <span className="inline-flex items-center gap-1 font-bold text-[var(--ob-color-expense)]">
                <X size={16} />
                Chưa đúng, thử lại nhé
              </span>
            ) : null}
            <button
              type="button"
              onMouseDown={keepInputFocus}
              onClick={reveal}
              className={cn(
                "min-h-[var(--ob-hit-min)] px-2 underline-offset-2 hover:underline",
                answer.status === "wrong"
                  ? "font-semibold text-[var(--ob-color-action-strong)]"
                  : "text-[var(--ob-color-text-subtle)]"
              )}
            >
              Xem đáp án
            </button>
          </div>
        )}

        {finished ? (
          <p className="rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] px-3 py-2 font-semibold text-[var(--ob-color-action-strong)]">
            {`Xong cả ${words.length} từ — đúng ${correctCount}/${words.length}. Bấm "Làm lại" để ôn lượt mới.`}
          </p>
        ) : skipped !== undefined ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 rounded-[var(--ob-radius-md)] bg-[var(--ob-color-action-soft)] px-3 py-1 font-semibold text-[var(--ob-color-action-strong)]">
            <span>{`Còn ${open.length} từ chưa xong.`}</span>
            <button
              type="button"
              onMouseDown={keepInputFocus}
              onClick={() => goTo(skipped)}
              className="min-h-[var(--ob-hit-min)] px-2 underline underline-offset-2"
            >
              Làm tiếp
            </button>
          </div>
        ) : null}
      </div>

      <div ref={controlsRef} className="flex scroll-mb-[96px] items-center justify-between gap-2 md:scroll-mb-6">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="min-w-[var(--ob-hit-min)] px-3"
          onMouseDown={keepInputFocus}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeft size={16} />
          <span className={NAV_LABEL}>Trước</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="button"
          className="px-3"
          onMouseDown={keepInputFocus}
          onClick={confirm}
          disabled={locked || !answer.text.trim()}
        >
          Xác nhận
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          className="min-w-[var(--ob-hit-min)] px-3"
          onMouseDown={keepInputFocus}
          onClick={() => goTo(index + 1)}
          disabled={isLast}
        >
          <span className={NAV_LABEL}>Sau</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}

export { VocabMemorize }
