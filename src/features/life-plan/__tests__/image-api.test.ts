import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { deleteLifePlanImage, fetchImagesConfigured, fetchLifePlanImage, uploadLifePlanImage } from "../image-api"
import type { LifePlanImage } from "@/lib/life-plan/types"
import { SECRET_CHARSET_ERROR } from "@/lib/sync-secret-storage"

const SECRET = "test-secret"
const PHOTO: LifePlanImage = {
  id: "life-plan/development/abcdefghij0123456789",
  bytes: 245_000,
  width: 1600,
  height: 1200,
}

const fetchMock = vi.fn()

// Đúng những gì route /api/life-plan/images trả: JSON (NextResponse.json) cho mọi lỗi và cho tải lên / xoá.
function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status })
}

function call(index = 0): { url: URL; init: RequestInit } {
  const [input, init] = fetchMock.mock.calls[index] as [string, RequestInit | undefined]
  return { url: new URL(input, "http://localhost"), init: init ?? {} }
}

function authorization(init: RequestInit): string | null {
  return new Headers(init.headers).get("authorization")
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("uploadLifePlanImage", () => {
  const shrunk = new Blob(["webp-bytes"], { type: "image/webp" })

  it("posts the photo as `file` with the sync secret as a Bearer token and returns the stored photo", async () => {
    fetchMock.mockResolvedValue(jsonResponse(PHOTO, 201))

    await expect(uploadLifePlanImage(shrunk, SECRET)).resolves.toEqual(PHOTO)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const { url, init } = call()
    expect(url.pathname).toBe("/api/life-plan/images")
    expect(init.method).toBe("POST")
    expect(authorization(init)).toBe(`Bearer ${SECRET}`)
    const file = (init.body as FormData).get("file")
    expect(file).toBeInstanceOf(Blob)
    expect((file as Blob).type).toBe("image/webp")
    expect(await (file as Blob).text()).toBe("webp-bytes")
  })

  it("rejects with the server's own sentence", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Sai secret đồng bộ." }, 401))

    await expect(uploadLifePlanImage(shrunk, SECRET)).rejects.toThrow("Sai secret đồng bộ.")
  })

  it("rejects with a general sentence when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(uploadLifePlanImage(shrunk, SECRET)).rejects.toThrow("Không tải được ảnh lên. Vui lòng thử lại.")
  })

  it("rejects with a general sentence when an error answer is not the server's JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Request Entity Too Large</html>", { status: 413 }))

    await expect(uploadLifePlanImage(shrunk, SECRET)).rejects.toThrow("Không tải được ảnh lên. Vui lòng thử lại.")
  })

  it("rejects instead of returning a photo the server did not describe fully", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: PHOTO.id, width: 1600, height: 1200 }, 201))

    await expect(uploadLifePlanImage(shrunk, SECRET)).rejects.toThrow("Không tải được ảnh lên. Vui lòng thử lại.")
  })
})

describe("fetchLifePlanImage", () => {
  it("gets the photo's bytes by its id with the sync secret", async () => {
    fetchMock.mockResolvedValue(
      new Response("RIFF-webp-bytes", {
        headers: { "Content-Type": "image/webp", "Cache-Control": "private, max-age=31536000, immutable" },
      })
    )

    const blob = await fetchLifePlanImage(PHOTO.id, SECRET)

    expect(blob.type).toBe("image/webp")
    // Blob của jsdom chỉ có text() (polyfill trong src/test/setup.ts), không có arrayBuffer().
    expect(await blob.text()).toBe("RIFF-webp-bytes")
    const { url, init } = call()
    expect(url.pathname).toBe("/api/life-plan/images")
    expect(url.searchParams.get("id")).toBe(PHOTO.id)
    expect(init.method ?? "GET").toBe("GET")
    expect(authorization(init)).toBe(`Bearer ${SECRET}`)
  })

  it("keeps the private photo out of the browser's HTTP cache, which Bắt đầu lại cannot clear", async () => {
    fetchMock.mockResolvedValue(new Response("RIFF-webp-bytes", { headers: { "Content-Type": "image/webp" } }))

    await fetchLifePlanImage(PHOTO.id, SECRET)

    // Bản trên máy nằm ở IndexedDB (image-cache) — "Bắt đầu lại" xoá được nơi đó, còn HTTP cache thì không.
    expect(call().init.cache).toBe("no-store")
  })

  it("rejects with the server's own sentence", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "Không tìm thấy ảnh." }, 404))

    await expect(fetchLifePlanImage(PHOTO.id, SECRET)).rejects.toThrow("Không tìm thấy ảnh.")
  })

  it("rejects with a general sentence when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(fetchLifePlanImage(PHOTO.id, SECRET)).rejects.toThrow("Không tải được ảnh về. Vui lòng thử lại.")
  })
})

