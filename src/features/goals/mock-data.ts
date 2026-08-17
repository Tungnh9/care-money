interface MockGoalsData {
  savingsTotal: number
  goldPhan: number
  goldPricePerPhan: number
  streak: number
}

const MOCK_GOALS_DATA: MockGoalsData = {
  savingsTotal: 44_000_000,
  goldPhan: 60,
  goldPricePerPhan: 935_000,
  streak: 14,
}

export { MOCK_GOALS_DATA, type MockGoalsData }
