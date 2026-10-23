import { describe, it, expect } from "vitest"

import { cardLinkKindForTag, cardDebtDelta } from "@/lib/budget/card-link"

describe("card-link", () => {
  it("maps only the two card tags to a link kind", () => {
    expect(cardLinkKindForTag("Quẹt thẻ")).toBe("swipe")
    expect(cardLinkKindForTag("Trả nợ thẻ")).toBe("payment")
    expect(cardLinkKindForTag("Ăn uống")).toBeNull()
    expect(cardLinkKindForTag(null)).toBeNull()
  })

  it("raises the debt for a swipe and lowers it for a payment", () => {
    expect(cardDebtDelta("swipe", 500_000)).toBe(500_000)
    expect(cardDebtDelta("payment", 500_000)).toBe(-500_000)
    expect(cardDebtDelta("swipe", -200_000)).toBe(-200_000)
  })
})
