"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "../finance-storage"
import type { CreditCard, GoldPurchase, GoldStore, Investment, SavingsFund } from "../types"
import { toast } from "sonner"
import { getCarGoalFundName, setCarGoalFundName } from "@/features/goals/car-goal-storage"
import { renameFundInSettlements } from "@/features/budget/budget-storage"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"

function useFinance() {
  const [state, setState] = useState<FinanceState>(DEFAULT_FINANCE_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đọc được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getStoredFinance())
    setHydrated(true)
  }, [])

  // Tab khác, 1 lần tải xuống/nhập file vừa xong, hay applySavingsFundDelta (tất toán ngân sách)
  // ghi finance-data → đọc lại để màn hình không hiện số dư cũ.
  const reload = useCallback(() => setState(getStoredFinance()), [])
  useStorageSync(FINANCE_STORAGE_KEY, reload)

  const persist = useCallback((next: FinanceState) => {
    setStoredFinance(next)
    setState(next)
  }, [])

  // Mọi thao tác ghi bên dưới dựng từ getStoredFinance() đọc TƯƠI ngay lúc gọi (đúng cách
  // applySavingsFundDelta vẫn làm), không từ `state` trong closure: giữa 2 lần render, 1 tab khác
  // hay 1 lần tất toán ngân sách có thể vừa ghi finance-data — dựng từ bản cũ sẽ ghi đè mất nó.

  const addSavingsFund = useCallback(
    (fund: SavingsFund) => {
      const current = getStoredFinance()
      // Quỹ định danh bằng tên ở mọi nơi — trùng tên thì sửa/xoá/tất toán 1 quỹ sẽ đè luôn quỹ kia.
      if (current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, savings: [...current.savings, fund] })
        // Chưa quỹ nào mang tên này (vừa chặn ở trên) nên liên kết mục tiêu "mua xe" đang trỏ đúng
        // tên này chỉ có thể là liên kết mồ côi của 1 quỹ đã xoá — gỡ đi, không để quỹ mới âm thầm
        // bị gắn vào mục tiêu mà người dùng không hề chọn.
        if (getCarGoalFundName() === fund.name) setCarGoalFundName(null)
        toast.success(`Đã thêm quỹ tiết kiệm "${fund.name}"`)
      } catch {
        toast.error(`Không thể thêm quỹ tiết kiệm "${fund.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund) => {
      const current = getStoredFinance()
      if (fund.name !== originalName && current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          savings: current.savings.map((f) => (f.name === originalName ? fund : f)),
        })
        // Mục tiêu "mua xe" link theo tên quỹ (không có id) — đổi tên quỹ đang link
        // thì phải đổi luôn tên lưu ở car-goal-storage, nếu không link sẽ bị mồ côi.
        if (fund.name !== originalName && getCarGoalFundName() === originalName) {
          setCarGoalFundName(fund.name)
        } else if (fund.name !== originalName && getCarGoalFundName() === fund.name) {
          // Tên mới đang bị 1 liên kết mồ côi (quỹ đã xoá từ trước) trỏ tới — gỡ, không để quỹ vừa
          // đổi tên âm thầm bị gắn vào mục tiêu.
          setCarGoalFundName(null)
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
    [persist]
  )

  const removeSavingsFund = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, savings: current.savings.filter((f) => f.name !== name) })
        // Mục tiêu "mua xe" đang gắn đúng quỹ này thì gỡ luôn — nếu không, 1 quỹ tạo sau trùng tên
        // sẽ âm thầm bị gắn vào mục tiêu (đổi tên đã cascade tương tự ở updateSavingsFund).
        // Settlement giữ nguyên tên cũ: chỉ là lịch sử đã đóng băng (xem budget-storage.ts).
        if (getCarGoalFundName() === name) setCarGoalFundName(null)
        toast.success(`Đã xoá quỹ tiết kiệm "${name}"`)
      } catch {
        toast.error(`Không thể xoá quỹ tiết kiệm "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addCard = useCallback(
    (card: CreditCard) => {
      const current = getStoredFinance()
      // Thẻ định danh bằng tên (trả thẻ, sửa, xoá) — trùng tên thì trả 1 thẻ sẽ trừ nợ cả 2.
      if (current.cards.some((c) => c.name === card.name)) {
        toast.error(`Đã có thẻ tín dụng tên "${card.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, cards: [...current.cards, card] })
        toast.success(`Đã thêm thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể thêm thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const payCard = useCallback(
    (name: string, amount: number) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          cards: current.cards.map((card) =>
            card.name === name ? { ...card, balance: Math.max(card.balance - amount, 0) } : card
          ),
        })
        toast.success(`Đã ghi nhận thanh toán cho thẻ "${name}"`)
      } catch {
        toast.error("Không thể ghi nhận thanh toán. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateCard = useCallback(
    (originalName: string, card: CreditCard) => {
      const current = getStoredFinance()
      if (card.name !== originalName && current.cards.some((c) => c.name === card.name)) {
        toast.error(`Đã có thẻ tín dụng tên "${card.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          cards: current.cards.map((c) => (c.name === originalName ? card : c)),
        })
        toast.success(`Đã cập nhật thẻ tín dụng "${card.name}"`)
      } catch {
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeCard = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, cards: current.cards.filter((c) => c.name !== name) })
        toast.success(`Đã xoá thẻ tín dụng "${name}"`)
      } catch {
        toast.error(`Không thể xoá thẻ tín dụng "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addGoldStore = useCallback(
    (store: GoldStore) => {
      const current = getStoredFinance()
      if (current.goldStores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({ ...current, goldStores: [...current.goldStores, store] })
        toast.success(`Đã thêm cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể thêm cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const setGoldStorePrice = useCallback(
    (name: string, price: string) => {
      const current = getStoredFinance()
      // Gõ trực tiếp từng phím, không phải submit 1 lần — không toast để tránh spam,
      // chỉ chặn throw khi ghi storage lỗi (khác payCard/updateCard là hành động rời rạc).
      try {
        persist({
          ...current,
          goldStores: current.goldStores.map((s) => (s.name === name ? { ...s, price } : s)),
        })
      } catch {
        // im lặng bỏ qua, giữ nguyên giá trị hiển thị cũ
      }
    },
    [persist]
  )

  const updateGoldStore = useCallback(
    (originalName: string, store: GoldStore) => {
      const current = getStoredFinance()
      if (store.name !== originalName && current.goldStores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist({
          ...current,
          goldStores: current.goldStores.map((s) => (s.name === originalName ? store : s)),
          // Purchase tham chiếu cửa hàng theo tên (sống, không snapshot) — đổi tên phải
          // cascade luôn, nếu không sẽ mồ côi giống bug car-goal-fund đã fix trước đó.
          gold:
            store.name !== originalName
              ? current.gold.map((p) => (p.store === originalName ? { ...p, store: store.name } : p))
              : current.gold,
        })
        toast.success(`Đã cập nhật cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể cập nhật cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const removeGoldStore = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      // Chặn xoá khi còn purchase tham chiếu — không cascade-xoá purchase hay âm thầm
      // gán lại cửa hàng khác, tránh lặp lại lớp bug "orphan reference" theo hướng ngược.
      if (current.gold.some((p) => p.store === name)) {
        toast.error(`Không thể xoá "${name}" vì vẫn còn giao dịch mua vàng gắn với cửa hàng này.`)
        return
      }
      try {
        persist({ ...current, goldStores: current.goldStores.filter((s) => s.name !== name) })
        toast.success(`Đã xoá cửa hàng "${name}"`)
      } catch {
        toast.error(`Không thể xoá cửa hàng "${name}". Vui lòng thử lại.`)
      }
    },
    [persist]
  )

  const addGold = useCallback(
    (purchase: Omit<GoldPurchase, "id">) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, gold: [{ ...purchase, id: nextId(current.gold) }, ...current.gold] })
        toast.success(`Đã thêm lần mua vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể thêm lần mua vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateGold = useCallback(
    (id: number, purchase: Omit<GoldPurchase, "id">) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          gold: current.gold.map((p) => (p.id === id ? { ...purchase, id } : p)),
        })
        toast.success(`Đã cập nhật giao dịch vàng ngày ${purchase.date}`)
      } catch {
        toast.error("Không thể cập nhật giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeGold = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const date = current.gold.find((purchase) => purchase.id === id)?.date
      try {
        persist({ ...current, gold: current.gold.filter((purchase) => purchase.id !== id) })
        toast.success(date ? `Đã xoá giao dịch vàng ngày ${date}` : "Đã xoá giao dịch vàng")
      } catch {
        toast.error("Không thể xoá giao dịch vàng. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const addInvest = useCallback(
    (invest: Omit<Investment, "id">) => {
      const current = getStoredFinance()
      try {
        persist({ ...current, invests: [...current.invests, { ...invest, id: nextId(current.invests) }] })
        toast.success(`Đã thêm khoản đầu tư "${invest.name}"`)
      } catch {
        toast.error("Không thể thêm khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const updateInvest = useCallback(
    (id: number, invest: Omit<Investment, "id">) => {
      const current = getStoredFinance()
      try {
        persist({
          ...current,
          invests: current.invests.map((i) => (i.id === id ? { ...invest, id } : i)),
        })
        toast.success(`Đã cập nhật khoản đầu tư "${invest.name}"`)
      } catch {
        toast.error("Không thể cập nhật khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  const removeInvest = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const name = current.invests.find((i) => i.id === id)?.name
      try {
        persist({ ...current, invests: current.invests.filter((i) => i.id !== id) })
        toast.success(name ? `Đã xoá khoản đầu tư "${name}"` : "Đã xoá khoản đầu tư")
      } catch {
        toast.error("Không thể xoá khoản đầu tư. Vui lòng thử lại.")
      }
    },
    [persist]
  )

  return {
    savings: state.savings,
    cards: state.cards,
    gold: state.gold,
    goldStores: state.goldStores,
    invests: state.invests,
    hydrated,
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
    updateInvest,
    removeInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
