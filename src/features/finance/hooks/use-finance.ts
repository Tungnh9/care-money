"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "../finance-storage"
import type { CreditCard, GoldPurchase, Investment, SavingsFund } from "../types"

function useFinance() {
  const [state, setState] = useState<FinanceState>(DEFAULT_FINANCE_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredFinance())
  }, [])

  const persist = useCallback((next: FinanceState) => {
    setState(next)
    setStoredFinance(next)
  }, [])

  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      persist({ ...state, savings: [...state.savings, fund] })
    },
    [state, persist]
  )

  const addCard = useCallback(
    (card: CreditCard) => {
      persist({ ...state, cards: [...state.cards, card] })
    },
    [state, persist]
  )

  const payCard = useCallback(
    (name: string, amount: number) => {
      persist({
        ...state,
        cards: state.cards.map((card) =>
          card.name === name ? { ...card, balance: Math.max(card.balance - amount, 0) } : card
        ),
      })
    },
    [state, persist]
  )

  const setGoldPrice = useCallback(
    (goldPrice: string) => {
      persist({ ...state, goldPrice })
    },
    [state, persist]
  )

  const addGold = useCallback(
    (purchase: Omit<GoldPurchase, "id">) => {
      persist({ ...state, gold: [{ ...purchase, id: Date.now() }, ...state.gold] })
    },
    [state, persist]
  )

  const removeGold = useCallback(
    (id: number) => {
      persist({ ...state, gold: state.gold.filter((purchase) => purchase.id !== id) })
    },
    [state, persist]
  )

  const addInvest = useCallback(
    (invest: Omit<Investment, "id">) => {
      persist({ ...state, invests: [...state.invests, { ...invest, id: Date.now() }] })
    },
    [state, persist]
  )

  return {
    savings: state.savings,
    cards: state.cards,
    gold: state.gold,
    goldPrice: state.goldPrice,
    invests: state.invests,
    addSavingsFund,
    addCard,
    payCard,
    setGoldPrice,
    addGold,
    removeGold,
    addInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
