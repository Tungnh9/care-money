"use client"

import { useCallback, useEffect, useState } from "react"

import { getCarGoalFundName, setCarGoalFundName } from "../car-goal-storage"

function useCarGoalFund() {
  const [fundName, setFundName] = useState<string | null>(null)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFundName(getCarGoalFundName())
  }, [])

  const selectFund = useCallback((name: string | null) => {
    setCarGoalFundName(name)
    setFundName(name)
  }, [])

  return { fundName, selectFund }
}

export { useCarGoalFund }
