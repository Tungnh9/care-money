"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Empty } from "@/components/ob/empty"
import { Progress } from "@/components/ui/progress"
import { QUIZ_QUESTION_COUNT } from "../../game-config"
import { pickQuizOptions, pickRandomSet } from "../../game-calculations"
import type { GameMistake, VocabEntry } from "../../types"

const QUESTION_SECONDS = 10

interface QuizGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number, total: number, mistakes: GameMistake[]) => void
  onWordReviewed?: (wordId: string, correct: boolean) => void
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

function QuizGame({ vocab, onFinish, onWordReviewed }: QuizGameProps) {
  const [questions] = useState(() => buildQuestions(vocab))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState<GameMistake[]>([])
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS)

  const question = questions[index]

  function advance(chosen: VocabEntry | null) {
    const gainedPoint = chosen?.id === question.correct.id
    onWordReviewed?.(question.correct.id, gainedPoint)
    const nextScore = gainedPoint ? score + 1 : score
    const nextMistakes = gainedPoint
      ? mistakes
      : [
          ...mistakes,
          { wordId: question.correct.id, word: question.correct.word, correctMeaning: question.correct.meaning, chosenMeaning: chosen?.meaning ?? null },
        ]
    if (index + 1 >= questions.length) {
      onFinish(nextScore, questions.length, nextMistakes)
      return
    }
    setScore(nextScore)
    setMistakes(nextMistakes)
    setIndex(index + 1)
  }

  // 1 setInterval khoá theo "vòng hiện tại" (index câu hỏi) chỉ làm đúng 1 việc: đếm lùi, dùng
  // updater dạng hàm THUẦN (không side effect) để React Strict Mode (bật mặc định khi
  // reactStrictMode không cấu hình trong next.config.ts) có thể double-invoke an toàn lúc dev mà
  // không gọi trùng bất kỳ side effect nào. Không chạy khi hết câu hỏi (vd. thiếu từ vựng) — nếu
  // không, đếm lùi vẫn chạy nền dù màn hình đang hiện "Chưa đủ từ vựng để chơi" và tự gọi
  // onFinish(0) sau 10s dù người chơi chưa từng bấm gì.
  useEffect(() => {
    if (!questions.length) return
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [index, questions.length])

  // Side effect thật sự (advance câu hỏi khi hết giờ) tách hẳn khỏi updater ở effect trên, đặt
  // trong effect riêng theo dõi secondsLeft — chỉ chạy khi giá trị THẬT SỰ đổi (React bỏ qua
  // lần double-invoke thứ 2 nếu nó trả về cùng giá trị), nên advance()/onFinish không bị gọi 2 lần.
  useEffect(() => {
    if (!questions.length || secondsLeft > 0) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chỉ chạy đúng lúc hết giờ, không phải mỗi lần effect chạy
    setSecondsLeft(QUESTION_SECONDS)
    advance(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, questions.length])

  function handleSelect(option: VocabEntry) {
    setSecondsLeft(QUESTION_SECONDS)
    advance(option)
  }

  if (!question) {
    return <Empty pose="sleep" title="Chưa đủ từ vựng để chơi" hint="Cần thêm từ vựng trong ngân hàng từ." />
  }

  return (
    <div>
      <Card label={`Câu ${index + 1}/${questions.length}`} className="mb-4">
        <Progress
          value={(secondsLeft / QUESTION_SECONDS) * 100}
          tone={secondsLeft <= 3 ? "expense" : "action"}
          hint={`còn ${secondsLeft}s`}
        />
        <h3 className="mt-4 text-xl font-bold">{question.correct.word}</h3>
      </Card>
      <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
        {question.options.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant="outline"
            onClick={() => handleSelect(option)}
            className="w-full justify-start rounded-[var(--ob-radius-md)] px-[18px] py-[13px] text-left text-[14.5px] font-semibold"
          >
            {option.meaning}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { QuizGame }
