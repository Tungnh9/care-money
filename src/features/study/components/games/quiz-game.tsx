"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ob/empty"
import { QUIZ_QUESTION_COUNT } from "../../game-config"
import { pickQuizOptions, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const QUESTION_SECONDS = 10

interface QuizGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

interface QuizQuestion {
  correct: VocabEntry
  options: VocabEntry[]
}

function buildQuestions(vocab: VocabEntry[]): QuizQuestion[] {
  return pickRandomSet(vocab, QUIZ_QUESTION_COUNT).map((correct) => ({
    correct,
    options: pickQuizOptions(vocab, correct, 4),
  }))
}

function QuizGame({ vocab, onFinish }: QuizGameProps) {
  const [questions] = useState(() => buildQuestions(vocab))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS)

  const question = questions[index]

  function advance(gainedPoint: boolean) {
    const nextScore = gainedPoint ? score + 1 : score
    if (index + 1 >= questions.length) {
      onFinish(nextScore)
      return
    }
    setScore(nextScore)
    setIndex(index + 1)
  }

  // 1 setInterval khoá theo "vòng hiện tại" (index câu hỏi) chỉ làm đúng 1 việc: đếm lùi, dùng
  // updater dạng hàm THUẦN (không side effect) để React Strict Mode (bật mặc định khi
  // reactStrictMode không cấu hình trong next.config.ts) có thể double-invoke an toàn lúc dev mà
  // không gọi trùng bất kỳ side effect nào.
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [index])

  // Side effect thật sự (advance câu hỏi khi hết giờ) tách hẳn khỏi updater ở effect trên, đặt
  // trong effect riêng theo dõi secondsLeft — chỉ chạy khi giá trị THẬT SỰ đổi (React bỏ qua
  // lần double-invoke thứ 2 nếu nó trả về cùng giá trị), nên advance()/onFinish không bị gọi 2 lần.
  useEffect(() => {
    if (secondsLeft > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ chạy đúng lúc hết giờ, không phải mỗi lần effect chạy
    setSecondsLeft(QUESTION_SECONDS)
    advance(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  function handleSelect(optionId: string) {
    setSecondsLeft(QUESTION_SECONDS)
    advance(optionId === question.correct.id)
  }

  if (!question) {
    return <Empty pose="sleep" title="Chưa đủ từ vựng để chơi" hint="Cần thêm từ vựng trong ngân hàng từ." />
  }

  return (
    <div>
      <p className="mb-2 text-sm text-[var(--ob-color-text-subtle)]">
        Câu {index + 1}/{questions.length} · còn {secondsLeft}s
      </p>
      <h3 className="mb-4 text-xl font-bold">{question.correct.word}</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {question.options.map((option) => (
          <Button key={option.id} type="button" variant="secondary" onClick={() => handleSelect(option.id)}>
            {option.meaning}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { QuizGame }
