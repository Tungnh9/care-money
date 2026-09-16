"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { pickQuizOptions, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const QUESTION_COUNT = 10
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
  return pickRandomSet(vocab, QUESTION_COUNT).map((correct) => ({
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

  // Mirror của cách Pomodoro (pomodoro.tsx) chạy đồng hồ đếm ngược: 1 setInterval trong effect
  // khoá theo "vòng hiện tại" (ở đây là index câu hỏi), dùng updater dạng hàm để đọc giá trị mới
  // nhất mà không cần đưa secondsLeft vào dependency — effect chỉ tạo lại khi sang câu mới.
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1
        clearInterval(id)
        advance(false)
        return QUESTION_SECONDS
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function handleSelect(optionId: string) {
    setSecondsLeft(QUESTION_SECONDS)
    advance(optionId === question.correct.id)
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
