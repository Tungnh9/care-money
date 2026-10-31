// @vitest-environment node
// Route handler chạy trên Node — test trong môi trường Node để FormData/File của request là bản thật của Node
// (FormData của jsdom không gửi được qua Request của Node).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

import { DELETE, GET, POST } from "../route"

const SECRET = "test-secret"
const AUTH = `Bearer ${SECRET}`
const PHOTO_ID = "life-plan/production/a1b2c3d4e5f6g7h8i9j0"
const MB = 1024 * 1024

const SIGNED_PHOTO_URL =
  /^https:\/\/res\.cloudinary\.com\/demo\/image\/authenticated\/s--[A-Za-z0-9_-]{8}--\/life-plan\/production\/a1b2c3d4e5f6g7h8i9j0$/

type Method = "GET" | "POST" | "DELETE"

function requestWith(method: Method, options: { auth?: string; id?: string; form?: FormData } = {}) {
  const url = new URL("http://localhost/api/life-plan/images")
  if (options.id !== undefined) url.searchParams.set("id", options.id)
  const headers: Record<string, string> = {}
  if (options.auth !== undefined) headers.authorization = options.auth
  return new NextRequest(url, { method, headers, body: options.form })
}

function formWith(file: Blob | string): FormData {
  const form = new FormData()
  form.append("file", file)
  return form
}

function webp(size = 16): Blob {
  return new Blob([new Uint8Array(size)], { type: "image/webp" })
}

// Gọi đúng handler của method — để 1 test đi qua cả 3 method.
function send(method: Method, options: { auth?: string; id?: string; form?: FormData }) {
  const request = requestWith(method, options)
  if (method === "POST") return POST(request)
  if (method === "GET") return GET(request)
  return DELETE(request)
}

// Kết quả upload thật của Cloudinary, đủ các field theo tài liệu — có cả link có chữ ký `url`/`secure_url`.
function uploadResult(publicId: string, folder: string) {
  return {
    asset_id: "3515c6000a548515f1134043f9785c2f",
    public_id: publicId,
    version: 1793318401,
    version_id: "7d2cc533bee9ff39f7da7414b61fce7e",
    signature: "d0b1009e3271a942836c25756ce3e04d205bf754",
    width: 1600,
    height: 1200,
    format: "webp",
    resource_type: "image",
    created_at: "2026-10-30T00:00:01Z",
    tags: [],
    bytes: 245000,
    type: "authenticated",
    etag: "9b6c3f2a0e7d4c1b8a5f6e3d2c1b0a99",
    placeholder: false,
    url: `http://res.cloudinary.com/demo/image/authenticated/s--Xb7tQ1aZ--/v1793318401/${publicId}.webp`,
    secure_url: `https://res.cloudinary.com/demo/image/authenticated/s--Xb7tQ1aZ--/v1793318401/${publicId}.webp`,
    asset_folder: folder,
    display_name: publicId.split("/").pop(),
    original_filename: "blob",
    api_key: "123456789012345",
  }
}

// Mọi dòng server đã ghi ra console.error, gộp thành chữ — để kiểm có lý do của Cloudinary mà không có API secret.
function serverLog(spy: { mock: { calls: unknown[][] } }): string {
  return spy.mock.calls
    .map((args) => args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(" "))
    .join("\n")
}

