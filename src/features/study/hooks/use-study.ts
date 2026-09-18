"use client"

import { useCallback, useEffect, useState } from "react"

import { dayKey } from "@/lib/date"
import { nextStreak } from "../game-calculations"
import {
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"
import type { GameType } from "../types"

function useStudy() {
  const [state, setState] = useState<StudyState>(DEFAULT_STUDY_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredStudy())
  }, [])

  const persist = useCallback((next: StudyState) => {
    setState(next)
    setStoredStudy(next)
  }, [])

  const toggleTask = useCallback(
    (index: number) => {
      persist({
        ...state,
        tasks: state.tasks.map((task, i) => (i === index ? { ...task, done: !task.done } : task)),
      })
    },
    [state, persist]
  )

  const toggleLearned = useCallback(
    (id: string) => {
      const learned = state.learned.includes(id)
        ? state.learned.filter((entryId) => entryId !== id)
        : [...state.learned, id]
      persist({ ...state, learned })
    },
    [state, persist]
  )

  const recordGameResult = useCallback(
    (type: GameType, score: number): { isNewHighScore: boolean } => {
      const isNewHighScore = score > state.gameHighScores[type]
      const gameHighScores = {
        ...state.gameHighScores,
        [type]: Math.max(state.gameHighScores[type], score),
      }
      // nextStreak trả về chính state.gameStreak (cùng reference) khi chơi lại trong cùng ngày —
      // nhờ đó so sánh === dưới đây phát hiện đúng lúc không có gì thật sự đổi.
      const gameStreak = nextStreak(state.gameStreak, dayKey())
      const unchanged = gameHighScores[type] === state.gameHighScores[type] && gameStreak === state.gameStreak
      if (!unchanged) {
        persist({ ...state, gameHighScores, gameStreak })
      }
      return { isNewHighScore }
    },
    [state, persist]
  )

  return {
    tasks: state.tasks,
    learned: state.learned,
    gameHighScores: state.gameHighScores,
    gameStreak: state.gameStreak,
    toggleTask,
    toggleLearned,
    recordGameResult,
    replaceStudy: persist,
  }
}

export { useStudy }
