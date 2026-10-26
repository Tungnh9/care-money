"use client"

import { useCallback, useEffect, useState } from "react"

import {
  DEFAULT_FINANCE_STATE,
  FINANCE_STORAGE_KEY,
  getStoredFinance,
  setStoredFinance,
  type FinanceState,
} from "@/lib/finance/finance-storage"
import {
  earliestTakeoutDate,
  parsePurchaseDate,
  saleUndoBlockedReason,
  takenOutByPurchase,
} from "@/lib/finance/metal-calculations"
import { GOLD_NAMING, SILVER_NAMING, formatTakenOut, type MetalNaming } from "@/lib/finance/metal-naming"
import type {
  CreditCard,
  GoldPurchase,
  Investment,
  MetalGift,
  MetalGiftInput,
  MetalPurchaseBase,
  MetalSale,
  MetalSaleInput,
  MetalStore,
  SavingsFund,
  SilverPurchase,
} from "@/lib/finance/types"
import { toast } from "sonner"
import { getCarGoalFundName, setCarGoalFundName } from "@/lib/goals/car-goal-storage"
import { detachCardFromExpenses, renameCardInExpenses, renameFundInSettlements } from "@/lib/budget/budget-storage"
import { MAX_BUDGET_AMOUNT } from "@/lib/budget/budget-calculations"
import { nextId } from "@/lib/next-id"
import { useStorageSync } from "@/lib/use-storage-sync"

// Cách 1 kim loại (vàng/bạc) nằm trong FinanceState: mảng lần mua, mảng cửa hàng, mảng lần tặng, mảng lần
// bán, khối lượng của 1 lần mua, và tên gọi dùng trong toast. `withId` gắn id cho lần mua mới/đã sửa — ở đây biết
// kiểu cụ thể nên không cần ép kiểu.
interface MetalLens<P extends MetalPurchaseBase> {
  naming: MetalNaming
  quantityOf: (purchase: P) => number
  purchases: (state: FinanceState) => P[]
  stores: (state: FinanceState) => MetalStore[]
  gifts: (state: FinanceState) => MetalGift[]
  sales: (state: FinanceState) => MetalSale[]
  withPurchases: (state: FinanceState, purchases: P[]) => FinanceState
  withStores: (state: FinanceState, stores: MetalStore[]) => FinanceState
  withGifts: (state: FinanceState, gifts: MetalGift[]) => FinanceState
  withSales: (state: FinanceState, sales: MetalSale[]) => FinanceState
  withId: (purchase: Omit<P, "id">, id: number) => P
}

const GOLD_LENS: MetalLens<GoldPurchase> = {
  naming: GOLD_NAMING,
  quantityOf: (purchase) => purchase.phan,
  purchases: (state) => state.gold,
  stores: (state) => state.goldStores,
  gifts: (state) => state.goldGifts,
  sales: (state) => state.goldSales,
  withPurchases: (state, gold) => ({ ...state, gold }),
  withStores: (state, goldStores) => ({ ...state, goldStores }),
  withGifts: (state, goldGifts) => ({ ...state, goldGifts }),
  withSales: (state, goldSales) => ({ ...state, goldSales }),
  withId: (purchase, id) => ({ ...purchase, id }),
}

const SILVER_LENS: MetalLens<SilverPurchase> = {
  naming: SILVER_NAMING,
  quantityOf: (purchase) => purchase.luong,
  purchases: (state) => state.silver,
  stores: (state) => state.silverStores,
  gifts: (state) => state.silverGifts,
  sales: (state) => state.silverSales,
  withPurchases: (state, silver) => ({ ...state, silver }),
  withStores: (state, silverStores) => ({ ...state, silverStores }),
  withGifts: (state, silverGifts) => ({ ...state, silverGifts }),
  withSales: (state, silverSales) => ({ ...state, silverSales }),
  withId: (purchase, id) => ({ ...purchase, id }),
}

// Phần đã lấy ra khỏi 1 lần mua, đọc từ bản đọc tươi `state`: tổng đã tặng và tổng đã bán.
function takenOutOf<P extends MetalPurchaseBase>(lens: MetalLens<P>, state: FinanceState, purchaseId: number) {
  return {
    gifted: takenOutByPurchase(lens.gifts(state)).get(purchaseId) ?? 0,
    sold: takenOutByPurchase(lens.sales(state)).get(purchaseId) ?? 0,
  }
}