describe("/api/life-plan/images", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv("SYNC_SECRET", SECRET)
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo")
    vi.stubEnv("CLOUDINARY_API_KEY", "123456789012345")
    vi.stubEnv("CLOUDINARY_API_SECRET", "abcd")
    vi.stubEnv("VERCEL_ENV", "production")
    vi.stubGlobal("fetch", fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    fetchMock.mockReset()
  })

  describe("checks shared by upload, view and delete", () => {
    const VALID: Record<Method, { id?: string; form?: () => FormData }> = {
      POST: { form: () => formWith(webp()) },
      GET: { id: PHOTO_ID },
      DELETE: { id: PHOTO_ID },
    }

    it.each(["POST", "GET", "DELETE"] as const)(
      "%s refuses a missing or wrong sync key with 401, without calling Cloudinary",
      async (method) => {
        const missing = await send(method, { id: VALID[method].id, form: VALID[method].form?.() })
        const wrong = await send(method, { auth: "Bearer nope", id: VALID[method].id, form: VALID[method].form?.() })

        expect(missing.status).toBe(401)
        expect(wrong.status).toBe(401)
        expect(fetchMock).not.toHaveBeenCalled()
      }
    )

    it.each(["POST", "GET", "DELETE"] as const)(
      "%s returns 500 when SYNC_SECRET isn't configured on the server",
      async (method) => {
        vi.stubEnv("SYNC_SECRET", "")

        const response = await send(method, { auth: AUTH, id: VALID[method].id, form: VALID[method].form?.() })

        expect(response.status).toBe(500)
        expect(fetchMock).not.toHaveBeenCalled()
      }
    )

    it.each(["POST", "GET", "DELETE"] as const)(
      "%s returns 503 with an explanation when Cloudinary isn't configured",
      async (method) => {
        vi.stubEnv("CLOUDINARY_API_SECRET", "")

        const response = await send(method, { auth: AUTH, id: VALID[method].id, form: VALID[method].form?.() })

        expect(response.status).toBe(503)
        expect(await response.json()).toEqual({ error: "Server chưa cấu hình Cloudinary." })
        expect(fetchMock).not.toHaveBeenCalled()
      }
    )

    it.each([
      ["GET", undefined],
      ["GET", "other/x"],
      ["GET", "life-plan/../x"],
      ["GET", "life-plan/production/abc"],
      ["GET", "life-plan/staging/a1b2c3d4e5f6g7h8i9j0"],
      ["GET", "life-plan/production/A1B2C3D4E5F6G7H8I9J0"],
      ["DELETE", undefined],
      ["DELETE", "other/x"],
      ["DELETE", "life-plan/../x"],
      ["DELETE", "life-plan/production/abc"],
    ] as const)("%s refuses photo id %s with 400, without calling Cloudinary", async (method, id) => {
      const response = await send(method, { auth: AUTH, id })

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe("POST — upload", () => {
    function cloudinaryAcceptsUploads() {
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
        const form = init.body as FormData
        return Response.json(uploadResult(String(form.get("public_id")), String(form.get("asset_folder"))))
      })
    }

    it("refuses a request that carries no photo file", async () => {
      const noBody = await POST(requestWith("POST", { auth: AUTH }))
      const textField = await POST(requestWith("POST", { auth: AUTH, form: formWith("not a file") }))

      expect(noBody.status).toBe(400)
      expect(textField.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("refuses a file that isn't an image", async () => {
      const text = new Blob(["hello"], { type: "text/plain" })

      const response = await POST(requestWith("POST", { auth: AUTH, form: formWith(text) }))

      expect(response.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("refuses a photo larger than 4MB but takes one of exactly 4MB", async () => {
      cloudinaryAcceptsUploads()

      const tooBig = await POST(requestWith("POST", { auth: AUTH, form: formWith(webp(4 * MB + 1)) }))
      expect(tooBig.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()

      const atLimit = await POST(requestWith("POST", { auth: AUTH, form: formWith(webp(4 * MB)) }))
      expect(atLimit.status).toBe(201)
    })

    it("uploads the photo into this deployment's folder and answers 201 with only its id and size", async () => {
      cloudinaryAcceptsUploads()

      const response = await POST(requestWith("POST", { auth: AUTH, form: formWith(webp()) }))

      expect(response.status).toBe(201)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.cloudinary.com/v1_1/demo/image/upload")
      const sentId = (fetchMock.mock.calls[0][1].body as FormData).get("public_id")
      expect(sentId).toMatch(/^life-plan\/production\/[a-z0-9]{20}$/)
      // Kết quả của Cloudinary có link có chữ ký — trình duyệt chỉ được nhận mã ảnh và kích thước.
      expect(await response.json()).toEqual({ id: sentId, bytes: 245000, width: 1600, height: 1200 })
    })

    it("answers 502 with a retry hint when Cloudinary fails", async () => {
      fetchMock.mockResolvedValue(Response.json({ error: { message: "Server error" } }, { status: 500 }))

      const response = await POST(requestWith("POST", { auth: AUTH, form: formWith(webp()) }))

      expect(response.status).toBe(502)
      expect(await response.json()).toEqual({ error: "Không tải được ảnh lên. Vui lòng thử lại." })
    })

    it("logs Cloudinary's own reason on the server when the upload fails, never the API secret", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchMock.mockResolvedValue(Response.json({ error: { message: "Invalid Signature" } }, { status: 401 }))

      await POST(requestWith("POST", { auth: AUTH, form: formWith(webp()) }))

      expect(serverLog(log)).toContain("Invalid Signature")
      expect(serverLog(log)).toContain("401")
      expect(serverLog(log)).not.toContain("abcd")
      log.mockRestore()
    })
  })

  describe("GET — view", () => {
    it("serves the bytes behind the signed link with their content type, never kept in the HTTP cache", async () => {
      const bytes = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])
      fetchMock.mockResolvedValue(new Response(bytes, { status: 200, headers: { "Content-Type": "image/webp" } }))

      const response = await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))

      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toBe("image/webp")
      expect(response.headers.get("cache-control")).toBe("private, no-store")
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes)
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toMatch(SIGNED_PHOTO_URL)
    })

    it("answers 404 when Cloudinary has no such photo", async () => {
      fetchMock.mockResolvedValue(new Response("Resource not found", { status: 404 }))

      const response = await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))

      expect(response.status).toBe(404)
    })

    it("answers 502 when Cloudinary fails or can't be reached", async () => {
      fetchMock.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
      fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

      const refused = await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))
      const unreachable = await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))

      expect(refused.status).toBe(502)
      expect(unreachable.status).toBe(502)
    })

    it("logs on the server why a photo could not be fetched from Cloudinary", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchMock.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }))
      fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

      await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))
      await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))

      expect(log).toHaveBeenCalledTimes(2)
      expect(serverLog(log)).toContain("401")
      expect(serverLog(log)).toContain("fetch failed")
      log.mockRestore()
    })
  })

  describe("DELETE — delete", () => {
    it("deletes the photo on Cloudinary and answers { ok: true }", async () => {
      fetchMock.mockResolvedValue(Response.json({ result: "ok" }))

      const response = await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0][0]).toBe("https://api.cloudinary.com/v1_1/demo/image/destroy")
      expect((fetchMock.mock.calls[0][1].body as FormData).get("public_id")).toBe(PHOTO_ID)
    })

    it("never deletes a photo from another environment's folder, but still serves it", async () => {
      // Máy dev (và preview) dùng chung tài khoản thật: kéo bản đồng bộ production về rồi xoá ghi chép ở đó không được
      // kéo mất ảnh production.
      vi.stubEnv("VERCEL_ENV", "development")

      const refused = await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))

      expect(refused.status).toBe(403)
      expect(await refused.json()).toEqual({ error: "Ảnh thuộc môi trường khác — chỉ xoá được ở nơi đã tải nó lên." })
      expect(fetchMock).not.toHaveBeenCalled()

      fetchMock.mockResolvedValue(Response.json({ result: "ok" }))
      const ownPhoto = await DELETE(
        requestWith("DELETE", { auth: AUTH, id: "life-plan/development/a1b2c3d4e5f6g7h8i9j0" })
      )
      expect(await ownPhoto.json()).toEqual({ ok: true })

      fetchMock.mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }))
      expect((await GET(requestWith("GET", { auth: AUTH, id: PHOTO_ID }))).status).toBe(200)
    })

    it("answers { ok: false } when Cloudinary doesn't delete the photo", async () => {
      fetchMock.mockResolvedValue(Response.json({ error: { message: "Invalid Signature" } }, { status: 401 }))

      const response = await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ ok: false })
    })

    it("answers 502 with { ok: false } when Cloudinary can't be reached", async () => {
      fetchMock.mockRejectedValue(new TypeError("fetch failed"))

      const response = await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))

      expect(response.status).toBe(502)
      expect(await response.json()).toMatchObject({ ok: false })
    })

    it("logs on the server why Cloudinary did not delete a photo", async () => {
      const log = vi.spyOn(console, "error").mockImplementation(() => {})
      fetchMock.mockResolvedValueOnce(Response.json({ error: { message: "Invalid Signature" } }, { status: 401 }))
      fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"))

      await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))
      await DELETE(requestWith("DELETE", { auth: AUTH, id: PHOTO_ID }))

      expect(serverLog(log)).toContain("Invalid Signature")
      expect(serverLog(log)).toContain("fetch failed")
      expect(serverLog(log)).not.toContain("abcd")
      log.mockRestore()
    })
  })
})
