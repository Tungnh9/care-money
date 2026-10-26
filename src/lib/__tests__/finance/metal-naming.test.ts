import { describe, it, expect } from "vitest"

import { GOLD_NAMING, SILVER_NAMING, formatTakenOut, takenOutParts } from "@/lib/finance/metal-naming"

describe("metal naming", () => {
  it("names gold in phân and shows a weight in chỉ/phân", () => {
    expect(GOLD_NAMING.noun).toBe("vàng")
    expect(GOLD_NAMING.unit).toBe("phân")
    expect(GOLD_NAMING.formatQuantity(12)).toBe("1 chỉ 2 phân")
  })

  it("names silver in lượng with no conversion", () => {
    expect(SILVER_NAMING.noun).toBe("bạc")
    expect(SILVER_NAMING.unit).toBe("lượng")
    expect(SILVER_NAMING.formatQuantity(3)).toBe("3 lượng")
  })

  it("says how much of a purchase was given away and sold", () => {
    expect(formatTakenOut(GOLD_NAMING, 1, 0)).toBe("đã tặng 1 phân")
    expect(formatTakenOut(GOLD_NAMING, 0, 12)).toBe("đã bán 1 chỉ 2 phân")
    expect(formatTakenOut(SILVER_NAMING, 1, 2)).toBe("đã tặng 1 lượng · đã bán 2 lượng")
    expect(formatTakenOut(GOLD_NAMING, 0, 0)).toBeNull()
  })

  it("lists the parts taken out of a purchase separately, gifts before sales", () => {
    expect(takenOutParts(GOLD_NAMING, 12, 25)).toEqual(["đã tặng 1 chỉ 2 phân", "đã bán 2 chỉ 5 phân"])
    expect(takenOutParts(SILVER_NAMING, 0, 2)).toEqual(["đã bán 2 lượng"])
    expect(takenOutParts(GOLD_NAMING, 0, 0)).toEqual([])
  })
})