// Số lượng 1 lần tặng/bán phải là số nguyên dương và không vượt `available` (phần còn lại của lần mua). Form
// đã chặn trước, đây là chốt cuối trên dữ liệu đọc tươi — tab khác có thể vừa tặng/bán bớt từ cùng lần mua.
function takeoutQuantityError(
  qty: number,
  available: number,
  naming: MetalNaming,
  verb: "tặng" | "bán"
): string | null {
  if (!Number.isInteger(qty) || qty <= 0) return `Số lượng ${verb} phải là số nguyên lớn hơn 0.`
  if (qty > available) {
    return `Lần mua này chỉ còn ${naming.formatQuantity(available)} — không đủ để ${verb} ${naming.formatQuantity(qty)}.`
  }
  return null
}

// Tiền nhận của 1 lần bán: đồng nguyên, cùng mức trần với số tiền ở Chi tiêu.
function receivedError(received: number): string | null {
  return Number.isInteger(received) && received >= 1 && received <= MAX_BUDGET_AMOUNT
    ? null
    : `Số tiền nhận phải là số nguyên từ 1 đến ${MAX_BUDGET_AMOUNT.toLocaleString("vi-VN")} đ.`
}

// Cộng `delta` (âm = rút) vào đúng sổ tên `name`.
function withFundDelta(state: FinanceState, name: string, delta: number): FinanceState {
  return {
    ...state,
    savings: state.savings.map((fund) => (fund.name === name ? { ...fund, amount: fund.amount + delta } : fund)),
  }
}

// Lần bán trỏ tới sổ nhận tiền theo tên, ở cả vàng lẫn bạc. Lần bán đã gắn cờ `fundRemoved` thuộc về 1 sổ đã
// xoá — chỉ trùng tên với sổ đang có — nên không bao giờ bị đổi theo sổ đang có.
function updateSalesOfFund(state: FinanceState, name: string, update: (sale: MetalSale) => MetalSale): FinanceState {
  const apply = (sales: MetalSale[]) =>
    sales.map((sale) => (!sale.fundRemoved && sale.fundName === name ? update(sale) : sale))
  return { ...state, goldSales: apply(state.goldSales), silverSales: apply(state.silverSales) }
}

const markFundRemoved = (sale: MetalSale): MetalSale => ({ ...sale, fundRemoved: true })

// Chỉ lấy đúng 4 trường gốc từ `base` (có thể là cả lần tặng cũ): ghi chú cũ không được sống sót khi người
// dùng đã xoá nó. Ghi chú trống thì không có key `note` — giống lần tặng chưa từng có ghi chú.
function giftRecord(base: Pick<MetalGift, "id" | "purchaseId" | "store" | "buy">, input: MetalGiftInput): MetalGift {
  const { id, purchaseId, store, buy } = base
  return { id, purchaseId, store, buy, date: input.date, qty: input.qty, ...(input.note ? { note: input.note } : {}) }
}

// Như giftRecord: `store` và `buy` chụp từ lần mua lúc bán; ghi chú trống thì không có key `note`.
function saleRecord(base: Pick<MetalSale, "id" | "purchaseId" | "store" | "buy">, input: MetalSaleInput): MetalSale {
  const { id, purchaseId, store, buy } = base
  const { date, qty, received, fundName, note } = input
  return { id, purchaseId, store, buy, date, qty, received, fundName, ...(note ? { note } : {}) }
}

