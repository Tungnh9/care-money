// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GET } from "../route"

describe("/api/life-plan/images/status", () => {
  beforeEach(() => {
    // Trang hỏi route này cả khi máy chưa nhập khoá đồng bộ — không được phụ thuộc SYNC_SECRET.
    vi.stubEnv("SYNC_SECRET", undefined)
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo")
    vi.stubEnv("CLOUDINARY_API_KEY", "123456789012345")
    vi.stubEnv("CLOUDINARY_API_SECRET", "abcd")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("reports Cloudinary as configured when all three variables are set, revealing none of them", async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ configured: true })
  })

  it.each(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"])(
    "reports Cloudinary as not configured when %s is missing",
    async (name) => {
      vi.stubEnv(name, undefined)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ configured: false })
    }
  )
})
