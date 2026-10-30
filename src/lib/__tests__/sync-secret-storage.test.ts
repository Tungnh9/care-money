import { describe, it, expect } from "vitest"

import { hasUnsendableChar } from "../sync-secret-storage"

// Ranh giới đúng như fetch thật: giá trị header chỉ nhận ký tự mã ≤ 255.
describe("hasUnsendableChar", () => {
  it("lets through every secret a header can carry, up to 'ÿ' (U+00FF)", () => {
    expect(hasUnsendableChar("")).toBe(false)
    expect(hasUnsendableChar("plain-ASCII_secret 123")).toBe(false)
    expect(hasUnsendableChar("café-secret ÿ")).toBe(false)
  })

  it("flags a secret with any character above U+00FF — Vietnamese letters, 'Ā', emoji", () => {
    expect(hasUnsendableChar("bí mật đồng bộ")).toBe(true)
    expect(hasUnsendableChar("Ā")).toBe(true)
    expect(hasUnsendableChar("secret😀")).toBe(true)
  })
})
