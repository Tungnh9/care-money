"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "../finance-storage"
import type { CreditCard, GoldPurchase, GoldStore, Investment, SavingsFund } from "../types"
import { toast } from "sonner"
import { getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { renameFundInSettlements } from "@/features/budget/budget-storage"
import { nextId } from "@/lib/next-id"

function useFinance() {
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
        toast.success(`Đã thêm quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể thêm quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      try {
        persist({
          ...state,
          savings: state.savings.map((f) => (f.name === originalName ? fund : f)),
        })
        // Mục tiêu "mua xe" link theo tên quỹ (không có id) — đổi tên quỹ đang link
        // thì phải đổi luôn tên lưu ở car-goal-storage, nếu không link sẽ bị mồ côi.
        if (fund.name !== originalName && getCarGoalFundName() === originalName) {
          setCarGoalFundName(fund.name)
        }
        // Lịch sử tất toán ngân sách cũng tham chiếu quỹ theo tên — cascade tương tự
        // để lịch sử vẫn hiển thị đúng tên hiện tại của quỹ.
        if (fund.name !== originalName) {
          renameFundInSettlements(originalName, fund.name)
        }
        toast.success(`Đã cập nhật quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể cập nhật quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const removeSavingsFund = useCallback(
    (name: string) => {
      try {
        persist({ ...state, savings: state.savings.filter((f) => f.name !== name) })
        toast.success(`Đã xoá quỹ tiết kiệm "${name}"`)
      } catch {
        toast.error(`Không thể xoá quỹ tiết kiệm "${name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const addCard = useCallback(
    (card: CreditCard) => {
      try {
        persist({ ...state, cards: [...state.cards, card] })
        toast.success(`Đã thêm thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể thêm thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const payCard = useCallback(
    (name: string, amount: number) => {
      try {
        persist({
          ...state,
          cards: state.cards.map((card) =>
            card.name === name ? { ...card, balance: Math.max(card.balance - amount, 0) } : card
          ),
        })
        toast.success(`Đã ghi nhận thanh toán cho thẻ "${name}"`)
      } catch {
        toast.error("Không thể ghi nhận thanh toán. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const updateCard = useCallback(
    (originalName: string, card: CreditCard) => {
      try {
        persist({
          ...state,
          cards: state.cards.map((c) => (c.name === originalName ? card : c)),
        })
        toast.success(`Đã cập nhật thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const removeCard = useCallback(
    (name: string) => {
      try {
        persist({ ...state, cards: state.cards.filter((c) => c.name !== name) })
        toast.success(`Đã xoá thẻ tín dụng "${name}"`)
      } catch {
        toast.error(`Không thể xoá thẻ tín dụng "${name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const addGoldStore = useCallback(
    (store: GoldStore) => {
      if (state.goldStores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...state, goldStores: [...state.goldStores, store] })
        toast.success(`Đã thêm cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể thêm cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const setGoldStorePrice = useCallback(
    (name: string, price: string) => {
      // Gõ trực tiếp từng phím, không phải submit 1 lần — không toast để tránh spam,
      // chỉ chặn throw khi ghi storage lỗi (khác payCard/updateCard là hành động rời rạc).
      try {
        persist({
          ...state,
          goldStores: state.goldStores.map((s) => (s.name === name ? { ...s, price } : s)),
        })
      } catch {
        // im lặng bỏ qua, giữ nguyên giá trị hiển thị cũ
      }
    },
    [state, persist]
  )

  const updateGoldStore = useCallback(
    (originalName: string, store: GoldStore) => {
      try {
        persist({
          ...state,
          goldStores: state.goldStores.map((s) => (s.name === originalName ? store : s)),
          // Purchase tham chiếu cửa hàng theo tên (sống, không snapshot) — đổi tên phải
          // cascade luôn, nếu không sẽ mồ côi giống bug car-goal-fund đã fix trước đó.
          gold:
            store.name !== originalName
              ? state.gold.map((p) => (p.store === originalName ? { ...p, store: store.name } : p))
              : state.gold,
        })
        toast.success(`Đã cập nhật cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể cập nhật cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const removeGoldStore = useCallback(
    (name: string) => {
      // Chặn xoá khi còn purchase tham chiếu — không cascade-xoá purchase hay âm thầm
      // gán lại cửa hàng khác, tránh lặp lại lớp bug "orphan reference" theo hướng ngược.
      if (state.gold.some((p) => p.store === name)) {
        toast.error(`Không thể xoá "${name}" vì vẫn còn giao dịch mua vàng gắn với cửa hàng này.`)
        return
      }
      try {
        persist({ ...state, goldStores: state.goldStores.filter((s) => s.name !== name) })
        toast.success(`Đã xoá cửa hàng "${name}"`)
      } catch {
        toast.error(`Không thể xoá cửa hàng "${name}". Vui lòng thử lại.`)
      }
    },
    [state, persist]
  )

  const addGold = useCallback(
    (purchase: Omit<GoldPurchase, "id">) => {
      try {
        persist({ ...state, gold: [{ ...purchase, id: nextId(state.gold) }, ...state.gold] })
        toast.success(`Đã thêm lần mua vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể thêm lần mua vàng. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const updateGold = useCallback(
    (id: number, purchase: Omit<GoldPurchase, "id">) => {
      try {
        persist({
          ...state,
          gold: state.gold.map((p) => (p.id === id ? { ...purchase, id } : p)),
        })
        toast.success(`Đã cập nhật giao dịch vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể cập nhật giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const removeGold = useCallback(
    (id: number) => {
      const date = state.gold.find((purchase) => purchase.id === id)?.date
      try {
        persist({ ...state, gold: state.gold.filter((purchase) => purchase.id !== id) })
        toast.success(date ? `Đã xoá giao dịch vàng ngày ${date}` : "Đã xoá giao dịch vàng")
      } catch {
        toast.error("Không thể xoá giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  const addInvest = useCallback(
    (invest: Omit<Investment, "id">) => {
      try {
        persist({ ...state, invests: [...state.invests, { ...invest, id: nextId(state.invests) }] })
        toast.success(`Đã thêm khoản đầu tư "${invest.name}"`)
      } catch {
        toast.error("Không thể thêm khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [state, persist]
  )

  return {
    savings: state.savings,
    cards: state.cards,
    gold: state.gold,
    goldStores: state.goldStores,
    invests: state.invests,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    addGoldStore,
    updateGoldStore,
    removeGoldStore,
    setGoldStorePrice,
    addGold,
    updateGold,
    removeGold,
    addInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
