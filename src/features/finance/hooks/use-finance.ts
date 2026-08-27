"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "../finance-storage"
import type { CreditCard, GoldPurchase, Investment, SavingsFund } from "../types"
import { useT } from "@/components/locale-provider"
import { toast } from "sonner"

function useFinance() {
  const t = useT()
  const [state, setState] = useState<FinanceState>(DEFAULT_FINANCE_STATE)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredFinance())
  }, [])

  const persist = useCallback((next: FinanceState) => {
    setStoredFinance(next)
    setState(next)
  }, [])

  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      try {
        persist({ ...state, savings: [...state.savings, fund] })
        toast.success(t("finance.toast.savingsAdded", { name: fund.name }))
      } catch {
        toast.error(t("finance.toast.savingsAddFailed", { name: fund.name }))
      }
    },
    [state, persist, t]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      persist({
        ...state,
        savings: state.savings.map((f) => (f.name === originalName ? fund : f)),
      })
    },
    [state, persist]
  )

  const removeSavingsFund = useCallback(
    (name: string) => {
      try {
        persist({ ...state, savings: state.savings.filter((f) => f.name !== name) })
        toast.success(t("finance.toast.savingsRemoved", { name }))
      } catch {
        toast.error(t("finance.toast.savingsRemoveFailed", { name }))
      }
    },
    [state, persist, t]
  )

  const addCard = useCallback(
    (card: CreditCard) => {
      try {
        persist({ ...state, cards: [...state.cards, card] })
        toast.success(t("finance.toast.cardAdded", { name: card.name }))
      } catch {
        toast.error(t("finance.toast.cardAddFailed", { name: card.name }))
      }
    },
    [state, persist, t]
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

  const updateCard = useCallback(
    (originalName: string, card: CreditCard) => {
      persist({
        ...state,
        cards: state.cards.map((c) => (c.name === originalName ? card : c)),
      })
    },
    [state, persist]
  )

  const removeCard = useCallback(
    (name: string) => {
      try {
        persist({ ...state, cards: state.cards.filter((c) => c.name !== name) })
        toast.success(t("finance.toast.cardRemoved", { name }))
      } catch {
        toast.error(t("finance.toast.cardRemoveFailed", { name }))
      }
    },
    [state, persist, t]
  )

  const setGoldPrice = useCallback(
    (goldPrice: string) => {
      persist({ ...state, goldPrice })
    },
    [state, persist]
  )

  const addGold = useCallback(
    (purchase: Omit<GoldPurchase, "id">) => {
      try {
        persist({ ...state, gold: [{ ...purchase, id: Date.now() }, ...state.gold] })
        toast.success(t("finance.toast.goldAdded", { date: purchase.date }))
      } catch {
        toast.error(t("finance.toast.goldAddFailed"))
      }
    },
    [state, persist, t]
  )

  const updateGold = useCallback(
    (id: number, purchase: Omit<GoldPurchase, "id">) => {
      persist({
        ...state,
        gold: state.gold.map((p) => (p.id === id ? { ...purchase, id } : p)),
      })
    },
    [state, persist]
  )

  const removeGold = useCallback(
    (id: number) => {
      const date = state.gold.find((purchase) => purchase.id === id)?.date
      try {
        persist({ ...state, gold: state.gold.filter((purchase) => purchase.id !== id) })
        toast.success(
          date ? t("finance.toast.goldRemoved", { date }) : t("finance.toast.goldRemovedGeneric")
        )
      } catch {
        toast.error(t("finance.toast.goldRemoveFailed"))
      }
    },
    [state, persist, t]
  )

  const addInvest = useCallback(
    (invest: Omit<Investment, "id">) => {
      try {
        persist({ ...state, invests: [...state.invests, { ...invest, id: Date.now() }] })
        toast.success(t("finance.toast.investAdded", { name: invest.name }))
      } catch {
        toast.error(t("finance.toast.investAddFailed"))
      }
    },
    [state, persist, t]
  )

  return {
    savings: state.savings,
    cards: state.cards,
    gold: state.gold,
    goldPrice: state.goldPrice,
    invests: state.invests,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    setGoldPrice,
    addGold,
    updateGold,
    removeGold,
    addInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
