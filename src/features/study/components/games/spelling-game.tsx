"use client"

import { useEffect, useRef, useState } from "react"
import { Heart } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { cn } from "@/lib/utils"
import { speakWord } from "@/lib/speak"
import { TINT_PALETTE } from "@/lib/settings-storage"
import { SPELLING_WORD_COUNT } from "../../game-config"
import { isTypableWord, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const MAX_LIVES = 5
const FALL_DURATION_MS = 15000 // thời gian 1 từ rơi từ đỉnh xuống đáy khu chơi
const SPAWN_GAP_MS = 2200 // khoảng cách tối thiểu giữa 2 lần xuất hiện từ mới
const MAX_CONCURRENT_WORDS = 3 // tối đa bao nhiêu từ cùng rơi 1 lúc
const TICK_MS = 50
const DANGER_PROGRESS = 0.8 // rơi quá 80% quãng đường thì cảnh báo sắp mất mạng

interface SpellingGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number, total: number) => void
  onWordReviewed?: (wordId: string, correct: boolean) => void
}

interface QueuedWord {
  entry: VocabEntry
  xPercent: number
}

interface FallingWord extends QueuedWord {
  id: number
  startedAt: number
}

interface RoundState {
  fallingWords: FallingWord[]
  queueIndex: number
  lastSpawnAt: number
  lives: number
  destroyed: number
  missed: number
  // Các entry.id vừa rơi hết giờ ở tick gần nhất — 1 effect riêng đọc rồi báo onWordReviewed,
  // KHÔNG gọi trực tiếp trong updater setRound (tránh double-invoke dưới Strict Mode).
  lastMissedIds: string[]
}

function initialRound(): RoundState {
  return { fallingWords: [], queueIndex: 0, lastSpawnAt: -SPAWN_GAP_MS, lives: MAX_LIVES, destroyed: 0, missed: 0, lastMissedIds: [] }
}