describe("deleteLifePlanImage", () => {
  it("deletes the photo by its id with the sync secret and says whether Cloudinary removed it", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true })).mockResolvedValueOnce(jsonResponse({ ok: false }))

    await expect(deleteLifePlanImage(PHOTO.id, SECRET)).resolves.toBe(true)
    await expect(deleteLifePlanImage(PHOTO.id, SECRET)).resolves.toBe(false)

    const { url, init } = call()
    expect(url.pathname).toBe("/api/life-plan/images")
    expect(url.searchParams.get("id")).toBe(PHOTO.id)
    expect(init.method).toBe("DELETE")
    expect(authorization(init)).toBe(`Bearer ${SECRET}`)
  })

  it("rejects with the server's own sentence", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: false, error: "Không xoá được ảnh trên Cloudinary. Vui lòng thử lại." }, 502)
    )

    await expect(deleteLifePlanImage(PHOTO.id, SECRET)).rejects.toThrow(
      "Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."
    )
  })

  it("rejects with a general sentence when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(deleteLifePlanImage(PHOTO.id, SECRET)).rejects.toThrow(
      "Không xoá được ảnh trên Cloudinary. Vui lòng thử lại."
    )
  })
})

describe("a sync secret with characters outside Latin-1", () => {
  const shrunk = new Blob(["webp-bytes"], { type: "image/webp" })
  // Gõ lại khoá khi bộ gõ tiếng Việt đang bật.
  const UNSENDABLE_SECRET = "bí mật đồng bộ"
  const LATIN1_SECRET = "café-secret"

  it.each([
    ["uploadLifePlanImage", () => uploadLifePlanImage(shrunk, UNSENDABLE_SECRET)],
    ["fetchLifePlanImage", () => fetchLifePlanImage(PHOTO.id, UNSENDABLE_SECRET)],
    ["deleteLifePlanImage", () => deleteLifePlanImage(PHOTO.id, UNSENDABLE_SECRET)],
  ])("%s explains the secret problem instead of asking to retry, without calling fetch", async (_name, send) => {
    // Như fetch thật: header có ký tự mã > 255 thì ném TypeError lúc dựng request, trước khi gửi.
    fetchMock.mockRejectedValue(new TypeError("Cannot convert argument to a ByteString"))

    await expect(send()).rejects.toThrow(SECRET_CHARSET_ERROR)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("still sends a secret whose characters all fit in a header (Latin-1, vd. 'é')", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(PHOTO, 201))
      .mockResolvedValueOnce(new Response("RIFF-webp-bytes", { headers: { "Content-Type": "image/webp" } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    await expect(uploadLifePlanImage(shrunk, LATIN1_SECRET)).resolves.toEqual(PHOTO)
    await expect(fetchLifePlanImage(PHOTO.id, LATIN1_SECRET)).resolves.toBeDefined()
    await expect(deleteLifePlanImage(PHOTO.id, LATIN1_SECRET)).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledTimes(3)
    // new Headers kiểm giá trị header như fetch thật: khoá không gửi được thì đã ném lỗi ở đây.
    for (const index of [0, 1, 2]) expect(authorization(call(index).init)).toBe(`Bearer ${LATIN1_SECRET}`)
  })
})

describe("fetchImagesConfigured", () => {
  it("asks the status route, without the sync secret, whether the server has Cloudinary", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ configured: true }))
      .mockResolvedValueOnce(jsonResponse({ configured: false }))

    await expect(fetchImagesConfigured()).resolves.toBe(true)
    await expect(fetchImagesConfigured()).resolves.toBe(false)

    const { url, init } = call()
    expect(url.pathname).toBe("/api/life-plan/images/status")
    expect(authorization(init)).toBeNull()
  })

  it("rejects with a general sentence when the server cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(fetchImagesConfigured()).rejects.toThrow("Không kiểm tra được máy chủ ảnh. Vui lòng thử lại.")
  })
})
