const CAR_GOAL_FUND_KEY = "car-goal-fund-name"

function getCarGoalFundName(): string | null {
  try {
    return window.localStorage.getItem(CAR_GOAL_FUND_KEY)
  } catch {
    return null
  }
}

function setCarGoalFundName(name: string | null) {
  if (name === null) window.localStorage.removeItem(CAR_GOAL_FUND_KEY)
  else window.localStorage.setItem(CAR_GOAL_FUND_KEY, name)
}

export { getCarGoalFundName, setCarGoalFundName }
