interface SavingsFund {
  name: string
  amount: number
  target: number
  note?: string
}

interface CreditCard {
  name: string
  balance: number
  min: number
  limit: number
  due: string
  color?: string
}

interface GoldPurchase {
  id: number
  date: string
  phan: number
  buy: number
}

interface Investment {
  id: number
  name: string
  cost: number
  value: number
}

export type { SavingsFund, CreditCard, GoldPurchase, Investment }
