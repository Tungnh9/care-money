"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ob/empty"
import { Field } from "@/components/ui/field"
import { SPELLING_WORD_COUNT } from "../../game-config"
import { isTypableWord, pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

interface SpellingGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

function SpellingGame({ vocab, onFinish }: SpellingGameProps) {
  const [words] = useState(() => pickRandomSet(vocab.filter(isTypableWord), SPELLING_WORD_COUNT))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState("")

  if (!words.length) {
    return <Empty pose="sleep" title="Chưa đủ từ vựng để chơi" hint="Cần thêm từ vựng trong ngân hàng từ." />
  }

  const word = words[index]
  const isLast = index + 1 >= words.length

  function handleSubmit() {
    const correct = input.trim().toLowerCase() === word.word.trim().toLowerCase()
    const nextScore = correct ? score + 1 : score
    if (isLast) {
      onFinish(nextScore)
      return
    }
    setScore(nextScore)
    setIndex(index + 1)
    setInput("")
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      <p className="mb-2 text-sm text-[var(--ob-color-text-subtle)]">
        Từ {index + 1}/{words.length}
      </p>
      <p data-testid="spelling-meaning" className="mb-1 text-lg font-bold">
        {word.meaning}
      </p>
      {word.phonetic ? <p className="mb-4 text-sm text-[var(--ob-color-text-subtle)]">{word.phonetic}</p> : null}
      <Field
        key={index}
        label="Gõ lại từ tiếng Anh"
        placeholder="Nhập câu trả lời..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
      <Button className="mt-4" type="submit" disabled={!input.trim()}>
        {isLast ? "Hoàn thành" : "Tiếp theo"}
      </Button>
    </form>
  )
}

export { SpellingGame }
