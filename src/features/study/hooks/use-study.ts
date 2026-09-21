"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { dayKey } from "@/lib/date"
import { nextStreak } from "../game-calculations"
import { applyGrade, ensureReviewStates, initialReviewState, seedLearnedReviewState } from "../srs-calculations"
import {
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"
import type { GameType, ReviewGrade, VocabEntry } from "../types"

function useStudy() {
  const [state, setState] = useState<StudyState>(DEFAULT_STUDY_STATE)
  const [hydrated, setHydrated] = useState(false)
  // Bản sao "mới nhất" của state, cập nhật ĐỒNG BỘ ngay trong persist() — khác setState (bất
  // đồng bộ, gộp theo batch). Nhiều action gọi liên tiếp trong cùng 1 tick (vd. onWordReviewed
  // rồi onFinish khi 1 ván game kết thúc) đều phải đọc state MỚI NHẤT qua ref này, không phải
  // qua closure `state` của lần render hiện tại — nếu không, action gọi sau sẽ tính "next" từ
  // state CŨ (chưa thấy thay đổi của action gọi trước), ghi đè mất thay đổi đó.
  const stateRef = useRef(state)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    const loaded = getStoredStudy()
    stateRef.current = loaded
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded)
    setHydrated(true)
  }, [])

  const persist = useCallback((next: StudyState) => {
    stateRef.current = next
    setState(next)
    setStoredStudy(next)
  }, [])

  const toggleTask = useCallback(
    (index: number) => {
      const current = stateRef.current
      persist({
        ...current,
        tasks: current.tasks.map((task, i) => (i === index ? { ...task, done: !task.done } : task)),
      })
    },
    [persist]
  )

  const toggleLearned = useCallback(
    (id: string) => {
      const current = stateRef.current
      const learned = current.learned.includes(id)
        ? current.learned.filter((entryId) => entryId !== id)
        : [...current.learned, id]
      persist({ ...current, learned })
    },
    [persist]
  )

  const recordGameResult = useCallback(
    (type: GameType, score: number): { isNewHighScore: boolean } => {
      const current = stateRef.current
      const isNewHighScore = score > current.gameHighScores[type]
      const gameHighScores = {
        ...current.gameHighScores,
        [type]: Math.max(current.gameHighScores[type], score),
      }
      // nextStreak trả về chính current.gameStreak (cùng reference) khi chơi lại trong cùng
      // ngày — nhờ đó so sánh === dưới đây phát hiện đúng lúc không có gì thật sự đổi.
      const gameStreak = nextStreak(current.gameStreak, dayKey())
      const unchanged = gameHighScores[type] === current.gameHighScores[type] && gameStreak === current.gameStreak
      if (!unchanged) {
        persist({ ...current, gameHighScores, gameStreak })
      }
      return { isNewHighScore }
    },
    [persist]
  )

  const gradeWord = useCallback(
    (wordId: string, grade: ReviewGrade) => {
      const current = stateRef.current
      const today = dayKey()
      // Từ chưa từng có entry được tạo ngay tại đây theo đúng loại seed (cold/learned) rồi chấm
      // luôn trong 1 bước.
      const existing =
        current.wordReviews[wordId] ??
        (current.learned.includes(wordId)
          ? seedLearnedReviewState(wordId, today)
          : initialReviewState(wordId, today))
      const wordReviews = {
        ...current.wordReviews,
        [wordId]: applyGrade(existing, grade, today, new Date().toISOString()),
      }
      persist({ ...current, wordReviews })
    },
    [persist]
  )

  // Ghi lại 1 lần các entry SRS còn thiếu (từ mới, hoặc lần đầu bật tính năng) ngay khi dữ liệu
  // thật đã tải xong — nếu không, entry "learned" sẽ bị tính lại dueAt = hôm nay + 6 mỗi lần
  // render (không bao giờ tới hạn thật) thay vì cố định đúng 1 lần tại thời điểm seed.
  const seedReviews = useCallback(
    (vocab: VocabEntry[]) => {
      const current = stateRef.current
      const wordReviews = ensureReviewStates(current.wordReviews, vocab, current.learned, dayKey())
      if (wordReviews !== current.wordReviews) {
        persist({ ...current, wordReviews })
      }
    },
    [persist]
  )

  return {
    tasks: state.tasks,
    learned: state.learned,
    gameHighScores: state.gameHighScores,
    gameStreak: state.gameStreak,
    wordReviews: state.wordReviews,
    hydrated,
    toggleTask,
    toggleLearned,
    recordGameResult,
    gradeWord,
    seedReviews,
    replaceStudy: persist,
  }
}

export { useStudy }
