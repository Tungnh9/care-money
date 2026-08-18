import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

vi.mock("@vercel/blob", () => ({
  get: vi.fn(),
  put: vi.fn(),
}))

import { get, put } from "@vercel/blob"
import { GET, POST } from "../route"

const SECRET = "test-secret"

const VALID_PAYLOAD = {
  version: 1,
  exportedAt: "2026-08-17T00:00:00.000Z",
  journal: { entries: [] },
  finance: { savings: [], cards: [], gold: [], goldPrice: "", invests: [] },
  study: { tasks: [], learned: [] },
  settings: { profile: { displayName: "", greeting: "" }, moods: [], modules: [] },
}

function requestWith(method: string, options: { auth?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {}
  if (options.auth !== undefined) headers.authorization = options.auth
  if (options.body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest("http://localhost/api/sync", {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

describe("/api/sync", () => {
  beforeEach(() => {
    vi.stubEnv("SYNC_SECRET", SECRET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(get).mockReset()
    vi.mocked(put).mockReset()
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
    vi.mocked(get).mockResolvedValue(null as never)

    const response = await GET(requestWith("GET", { auth: `Bearer ${SECRET}` }))

    expect(response.status).toBe(404)
  })

  it("returns the stored snapshot text on a successful GET", async () => {
    const text = JSON.stringify(VALID_PAYLOAD)
    vi.mocked(get).mockResolvedValue({
      statusCode: 200,
      stream: new Response(text).body,
      blob: { contentType: "application/json" },
    } as never)

    const response = await GET(requestWith("GET", { auth: `Bearer ${SECRET}` }))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(text)
  })

  it("rejects POST with a missing or wrong Authorization header, without writing anything", async () => {
    const response = await POST(requestWith("POST", { body: VALID_PAYLOAD }))

    expect(response.status).toBe(401)
    expect(put).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload with 400 and does not write to Blob", async () => {
    const response = await POST(
      requestWith("POST", { auth: `Bearer ${SECRET}`, body: { not: "a snapshot" } })
    )

    expect(response.status).toBe(400)
    expect(put).not.toHaveBeenCalled()
  })

  it("stores a valid payload with allowOverwrite and reports the summary", async () => {
    vi.mocked(put).mockResolvedValue({} as never)

    const response = await POST(
      requestWith("POST", { auth: `Bearer ${SECRET}`, body: VALID_PAYLOAD })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(put).toHaveBeenCalledWith(
      "sync/snapshot.json",
      JSON.stringify(VALID_PAYLOAD),
      expect.objectContaining({ access: "private", allowOverwrite: true })
    )
  })
})
