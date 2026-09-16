"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { pickRandomSet } from "../../game-calculations"
import type { VocabEntry } from "../../types"

const WORD_COUNT = 10

interface SpellingGameProps {
  vocab: VocabEntry[]
  onFinish: (score: number) => void
}

function SpellingGame({ vocab, onFinish }: SpellingGameProps) {
  const [words] = useState(() => pickRandomSet(vocab, WORD_COUNT))
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [input, setInput] = useState("")

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
    <div>
      <p className="mb-2 text-sm text-[var(--ob-color-text-subtle)]">
        Từ {index + 1}/{words.length}
      </p>
      <p data-testid="spelling-meaning" className="mb-1 text-lg font-bold">
        {word.meaning}
      </p>
      {word.phonetic ? <p className="mb-4 text-sm text-[var(--ob-color-text-subtle)]">{word.phonetic}</p> : null}
      <Field
        label="Gõ lại từ tiếng Anh"
        placeholder="Nhập câu trả lời..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
      />
      <Button className="mt-4" type="button" onClick={handleSubmit} disabled={!input.trim()}>
        {isLast ? "Hoàn thành" : "Tiếp theo"}
      </Button>
    </div>
  )
}

export { SpellingGame }
