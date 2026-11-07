import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@vercel/blob", () => {
  class BlobNotFoundError extends Error {}
  class BlobPreconditionFailedError extends Error {}
  return {
    BlobNotFoundError,
    BlobPreconditionFailedError,
    copy: vi.fn(),
    del: vi.fn(),
    get: vi.fn(),
    head: vi.fn(),
    list: vi.fn(),
    put: vi.fn(),
  }
})

import { BlobNotFoundError, BlobPreconditionFailedError, copy, del, get, head, list, put } from "@vercel/blob"
import { GET, POST } from "../route"
import { GET as GET_HISTORY } from "../history/route"

const SECRET = "test-secret"

const VALID_PAYLOAD = {
  version: 1,
  exportedAt: "2026-08-17T00:00:00.000Z",
  journal: { entries: [] },
  finance: { savings: [], cards: [], gold: [], goldPrice: "", invests: [] },
  study: { tasks: [], learned: [] },
  settings: { profile: { displayName: "", greeting: "" }, moods: [], modules: [] },
}

const CURRENT_UPLOADED_AT = new Date("2026-11-06T14:05:00.000Z")

function requestWith(
  method: string,
  options: { auth?: string; body?: unknown; headers?: Record<string, string>; url?: string } = {}
) {
  const headers: Record<string, string> = { ...options.headers }
  if (options.auth !== undefined) headers.authorization = options.auth
  if (options.body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest(options.url ?? "http://localhost/api/sync", {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

function cloudHas(etag: string) {
  vi.mocked(head).mockResolvedValue({ etag, uploadedAt: CURRENT_UPLOADED_AT } as never)
}

function cloudIsEmpty() {
  vi.mocked(head).mockRejectedValue(new BlobNotFoundError())
}

function storedText(text: string) {
  vi.mocked(get).mockResolvedValue({
    statusCode: 200,
    stream: new Response(text).body,
    blob: { contentType: "application/json", etag: "from-get" },
  } as never)
}

describe("/api/sync", () => {
  beforeEach(() => {
    vi.stubEnv("SYNC_SECRET", SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    for (const fn of [copy, del, get, head, list, put]) vi.mocked(fn).mockReset()
  })

  it("returns 500 when SYNC_SECRET isn't configured on the server", async () => {
    vi.stubEnv("SYNC_SECRET", "")

    const response = await GET(requestWith("GET", { auth: `Bearer ${SECRET}` }))

    expect(response.status).toBe(500)
    expect(get).not.toHaveBeenCalled()
  })

  it("rejects GET with a missing or wrong Authorization header", async () => {
    const missing = await GET(requestWith("GET"))
    expect(missing.status).toBe(401)

    const wrong = await GET(requestWith("GET", { auth: "Bearer nope" }))
    expect(wrong.status).toBe(401)

    expect(get).not.toHaveBeenCalled()
  })

  it("returns 404 when no snapshot has been pushed yet", async () => {
    cloudIsEmpty()

    const response = await GET(requestWith("GET", { auth: `Bearer ${SECRET}` }))

    expect(response.status).toBe(404)
    expect(get).not.toHaveBeenCalled()
  })

  it("returns the stored snapshot text with the ETag read before the content", async () => {
    const text = JSON.stringify(VALID_PAYLOAD)
    const order: string[] = []
    vi.mocked(head).mockImplementation(async () => {
      order.push("head")
      return { etag: "etag-current", uploadedAt: CURRENT_UPLOADED_AT } as never
    })
    vi.mocked(get).mockImplementation(async () => {
      order.push("get")
      return { statusCode: 200, stream: new Response(text).body, blob: { etag: "from-get" } } as never
    })

    const response = await GET(requestWith("GET", { auth: `Bearer ${SECRET}` }))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(text)
    // Cùng nguồn với ETag mà POST so (head/put), không phải header HTTP của get.
    expect(response.headers.get("X-Sync-Etag")).toBe("etag-current")
    expect(order).toEqual(["head", "get"])
  })

  it("returns an older version from the history without an ETag", async () => {
    const text = JSON.stringify(VALID_PAYLOAD)
    storedText(text)

    const response = await GET(
      requestWith("GET", { auth: `Bearer ${SECRET}`, url: "http://localhost/api/sync?version=1762437900000" })
    )

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(text)
    expect(response.headers.get("X-Sync-Etag")).toBeNull()
    expect(get).toHaveBeenCalledWith("sync/history/1762437900000.json", expect.anything())
    expect(head).not.toHaveBeenCalled()
  })

  it("refuses a version id that could point outside the history folder", async () => {
    const response = await GET(
      requestWith("GET", { auth: `Bearer ${SECRET}`, url: "http://localhost/api/sync?version=../snapshot" })
    )

    expect(response.status).toBe(400)
    expect(get).not.toHaveBeenCalled()
  })

  it("says an older version is gone when the history no longer has it", async () => {
    vi.mocked(get).mockResolvedValue(null as never)

    const response = await GET(
      requestWith("GET", { auth: `Bearer ${SECRET}`, url: "http://localhost/api/sync?version=1762437900000" })
    )

    expect(response.status).toBe(404)
    expect((await response.json()).error).toBe("Không còn bản sao này trên đám mây.")
  })

  it("rejects POST with a missing or wrong Authorization header, without writing anything", async () => {
    const response = await POST(requestWith("POST", { body: VALID_PAYLOAD }))

    expect(response.status).toBe(401)
    expect(put).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload with 400 and does not write to Blob", async () => {
    const response = await POST(requestWith("POST", { auth: `Bearer ${SECRET}`, body: { not: "a snapshot" } }))

    expect(response.status).toBe(400)
    expect(put).not.toHaveBeenCalled()
  })

  it("stores the first snapshot, reports the summary and the new ETag", async () => {
    cloudIsEmpty()
    vi.mocked(put).mockResolvedValue({ etag: "etag-new" } as never)
    vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false } as never)

    const response = await POST(requestWith("POST", { auth: `Bearer ${SECRET}`, body: VALID_PAYLOAD }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      ok: true,
      summary: "0 bài nhật ký · 0 lần mua vàng · 0 lần mua bạc · 0 từ đã học · đã tải lên tiết kiệm, nợ thẻ, mục tiêu",
      etag: "etag-new",
    })
    expect(put).toHaveBeenCalledWith(
      "sync/snapshot.json",
      JSON.stringify(VALID_PAYLOAD),
      expect.objectContaining({ access: "private", allowOverwrite: true })
    )
    expect(copy).not.toHaveBeenCalled()
  })

  it("replaces the snapshot this device was based on, keeping the old one in the history first", async () => {
    cloudHas('"etag-current"')
    const order: string[] = []
    vi.mocked(copy).mockImplementation(async () => {
      order.push("copy")
      return {} as never
    })
    vi.mocked(put).mockImplementation(async () => {
      order.push("put")
      return { etag: "etag-new" } as never
    })
    vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false } as never)

    const response = await POST(
      requestWith("POST", {
        auth: `Bearer ${SECRET}`,
        body: VALID_PAYLOAD,
        // Cùng 1 ETag dù có ngoặc kép hay không.
        headers: { "x-sync-base-etag": "etag-current" },
      })
    )

    expect(response.status).toBe(200)
    expect(order).toEqual(["copy", "put"])
    expect(copy).toHaveBeenCalledWith(
      "sync/snapshot.json",
      `sync/history/${CURRENT_UPLOADED_AT.getTime()}.json`,
      expect.objectContaining({ access: "private" })
    )
    // Máy khác tải lên chen giữa lúc đọc và lúc ghi cũng không ghi đè được.
    expect(put).toHaveBeenCalledWith(
      "sync/snapshot.json",
      JSON.stringify(VALID_PAYLOAD),
      expect.objectContaining({ ifMatch: '"etag-current"' })
    )
  })

  it("refuses with 409 and writes nothing when another device uploaded since this one's base", async () => {
    cloudHas("etag-from-other-device")

    const response = await POST(
      requestWith("POST", {
        auth: `Bearer ${SECRET}`,
        body: VALID_PAYLOAD,
        headers: { "x-sync-base-etag": "etag-this-device-saw" },
      })
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.conflict).toBe(true)
    expect(json.cloudUploadedAt).toBe(CURRENT_UPLOADED_AT.toISOString())
    expect(copy).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
  })

  it("refuses with 409 when this device never synced but the cloud already has a copy", async () => {
    cloudHas("etag-current")

    const response = await POST(requestWith("POST", { auth: `Bearer ${SECRET}`, body: VALID_PAYLOAD }))

    expect(response.status).toBe(409)
    expect(put).not.toHaveBeenCalled()
  })

  it("overwrites anyway when the user chose to, still keeping the old copy", async () => {
    cloudHas("etag-from-other-device")
    vi.mocked(put).mockResolvedValue({ etag: "etag-new" } as never)
    vi.mocked(list).mockResolvedValue({ blobs: [], hasMore: false } as never)

    const response = await POST(
      requestWith("POST", { auth: `Bearer ${SECRET}`, body: VALID_PAYLOAD, headers: { "x-sync-force": "1" } })
    )

    expect(response.status).toBe(200)
    expect(copy).toHaveBeenCalled()
    expect(put).toHaveBeenCalledWith(
      "sync/snapshot.json",
      JSON.stringify(VALID_PAYLOAD),
      expect.objectContaining({ ifMatch: "etag-from-other-device" })
    )
  })

  it("turns a write raced by another device into a 409 instead of an error", async () => {
    cloudHas("etag-current")
    vi.mocked(put).mockRejectedValue(new BlobPreconditionFailedError())

    const response = await POST(
      requestWith("POST", {
        auth: `Bearer ${SECRET}`,
        body: VALID_PAYLOAD,
        headers: { "x-sync-base-etag": "etag-current" },
      })
    )

    expect(response.status).toBe(409)
    expect((await response.json()).conflict).toBe(true)
  })

  it("keeps only the 10 newest versions in the history", async () => {
    cloudHas("etag-current")
    vi.mocked(put).mockResolvedValue({ etag: "etag-new" } as never)
    const ids = Array.from({ length: 12 }, (_, i) => String(1_762_000_000_000 + i * 1000))
    vi.mocked(list).mockResolvedValue({
      blobs: [...ids].reverse().map((id) => ({ pathname: `sync/history/${id}.json`, size: 10 })),
      hasMore: false,
    } as never)

    const response = await POST(
      requestWith("POST", {
        auth: `Bearer ${SECRET}`,
        body: VALID_PAYLOAD,
        headers: { "x-sync-base-etag": "etag-current" },
      })
    )

    expect(response.status).toBe(200)
    expect(del).toHaveBeenCalledWith([`sync/history/${ids[1]}.json`, `sync/history/${ids[0]}.json`])
  })

  it("still reports a successful upload when tidying the history fails", async () => {
    cloudHas("etag-current")
    vi.mocked(put).mockResolvedValue({ etag: "etag-new" } as never)
    vi.mocked(list).mockRejectedValue(new Error("blob down"))

    const response = await POST(
      requestWith("POST", {
        auth: `Bearer ${SECRET}`,
        body: VALID_PAYLOAD,
        headers: { "x-sync-base-etag": "etag-current" },
      })
    )

    expect(response.status).toBe(200)
  })
})

describe("/api/sync/history", () => {
  beforeEach(() => {
    vi.stubEnv("SYNC_SECRET", SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(list).mockReset()
  })

  it("rejects a wrong secret", async () => {
    const response = await GET_HISTORY(
      requestWith("GET", { auth: "Bearer nope", url: "http://localhost/api/sync/history" })
    )

    expect(response.status).toBe(401)
    expect(list).not.toHaveBeenCalled()
  })

  it("lists the older versions newest first, ignoring anything that isn't one", async () => {
    vi.mocked(list).mockResolvedValue({
      blobs: [
        { pathname: "sync/history/1762000000000.json", size: 100 },
        { pathname: "sync/history/1762437900000.json", size: 200 },
        { pathname: "sync/history/notes.txt", size: 5 },
      ],
      hasMore: false,
    } as never)

    const response = await GET_HISTORY(
      requestWith("GET", { auth: `Bearer ${SECRET}`, url: "http://localhost/api/sync/history" })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      versions: [
        { id: "1762437900000", size: 200, uploadedAt: new Date(1762437900000).toISOString() },
        { id: "1762000000000", size: 100, uploadedAt: new Date(1762000000000).toISOString() },
      ],
    })
    expect(list).toHaveBeenCalledWith({ prefix: "sync/history/" })
  })
})
