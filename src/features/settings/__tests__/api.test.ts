import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { pullSnapshot, pushSnapshot, SECRET_CHARSET_ERROR } from "../api"
import type { ExportPayload } from "../data-transfer"

// Các test chặn secret không bao giờ tới fetch, nên payload chỉ cần đúng kiểu.
const PAYLOAD = { version: 1, exportedAt: "2026-09-28T00:00:00.000Z" } as unknown as ExportPayload

describe("api — secret có ký tự ngoài Latin-1", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("pushSnapshot explains the secret problem instead of reporting a network failure, without calling fetch", async () => {
    const result = await pushSnapshot("bí mật đồng bộ", PAYLOAD)

    expect(result).toEqual({ ok: false, error: SECRET_CHARSET_ERROR })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("pullSnapshot does the same", async () => {
    const result = await pullSnapshot("bí mật đồng bộ")

    expect(result).toEqual({ ok: false, error: SECRET_CHARSET_ERROR })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("still sends a secret whose characters all fit in a header (Latin-1, vd. 'é')", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ summary: "Đã lưu" }) })

    const result = await pushSnapshot("café-secret", PAYLOAD)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ ok: true, summary: "Đã lưu" })
  })
})
