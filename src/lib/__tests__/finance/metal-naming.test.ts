import { describe, it, expect } from "vitest"

import { GOLD_NAMING, SILVER_NAMING } from "@/lib/finance/metal-naming"

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
})