function SpellingGame({ vocab, onFinish, onWordReviewed }: SpellingGameProps) {
  // Vị trí ngang (xPercent) rút ngẫu nhiên 1 lần duy nhất lúc khởi tạo, qua lazy initializer của
  // useState — đây là chỗ duy nhất được phép gọi hàm impure (Math.random) trong component, React
  // đảm bảo chỉ chạy đúng 1 lần bất kể re-render.
  const [queue] = useState<QueuedWord[]>(() =>
    pickRandomSet(vocab.filter(isTypableWord), SPELLING_WORD_COUNT).map((entry) => ({
      entry,
      xPercent: 8 + Math.random() * 84,
    }))
  )
  const [round, setRound] = useState<RoundState>(initialRound)
  const [nowMs, setNowMs] = useState(0)
  const [typed, setTyped] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const finishedRef = useRef(false)

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  // 1 vòng lặp duy nhất (setInterval, không phải requestAnimationFrame — tab chuyển nền vẫn chạy
  // tới đích, giống quy ước đã dùng ở useCountUp/count-money.tsx) cập nhật đồng thời: thời gian
  // trôi qua, từ nào rơi chạm đáy (trừ mạng), và có nên bắn thêm từ mới hay không — gộp vào 1
  // updater để tránh 2 effect riêng đọc/ghi cùng 1 state theo thứ tự khó đoán.
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      if (finishedRef.current) return
      const elapsed = Date.now() - start
      setNowMs(elapsed)
      setRound((prev) => {
        const missedNow = prev.fallingWords.filter((w) => elapsed - w.startedAt >= FALL_DURATION_MS)
        const canSpawn =
          prev.queueIndex < queue.length &&
          prev.fallingWords.length < MAX_CONCURRENT_WORDS &&
          elapsed - prev.lastSpawnAt >= SPAWN_GAP_MS

        // Không có từ nào rơi hết giờ và cũng chưa tới lúc bắn từ mới — trả nguyên `prev` (cùng
        // reference) thay vì dựng object/mảng mới mỗi 50ms, để các effect/tính toán phụ thuộc
        // round.fallingWords (vd. effect xoá buffer gõ dở) không chạy lại một cách vô ích.
        if (!missedNow.length && !canSpawn) return prev

        let fallingWords = missedNow.length ? prev.fallingWords.filter((w) => !missedNow.includes(w)) : prev.fallingWords
        let queueIndex = prev.queueIndex
        let lastSpawnAt = prev.lastSpawnAt

        if (canSpawn) {
          fallingWords = [...fallingWords, { ...queue[queueIndex], id: queueIndex, startedAt: elapsed }]
          lastSpawnAt = elapsed
          queueIndex += 1
        }

        if (!missedNow.length) return { ...prev, fallingWords, queueIndex, lastSpawnAt }

        return {
          ...prev,
          fallingWords,
          queueIndex,
          lastSpawnAt,
          lives: Math.max(0, prev.lives - missedNow.length),
          destroyed: prev.destroyed,
          missed: prev.missed + missedNow.length,
          lastMissedIds: [...prev.lastMissedIds, ...missedNow.map((w) => w.entry.id)],
        }
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [queue])

  // Side effect thật sự (báo SRS từ nào vừa bị rơi/quên) tách hẳn khỏi updater ở effect trên,
  // đặt trong effect riêng theo dõi round.lastMissedIds — đúng pattern đã dùng cho onFinish bên
  // dưới (effect riêng phản ứng với state kết quả, không side-effect ngay trong updater).
  // onWordReviewed CỐ Ý không nằm trong deps: StudyView truyền 1 arrow function inline (tạo mới
  // mỗi lần StudyView re-render vì lý do bất kỳ, không chỉ vì SpellingGame) — nếu liệt kê đủ,
  // effect sẽ chạy lại và báo lại đúng các id cũ mỗi khi component cha re-render, gây chấm điểm
  // trùng. Closure vẫn luôn dùng đúng onWordReviewed mới nhất tại thời điểm lastMissedIds đổi.
  useEffect(() => {
    if (round.lastMissedIds.length > 0) {
      round.lastMissedIds.forEach((id) => onWordReviewed?.(id, false))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đặt setState ở đây để xoá danh sách vừa báo, tránh báo lại khi component cha re-render
      setRound((prev) => ({
        ...prev,
        lastMissedIds: [],
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.lastMissedIds])

  // Từ đang gõ dở bị rơi mất (chạm đáy) trước khi gõ xong — buffer đang gõ không còn khớp từ
  // nào trên màn nữa thì xoá, tránh giữ lại 1 chuỗi không còn ý nghĩa gì.
  useEffect(() => {
    if (typed && !round.fallingWords.some((w) => w.entry.word.toLowerCase().startsWith(typed))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ chạy đúng lúc buffer hết khớp, không phải mỗi lần effect chạy
      setTyped("")
    }
  }, [round.fallingWords, typed])

  useEffect(() => {
    // queue.length === 0 (không đủ từ vựng) không tính là "hết vòng" — nếu không, biểu thức dưới
    // đây (0 + 0 >= 0) đúng ngay từ lần render đầu và gọi onFinish(0) trước khi người chơi kịp
    // thấy màn hình rỗng bên dưới.
    if (finishedRef.current || !queue.length) return
    const roundOver = round.lives <= 0 || round.destroyed + round.missed >= queue.length
    if (!roundOver) return
    finishedRef.current = true
    onFinish(round.destroyed, queue.length)
  }, [round, queue.length, onFinish])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Backspace") {
      e.preventDefault() // vùng gõ là <div>, không phải <input> — trình duyệt có thể hiểu Backspace là "quay lại trang trước"
      setTyped((t) => t.slice(0, -1))
      return
    }
    if (e.key.length !== 1) return // bỏ qua phím điều khiển (Shift, Enter, mũi tên, Tab...)
    e.preventDefault() // chặn hành vi mặc định của phím ký tự đơn — quan trọng nhất là Space, vốn cuộn trang khi focus không nằm trên ô nhập liệu thật

    const next = (typed + e.key).toLowerCase()
    const stillPossible = round.fallingWords.some((w) => w.entry.word.toLowerCase().startsWith(next))
    if (!stillPossible) return // gõ sai — bỏ qua ký tự, không cho vào buffer

    const exact = round.fallingWords.find((w) => w.entry.word.toLowerCase() === next)
    if (exact) {
      setRound((prev) => ({
        ...prev,
        fallingWords: prev.fallingWords.filter((w) => w.id !== exact.id),
        destroyed: prev.destroyed + 1,
      }))
      setTyped("")
      speakWord(exact.entry.word)
      onWordReviewed?.(exact.entry.id, true)
      return
    }

    setTyped(next)
  }

  if (!queue.length) {
    return <Empty pose="sleep" title="Chưa đủ từ vựng để chơi" hint="Cần thêm từ vựng trong ngân hàng từ." />
  }

  const resolved = round.destroyed + round.missed

  return (
    <div>
      <Card label={`Từ ${resolved}/${queue.length}`} className="mb-4">
        <div className="flex items-center justify-end">
          <div className="flex flex-none gap-1" data-testid="lives">
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Heart
                key={i}
                size={18}
                data-testid={i < round.lives ? "heart-full" : "heart-empty"}
                className={
                  i < round.lives
                    ? "fill-[var(--ob-color-expense)] text-[var(--ob-color-expense)]"
                    : "text-[var(--ob-color-border)]"
                }
              />
            ))}
          </div>
        </div>
      </Card>

      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Khu vực gõ từ đang rơi"
        onKeyDown={handleKeyDown}
        onClick={() => containerRef.current?.focus()}
        className="relative h-[460px] overflow-hidden rounded-[var(--ob-radius-lg)] border-[1.5px] border-[var(--ob-color-border)] bg-[var(--ob-color-surface-sunken)] outline-none focus-visible:border-[var(--ob-color-focus)]"
      >
        {round.fallingWords.map((word) => {
          const progress = Math.min(1, (nowMs - word.startedAt) / FALL_DURATION_MS)
          const isMatching = typed.length > 0 && word.entry.word.toLowerCase().startsWith(typed)
          const isDanger = progress >= DANGER_PROGRESS
          const typedLen = isMatching ? typed.length : 0
          const tint = TINT_PALETTE[word.id % TINT_PALETTE.length]
          return (
            <span
              key={word.id}
              data-testid="falling-word"
              style={{
                left: `${word.xPercent}%`,
                top: `${progress * 95}%`,
                backgroundColor: isDanger ? undefined : tint,
              }}
              className={cn(
                "absolute -translate-x-1/2 rounded-[var(--ob-radius-sm)] border-[1.5px] px-2.5 py-1 [font-family:var(--ob-font-num)] text-sm font-bold shadow-[var(--ob-shadow-sm)] transition-colors duration-[var(--ob-dur-base)]",
                isDanger
                  ? "border-[var(--ob-color-expense)] bg-[var(--ob-color-expense-soft)]"
                  : isMatching
                    ? "border-[var(--ob-color-action)]"
                    : "border-[var(--ob-color-border)]"
              )}
            >
              <span className="text-[var(--ob-color-action)]">{word.entry.word.slice(0, typedLen)}</span>
              <span className="text-[var(--ob-color-text)]">{word.entry.word.slice(typedLen)}</span>
            </span>
          )
        })}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--ob-color-expense)]/12 to-transparent" />
        <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[12px] text-[var(--ob-color-text-subtle)]">
          {typed ? `Đang gõ: ${typed}` : "Gõ từ tiếng Anh đang rơi..."}
        </p>
      </div>
    </div>
  )
}

export { SpellingGame }
