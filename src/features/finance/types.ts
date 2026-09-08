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

interface GoldStore {
  name: string
  price: string
}

interface GoldPurchase {
  id: number
  date: string
  phan: number
  buy: number
  store: string
}

interface Investment {
  id: number
  name: string
  cost: number
  value: number
}

export type { SavingsFund, CreditCard, GoldStore, GoldPurchase, Investment }
