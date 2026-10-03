"use client"

import { useCallback, useEffect, useState } from "react"

import { useStorageSync } from "@/lib/use-storage-sync"
import { CAR_GOAL_FUND_KEY, getCarGoalFundName, setCarGoalFundName } from "../car-goal-storage"

function useCarGoalFund() {
  const [fundName, setFundName] = useState<string | null>(null)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFundName(getCarGoalFundName())
  }, [])

  // Xoá/đổi tên quỹ ở trang Tài chính, nhập file, tải xuống hay tab khác đều có thể đổi liên kết.
  const reload = useCallback(() => setFundName(getCarGoalFundName()), [])
  useStorageSync(CAR_GOAL_FUND_KEY, reload)

  const selectFund = useCallback((name: string | null) => {
    setCarGoalFundName(name)
    setFundName(name)
  }, [])

  return { fundName, selectFund }
}

export { useCarGoalFund }
