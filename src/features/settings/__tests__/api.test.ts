import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { listCloudVersions, pullSnapshot, pushSnapshot } from "../api"
import type { ExportPayload } from "@/lib/data-transfer"
import { SECRET_CHARSET_ERROR } from "@/lib/sync-secret-storage"

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
    const result = await pushSnapshot("bí mật đồng bộ", PAYLOAD, { baseEtag: null })

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

    const result = await pushSnapshot("café-secret", PAYLOAD, { baseEtag: null })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ ok: true, summary: "Đã lưu", etag: null })
  })
})

describe("api — bảo vệ ghi đè bản đám mây", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function sentHeaders(): Record<string, string> {
    return fetchMock.mock.calls[0][1].headers
  }

  it("sends the ETag this device is based on, and returns the new one", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ summary: "Đã lưu", etag: "etag-new" }) })

    const result = await pushSnapshot("secret", PAYLOAD, { baseEtag: "etag-base" })

    expect(sentHeaders()["X-Sync-Base-Etag"]).toBe("etag-base")
    expect(sentHeaders()["X-Sync-Force"]).toBeUndefined()
    expect(result).toEqual({ ok: true, summary: "Đã lưu", etag: "etag-new" })
  })

  it("sends no base when this device never synced, and the force flag only when asked", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ summary: "Đã lưu", etag: "e" }) })

    await pushSnapshot("secret", PAYLOAD, { baseEtag: null, force: true })

    expect(sentHeaders()["X-Sync-Base-Etag"]).toBeUndefined()
    expect(sentHeaders()["X-Sync-Force"]).toBe("1")
  })

  it("reports a conflict with when the cloud copy was uploaded", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "Đã đổi.", conflict: true, cloudUploadedAt: "2026-11-06T14:05:00.000Z" }),
    })

    const result = await pushSnapshot("secret", PAYLOAD, { baseEtag: "etag-base" })

    expect(result).toEqual({ ok: false, error: "Đã đổi.", conflict: true, cloudUploadedAt: "2026-11-06T14:05:00.000Z" })
  })

  it("returns the ETag of the current cloud copy with a pull", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "X-Sync-Etag": "etag-current" }),
      text: async () => JSON.stringify({ version: 1, exportedAt: "2026-11-06T14:05:00.000Z" }),
    })

    const result = await pullSnapshot("secret")

    expect(fetchMock.mock.calls[0][0]).toBe("/api/sync")
    expect(result).toMatchObject({ ok: true, etag: "etag-current", exportedAt: "2026-11-06T14:05:00.000Z" })
  })

  it("pulls an older version by id, with no ETag", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "X-Sync-Etag": "ignored" }),
      text: async () => JSON.stringify({ version: 1 }),
    })

    const result = await pullSnapshot("secret", "1762437900000")

    expect(fetchMock.mock.calls[0][0]).toBe("/api/sync?version=1762437900000")
    expect(result).toMatchObject({ ok: true, etag: null })
  })

  it("says an older version is gone instead of 'no sync yet'", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })

    expect(await pullSnapshot("secret", "1762437900000")).toEqual({
      ok: false,
      error: "Không còn bản sao này trên đám mây.",
    })
  })

  it("lists the older cloud versions, dropping malformed rows", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        versions: [
          { id: "1762437900000", uploadedAt: "2026-11-06T14:05:00.000Z", size: 200 },
          { id: 5, uploadedAt: null },
        ],
      }),
    })

    expect(await listCloudVersions("secret")).toEqual({
      ok: true,
      versions: [{ id: "1762437900000", uploadedAt: "2026-11-06T14:05:00.000Z", size: 200 }],
    })
  })

  it("maps a wrong secret and a network failure when listing versions", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
    expect(await listCloudVersions("secret")).toEqual({ ok: false, error: "Sai secret đồng bộ." })

    fetchMock.mockRejectedValueOnce(new TypeError("offline"))
    expect(await listCloudVersions("secret")).toEqual({ ok: false, error: "Không kết nối được máy chủ đồng bộ." })
  })
})