// Các thao tác ghi của 1 kim loại — vàng và bạc dùng chung, mỗi kim loại chỉ đụng tới mảng của chính nó
// (trùng tên, đổi tên lan sang lần mua, chặn xoá cửa hàng còn lần mua, lần tặng, lần bán đều xét trong kim loại
// đó; chỉ lần bán chạm thêm sổ tiết kiệm nhận tiền).
// `lens` là hằng cấp module nên các hàm trả ra ổn định như useCallback thường.
function useMetalActions<P extends MetalPurchaseBase>(lens: MetalLens<P>, persist: (next: FinanceState) => void) {
  const addStore = useCallback(
    (store: MetalStore) => {
      const current = getStoredFinance()
      if (lens.stores(current).some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        persist(lens.withStores(current, [...lens.stores(current), store]))
        toast.success(`Đã thêm cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể thêm cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  const setStorePrice = useCallback(
    (name: string, price: string) => {
      const current = getStoredFinance()
      // Gõ trực tiếp từng phím, không phải submit 1 lần — không toast để tránh spam,
      // chỉ chặn throw khi ghi storage lỗi (khác payCard/updateCard là hành động rời rạc).
      try {
        persist(
          lens.withStores(
            current,
            lens.stores(current).map((s) => (s.name === name ? { ...s, price } : s))
          )
        )
      } catch {
        // im lặng bỏ qua, giữ nguyên giá trị hiển thị cũ
      }
    },
    [lens, persist]
  )

  const updateStore = useCallback(
    (originalName: string, store: MetalStore) => {
      const current = getStoredFinance()
      const stores = lens.stores(current)
      if (store.name !== originalName && stores.some((s) => s.name === store.name)) {
        toast.error(`Đã có cửa hàng tên "${store.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        const purchases = lens.purchases(current)
        persist(
          lens.withPurchases(
            lens.withStores(
              current,
              stores.map((s) => (s.name === originalName ? store : s))
            ),
            // Lần mua tham chiếu cửa hàng theo tên (sống, không snapshot) — đổi tên phải
            // cascade luôn, nếu không sẽ mồ côi giống bug car-goal-fund đã fix trước đó.
            store.name !== originalName
              ? purchases.map((p) => (p.store === originalName ? { ...p, store: store.name } : p))
              : purchases
          )
        )
        toast.success(`Đã cập nhật cửa hàng "${store.name}"`)
      } catch {
        toast.error(`Không thể cập nhật cửa hàng "${store.name}". Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  const removeStore = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      // Chặn xoá khi còn lần mua tham chiếu — không cascade-xoá lần mua hay âm thầm
      // gán lại cửa hàng khác, tránh lặp lại lớp bug "orphan reference" theo hướng ngược.
      if (lens.purchases(current).some((p) => p.store === name)) {
        toast.error(`Không thể xoá "${name}" vì vẫn còn giao dịch mua ${lens.naming.noun} gắn với cửa hàng này.`)
        return
      }
      try {
        persist(
          lens.withStores(
            current,
            lens.stores(current).filter((s) => s.name !== name)
          )
        )
        toast.success(`Đã xoá cửa hàng "${name}"`)
      } catch {
        toast.error(`Không thể xoá cửa hàng "${name}". Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  const addPurchase = useCallback(
    (purchase: Omit<P, "id">) => {
      const current = getStoredFinance()
      try {
        const purchases = lens.purchases(current)
        // Tính cả id mà lần tặng/bán còn trỏ tới (lần tặng/bán mồ côi từ file sửa tay): lần mua mới lấy lại id
        // đó sẽ âm thầm bị trừ phần "đã tặng"/"đã bán" không phải của nó.
        const takeouts = [...lens.gifts(current), ...lens.sales(current)]
        const takenIds = [...purchases, ...takeouts.map((takeout) => ({ id: takeout.purchaseId }))]
        persist(lens.withPurchases(current, [lens.withId(purchase, nextId(takenIds)), ...purchases]))
        toast.success(`Đã thêm lần mua ${lens.naming.noun} ngày ${purchase.date}`)
      } catch {
        toast.error(`Không thể thêm lần mua ${lens.naming.noun}. Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  const updatePurchase = useCallback(
    (id: number, purchase: Omit<P, "id">) => {
      const current = getStoredFinance()
      // Số còn lại = số đã mua − đã tặng − đã bán: hạ số đã mua xuống dưới phần đã lấy ra thì số còn lại âm.
      const { gifted, sold } = takenOutOf(lens, current, id)
      const takenOut = formatTakenOut(lens.naming, gifted, sold)
      if (takenOut && lens.quantityOf(lens.withId(purchase, id)) < gifted + sold) {
        toast.error(`Lần mua này ${takenOut} — không sửa số lượng xuống thấp hơn.`)
        return
      }
      // Không tặng/bán được trước khi mua: ngày mua không được dời qua lần tặng hay bán sớm nhất của lần mua này.
      const earliest = earliestTakeoutDate([...lens.gifts(current), ...lens.sales(current)], id)
      if (earliest && parsePurchaseDate(purchase.date) > parsePurchaseDate(earliest)) {
        toast.error(`Ngày mua không được sau lần tặng hoặc bán sớm nhất (${earliest}).`)
        return
      }
      try {
        persist(
          lens.withPurchases(
            current,
            lens.purchases(current).map((p) => (p.id === id ? lens.withId(purchase, id) : p))
          )
        )
        toast.success(`Đã cập nhật giao dịch ${lens.naming.noun} ngày ${purchase.date}`)
      } catch {
        toast.error(`Không thể cập nhật giao dịch ${lens.naming.noun}. Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  const removePurchase = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      // Lần tặng trỏ tới lần mua theo id, mà id cấp bằng nextId (lớn nhất + 1): xoá lần mua cuối rồi mua
      // lần mới thì lần mới lấy lại đúng id đó, và lần tặng cũ gắn nhầm vào nó. Phải huỷ các lần tặng trước.
      if (lens.gifts(current).some((gift) => gift.purchaseId === id)) {
        toast.error("Không thể xoá lần mua này vì đã có lần tặng lấy từ đây. Huỷ các lần tặng trước.")
        return
      }
      if (lens.sales(current).some((sale) => sale.purchaseId === id)) {
        toast.error("Không thể xoá lần mua này vì đã có lần bán lấy từ đây. Huỷ các lần bán trước.")
        return
      }
      const purchases = lens.purchases(current)
      const date = purchases.find((purchase) => purchase.id === id)?.date
      try {
        persist(
          lens.withPurchases(
            current,
            purchases.filter((purchase) => purchase.id !== id)
          )
        )
        toast.success(
          date ? `Đã xoá giao dịch ${lens.naming.noun} ngày ${date}` : `Đã xoá giao dịch ${lens.naming.noun}`
        )
      } catch {
        toast.error(`Không thể xoá giao dịch ${lens.naming.noun}. Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  // Trả true khi đã ghi — modal Tặng chỉ đóng khi true. Mọi nhánh lỗi đã tự báo toast.
  const addGift = useCallback(
    (purchaseId: number, input: MetalGiftInput): boolean => {
      const current = getStoredFinance()
      const purchase = lens.purchases(current).find((p) => p.id === purchaseId)
      if (!purchase) {
        toast.error("Không tìm thấy lần mua này nữa.")
        return false
      }
      const gifts = lens.gifts(current)
      const { gifted, sold } = takenOutOf(lens, current, purchaseId)
      const error = takeoutQuantityError(input.qty, lens.quantityOf(purchase) - gifted - sold, lens.naming, "tặng")
      if (error) {
        toast.error(error)
        return false
      }
      try {
        const gift = giftRecord({ id: nextId(gifts), purchaseId, store: purchase.store, buy: purchase.buy }, input)
        persist(lens.withGifts(current, [gift, ...gifts]))
        toast.success(`Đã ghi lần tặng ${lens.naming.formatQuantity(input.qty)} ${lens.naming.noun} ngày ${input.date}`)
        return true
      } catch {
        toast.error(`Không thể ghi lần tặng ${lens.naming.noun}. Vui lòng thử lại.`)
        return false
      }
    },
    [lens, persist]
  )

  // Sửa ngày/số lượng/ghi chú; giữ nguyên lần mua và bản chụp cửa hàng + giá mua. Giới hạn số lượng là phần
  // còn lại của lần mua (sau mọi lần tặng và bán) cộng lại chính số của lần tặng này.
  const updateGift = useCallback(
    (id: number, input: MetalGiftInput): boolean => {
      const current = getStoredFinance()
      const gifts = lens.gifts(current)
      const gift = gifts.find((g) => g.id === id)
      if (!gift) {
        toast.error("Không tìm thấy lần tặng này nữa.")
        return false
      }
      const purchase = lens.purchases(current).find((p) => p.id === gift.purchaseId)
      // Lần mua đã mất (chỉ có từ file sửa tay) thì không cho tặng thêm — chỉ giữ hoặc giảm số đã tặng.
      const { gifted, sold } = takenOutOf(lens, current, gift.purchaseId)
      const available = purchase ? lens.quantityOf(purchase) - gifted - sold + gift.qty : gift.qty
      const error = takeoutQuantityError(input.qty, available, lens.naming, "tặng")
      if (error) {
        toast.error(error)
        return false
      }
      try {
        persist(
          lens.withGifts(
            current,
            gifts.map((g) => (g.id === id ? giftRecord(g, input) : g))
          )
        )
        toast.success(`Đã cập nhật lần tặng ${lens.naming.noun} ngày ${input.date}`)
        return true
      } catch {
        toast.error(`Không thể cập nhật lần tặng ${lens.naming.noun}. Vui lòng thử lại.`)
        return false
      }
    },
    [lens, persist]
  )

  // Huỷ = xoá bản ghi tặng: số còn lại của lần mua tính lại từ các lần tặng còn lại, nên số lượng tự về.
  const removeGift = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const gifts = lens.gifts(current)
      const date = gifts.find((gift) => gift.id === id)?.date
      try {
        persist(
          lens.withGifts(
            current,
            gifts.filter((gift) => gift.id !== id)
          )
        )
        toast.success(date ? `Đã huỷ lần tặng ${lens.naming.noun} ngày ${date}` : `Đã huỷ lần tặng ${lens.naming.noun}`)
      } catch {
        toast.error(`Không thể huỷ lần tặng ${lens.naming.noun}. Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  // Trả true khi đã ghi — modal Bán chỉ đóng khi true. Tiền nhận cộng vào sổ trong CÙNG 1 lần ghi với lần bán:
  // không bao giờ có sổ đã cộng tiền mà lần bán chưa ghi, hay ngược lại.
  const addSale = useCallback(
    (purchaseId: number, input: MetalSaleInput): boolean => {
      const current = getStoredFinance()
      const purchase = lens.purchases(current).find((p) => p.id === purchaseId)
      if (!purchase) {
        toast.error("Không tìm thấy lần mua này nữa.")
        return false
      }
      const { gifted, sold } = takenOutOf(lens, current, purchaseId)
      const left = lens.quantityOf(purchase) - gifted - sold
      const error = takeoutQuantityError(input.qty, left, lens.naming, "bán") ?? receivedError(input.received)
      if (error) {
        toast.error(error)
        return false
      }
      if (!current.savings.some((fund) => fund.name === input.fundName)) {
        toast.error(`Không tìm thấy sổ "${input.fundName}".`)
        return false
      }
      try {
        const sales = lens.sales(current)
        const sale = saleRecord({ id: nextId(sales), purchaseId, store: purchase.store, buy: purchase.buy }, input)
        persist(lens.withSales(withFundDelta(current, input.fundName, input.received), [sale, ...sales]))
        toast.success(
          `Đã ghi lần bán ${lens.naming.formatQuantity(input.qty)} ${lens.naming.noun} ngày ${input.date} vào sổ "${input.fundName}"`
        )
        return true
      } catch {
        toast.error(`Không thể ghi lần bán ${lens.naming.noun}. Vui lòng thử lại.`)
        return false
      }
    },
    [lens, persist]
  )

  // Huỷ = xoá bản ghi bán (số còn lại của lần mua tự về) và rút lại đúng số đã nhận khỏi sổ đã nhận, trong
  // cùng 1 lần ghi. Sổ đã xoá (cờ fundRemoved, hay không còn sổ tên đó) hoặc không còn đủ tiền thì không huỷ:
  // rút từ 1 sổ khác hay để sổ âm đều làm sai số dư.
  const removeSale = useCallback(
    (id: number) => {
      const current = getStoredFinance()
      const sales = lens.sales(current)
      const sale = sales.find((s) => s.id === id)
      if (!sale) {
        toast.error("Không tìm thấy lần bán này nữa.")
        return
      }
      const blocked = saleUndoBlockedReason(sale, current.savings)
      if (blocked) {
        toast.error(blocked)
        return
      }
      try {
        persist(
          lens.withSales(
            withFundDelta(current, sale.fundName, -sale.received),
            sales.filter((s) => s.id !== id)
          )
        )
        toast.success(`Đã huỷ lần bán ${lens.naming.noun} ngày ${sale.date}`)
      } catch {
        toast.error(`Không thể huỷ lần bán ${lens.naming.noun}. Vui lòng thử lại.`)
      }
    },
    [lens, persist]
  )

  return {
    addStore,
    setStorePrice,
    updateStore,
    removeStore,
    addPurchase,
    updatePurchase,
    removePurchase,
    addGift,
    updateGift,
    removeGift,
    addSale,
    removeSale,
  }
}

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
        // Chưa sổ nào mang tên này nên lần bán còn trỏ đúng tên này (chưa gắn cờ — chỉ có từ file sửa tay) là
        // lần bán mồ côi của 1 sổ đã xoá: gắn cờ luôn, không để huỷ nó rút tiền từ sổ mới.
        persist(updateSalesOfFund({ ...current, savings: [...current.savings, fund] }, fund.name, markFundRemoved))
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

  // `amountEdited` false: người dùng không sửa ô "Số tiền hiện có" của "Sửa quỹ" — giữ số dư đọc tươi, vì trong
  // lúc hộp mở có thể đã có tiền bán vàng/bạc hay tất toán ghi vào quỹ (tab khác), số chép lúc mở đã cũ (như
  // `balanceEdited` của updateCard).
  const updateSavingsFund = useCallback(
    (originalName: string, fund: SavingsFund, amountEdited = true) => {
      const current = getStoredFinance()
      if (fund.name !== originalName && current.savings.some((f) => f.name === fund.name)) {
        toast.error(`Đã có quỹ tiết kiệm tên "${fund.name}". Vui lòng chọn tên khác.`)
        return
      }
      try {
        const next = {
          ...current,
          savings: current.savings.map((f) =>
            f.name === originalName ? { ...fund, amount: amountEdited ? fund.amount : f.amount } : f
          ),
        }
        // Lần bán trỏ sổ nhận tiền theo tên — đổi tên thì đổi theo trong cùng lần ghi, nếu không lúc huỷ sẽ
        // không tìm thấy sổ. Lần bán còn trỏ tên mới (mồ côi, như ở addSavingsFund) được gắn cờ trước.
        persist(
          fund.name !== originalName
            ? updateSalesOfFund(updateSalesOfFund(next, fund.name, markFundRemoved), originalName, (sale) => ({
                ...sale,
                fundName: fund.name,
              }))
            : next
        )
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
        // Lần bán đã gửi vào sổ này được gắn cờ fundRemoved trong cùng lần ghi (như xoá thẻ gỡ liên kết khỏi
        // khoản chi): 1 sổ mới trùng tên tạo sau không bao giờ bị rút tiền khi huỷ các lần bán cũ.
        persist(
          updateSalesOfFund(
            { ...current, savings: current.savings.filter((f) => f.name !== name) },
            name,
            markFundRemoved
          )
        )
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

  // Khoản chi gắn thẻ lưu TÊN thẻ trong budget-data, nên đổi tên/xoá thẻ ghi 2 key: finance-data trước,
  // rồi budget-data. Bước budget-data lỗi thì đặt lại đúng thẻ gốc vào finance-data đọc tươi — không
  // để thẻ đã đổi tên/đã xoá mà khoản chi vẫn trỏ tên cũ. Đặt lại cũng lỗi thì persist chưa kịp
  // setState, nên màn hình vẫn khớp finance-data; toast lỗi phía sau vẫn báo.
  const restoreCards = useCallback(
    (restore: (cards: CreditCard[]) => CreditCard[]) => {
      try {
        const fresh = getStoredFinance()
        persist({ ...fresh, cards: restore(fresh.cards) })
      } catch {
        // không còn gì để đảo thêm
      }
    },
    [persist]
  )

  // `balanceEdited` false: người dùng không sửa ô Dư nợ của "Sửa thẻ" — giữ dư nợ đọc tươi, vì trong
  // lúc hộp mở có thể đã có khoản quẹt/trả ghi vào thẻ (tab khác), số chép lúc mở hộp đã cũ.
  const updateCard = useCallback(
    (originalName: string, card: CreditCard, balanceEdited = true) => {
      const current = getStoredFinance()
      if (card.name !== originalName && current.cards.some((c) => c.name === card.name)) {
        toast.error(`Đã có thẻ tín dụng tên "${card.name}". Vui lòng chọn tên khác.`)
        return
      }
      const original = current.cards.find((c) => c.name === originalName)
      if (!original) {
        // Thẻ vừa bị xoá ở nơi khác: không ghi gì, kể cả đổi tên các khoản chi còn mang tên cũ.
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
        return
      }
      const saved: CreditCard = { ...card, balance: balanceEdited ? card.balance : original.balance }
      try {
        persist({
          ...current,
          cards: current.cards.map((c) => (c.name === originalName ? saved : c)),
        })
      } catch {
        toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
        return
      }
      if (card.name !== originalName) {
        try {
          renameCardInExpenses(originalName, card.name)
        } catch {
          restoreCards((cards) => cards.map((c) => (c.name === card.name ? original : c)))
          toast.error(`Không thể cập nhật thẻ tín dụng "${card.name}". Vui lòng thử lại.`)
          return
        }
      }
      toast.success(`Đã cập nhật thẻ tín dụng "${card.name}"`)
    },
    [persist, restoreCards]
  )

  const removeCard = useCallback(
    (name: string) => {
      const current = getStoredFinance()
      const index = current.cards.findIndex((c) => c.name === name)
      const original = current.cards[index]
      try {
        persist({ ...current, cards: current.cards.filter((c) => c.name !== name) })
      } catch {
        toast.error(`Không thể xoá thẻ tín dụng "${name}". Vui lòng thử lại.`)
        return
      }
      try {
        // Gỡ liên kết (giữ kind) để 1 thẻ mới cùng tên tạo sau không bị các khoản cũ đụng vào nợ.
        detachCardFromExpenses(name)
      } catch {
        if (original) {
          // Chèn lại đúng vị trí cũ (thứ tự thẻ là thứ tự hiển thị).
          restoreCards((cards) =>
            cards.some((c) => c.name === name) ? cards : [...cards.slice(0, index), original, ...cards.slice(index)]
          )
        }
        toast.error(`Không thể xoá thẻ tín dụng "${name}". Vui lòng thử lại.`)
        return
      }
      toast.success(`Đã xoá thẻ tín dụng "${name}"`)
    },
    [persist, restoreCards]
  )

  const goldActions = useMetalActions(GOLD_LENS, persist)
  const silverActions = useMetalActions(SILVER_LENS, persist)

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
    goldGifts: state.goldGifts,
    goldSales: state.goldSales,
    silver: state.silver,
    silverStores: state.silverStores,
    silverGifts: state.silverGifts,
    silverSales: state.silverSales,
    invests: state.invests,
    hydrated,
    addSavingsFund,
    updateSavingsFund,
    removeSavingsFund,
    addCard,
    updateCard,
    removeCard,
    payCard,
    addGoldStore: goldActions.addStore,
    updateGoldStore: goldActions.updateStore,
    removeGoldStore: goldActions.removeStore,
    setGoldStorePrice: goldActions.setStorePrice,
    addGold: goldActions.addPurchase,
    updateGold: goldActions.updatePurchase,
    removeGold: goldActions.removePurchase,
    addGoldGift: goldActions.addGift,
    updateGoldGift: goldActions.updateGift,
    removeGoldGift: goldActions.removeGift,
    addGoldSale: goldActions.addSale,
    removeGoldSale: goldActions.removeSale,
    addSilverStore: silverActions.addStore,
    updateSilverStore: silverActions.updateStore,
    removeSilverStore: silverActions.removeStore,
    setSilverStorePrice: silverActions.setStorePrice,
    addSilver: silverActions.addPurchase,
    updateSilver: silverActions.updatePurchase,
    removeSilver: silverActions.removePurchase,
    addSilverGift: silverActions.addGift,
    updateSilverGift: silverActions.updateGift,
    removeSilverGift: silverActions.removeGift,
    addSilverSale: silverActions.addSale,
    removeSilverSale: silverActions.removeSale,
    addInvest,
    updateInvest,
    removeInvest,
    replaceFinance: persist,
  }
}

export { useFinance }
