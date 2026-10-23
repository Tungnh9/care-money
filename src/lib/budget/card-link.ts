import type { CardLinkKind } from "@/lib/budget/types"

const CARD_SWIPE_TAG_LABEL = "Quẹt thẻ"
const CARD_SWIPE_TAG_EMOJI = "🧾"
const CARD_PAYMENT_TAG_LABEL = "Trả nợ thẻ"

// Chỉ 2 nhãn này mới gắn khoản chi với 1 thẻ; mọi nhãn khác (kể cả không nhãn) là khoản chi thường.
function cardLinkKindForTag(label: string | null | undefined): CardLinkKind | null {
  if (label === CARD_SWIPE_TAG_LABEL) return "swipe"
  if (label === CARD_PAYMENT_TAG_LABEL) return "payment"
  return null
}

// Độ lệch nợ thẻ khi số tiền khoản chi đổi `amountChange`: quẹt làm nợ tăng, trả làm nợ giảm.
// `amountChange` âm (sửa giảm, hoặc xoá) thì đảo chiều theo.
function cardDebtDelta(kind: CardLinkKind, amountChange: number): number {
  return kind === "swipe" ? amountChange : -amountChange
}

export { CARD_SWIPE_TAG_LABEL, CARD_SWIPE_TAG_EMOJI, CARD_PAYMENT_TAG_LABEL, cardLinkKindForTag, cardDebtDelta }
