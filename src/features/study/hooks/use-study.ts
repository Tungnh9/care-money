"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_STUDY_STATE,
  getStoredStudy,
  setStoredStudy,
  type StudyState,
} from "../study-storage"

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

  return {
    tasks: state.tasks,
    learned: state.learned,
    toggleTask,
    toggleLearned,
    replaceStudy: persist,
  }
}

export { useStudy }
