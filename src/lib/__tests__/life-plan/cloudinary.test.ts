// @vitest-environment node
// Module chỉ chạy trên server (route handler) — test trong môi trường Node để FormData/Blob/Response là bản
// thật của Node như lúc chạy, không phải bản của jsdom.
import { createHash } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  cloudinaryConfig,
  destroyOnCloudinary,
  lifePlanImageFolder,
  signApiParams,
  signedDeliveryUrl,
  uploadToCloudinary,
  type CloudinaryConfig,
} from "@/lib/life-plan/cloudinary"

const CONFIG: CloudinaryConfig = { cloudName: "demo", apiKey: "123456789012345", apiSecret: "abcd" }
const PHOTO_ID = "life-plan/production/a1b2c3d4e5f6g7h8i9j0"

// 2026-10-30T00:00:00Z — Cloudinary nhận timestamp tính bằng giây.
const NOW_MS = 1_793_318_400_000
const TIMESTAMP = "1793318400"

// SHA-1 hex tính thẳng bằng node:crypto trên chuỗi viết tay — chữ ký mong đợi không đi qua signApiParams.
function sha1Hex(text: string): string {
  return createHash("sha1").update(text).digest("hex")
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

describe("signApiParams", () => {
  it("matches the signature in Cloudinary's documented example, whatever the key order", () => {
    const signature = "bfd09f95f331f558cbd1320e67aa8d488770583e"

    expect(
      signApiParams(
        { eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510 },
        "abcd"
      )
    ).toBe(signature)
    expect(
      signApiParams(
        { timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" },
        "abcd"
      )
    ).toBe(signature)
  })
})

describe("cloudinaryConfig", () => {
  const FULL_ENV = {
    CLOUDINARY_CLOUD_NAME: "demo",
    CLOUDINARY_API_KEY: "123456789012345",
    CLOUDINARY_API_SECRET: "abcd",
  }

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("reads the cloud name, API key and API secret", () => {
    expect(cloudinaryConfig(FULL_ENV)).toEqual(CONFIG)
  })

  it.each(["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"])(
    "returns null when %s is missing or empty",
    (name) => {
      expect(cloudinaryConfig({ ...FULL_ENV, [name]: undefined })).toBeNull()
      expect(cloudinaryConfig({ ...FULL_ENV, [name]: "" })).toBeNull()
    }
  )

  it("reads process.env when no environment is given", () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo")
    vi.stubEnv("CLOUDINARY_API_KEY", "123456789012345")
    vi.stubEnv("CLOUDINARY_API_SECRET", "abcd")
    expect(cloudinaryConfig()).toEqual(CONFIG)

    vi.stubEnv("CLOUDINARY_API_KEY", undefined)
    expect(cloudinaryConfig()).toBeNull()
  })
})

describe("lifePlanImageFolder", () => {
  it("files photos taken on the production deployment under life-plan/production", () => {
    expect(lifePlanImageFolder({ VERCEL_ENV: "production" })).toBe("life-plan/production")
  })

  it("files photos from every other environment under life-plan/development", () => {
    expect(lifePlanImageFolder({})).toBe("life-plan/development")
    expect(lifePlanImageFolder({ VERCEL_ENV: "preview" })).toBe("life-plan/development")
  })
})

describe("signedDeliveryUrl", () => {
  it("reproduces the signed URL of Cloudinary's 'Generating delivery URL signatures' example", () => {
    // Tài liệu ký đúng phần link đứng sau chữ ký (ở ví dụ là transformation + public_id) — đưa cả phần đó vào
    // chỗ public_id thì link phải ra y hệt link trong tài liệu.
    expect(signedDeliveryUrl("c_fill,w_300,h_250/e_grayscale/sample-authenticated.png", CONFIG)).toBe(
      "https://res.cloudinary.com/demo/image/authenticated/s--iDy_JeBq--/c_fill,w_300,h_250/e_grayscale/sample-authenticated.png"
    )
  })

  it("links a life plan photo as an authenticated image behind an 8-character URL-safe signature", () => {
    expect(signedDeliveryUrl(PHOTO_ID, CONFIG)).toMatch(
      /^https:\/\/res\.cloudinary\.com\/demo\/image\/authenticated\/s--[A-Za-z0-9_-]{8}--\/life-plan\/production\/a1b2c3d4e5f6g7h8i9j0$/
    )
  })
})

describe("calls to the Cloudinary API", () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    fetchMock.mockReset()
  })

  function sentForm(call: number): FormData {
    return fetchMock.mock.calls[call][1].body as FormData
  }

  describe("uploadToCloudinary", () => {
    beforeEach(() => {
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
        const form = init.body as FormData
        return Response.json(uploadResult(String(form.get("public_id")), String(form.get("asset_folder"))))
      })
    })

    it("posts an authenticated photo under a server-made id, signing exactly asset_folder, public_id, timestamp, type", async () => {
      const file = new Blob(["fake-webp-bytes"], { type: "image/webp" })

      const image = await uploadToCloudinary(file, "life-plan/development", CONFIG)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload")
      expect(init.method).toBe("POST")

      const form = sentForm(0)
      expect([...form.keys()].sort()).toEqual([
        "api_key",
        "asset_folder",
        "file",
        "public_id",
        "signature",
        "timestamp",
        "type",
      ])
      const publicId = form.get("public_id")
      expect(publicId).toMatch(/^life-plan\/development\/[a-z0-9]{20}$/)
      expect(form.get("asset_folder")).toBe("life-plan/development")
      expect(form.get("type")).toBe("authenticated")
      expect(form.get("timestamp")).toBe(TIMESTAMP)
      expect(form.get("api_key")).toBe("123456789012345")
      expect(await (form.get("file") as Blob).text()).toBe("fake-webp-bytes")
      expect(form.get("signature")).toBe(
        sha1Hex(
          `asset_folder=life-plan/development&public_id=${publicId}&timestamp=${TIMESTAMP}&type=authenticatedabcd`
        )
      )

      // Chỉ giữ mã ảnh và kích thước — link có chữ ký trong kết quả của Cloudinary không đi theo.
      expect(image).toEqual({ id: publicId, bytes: 245000, width: 1600, height: 1200 })
    })

    it("gives every upload its own id, so no photo overwrites another", async () => {
      const file = new Blob(["fake-webp-bytes"], { type: "image/webp" })

      await uploadToCloudinary(file, "life-plan/production", CONFIG)
      await uploadToCloudinary(file, "life-plan/production", CONFIG)

      const first = sentForm(0).get("public_id")
      const second = sentForm(1).get("public_id")
      expect(first).toMatch(/^life-plan\/production\/[a-z0-9]{20}$/)
      expect(second).toMatch(/^life-plan\/production\/[a-z0-9]{20}$/)
      expect(first).not.toBe(second)
    })

    it("rejects when Cloudinary refuses the upload", async () => {
      fetchMock.mockResolvedValue(Response.json({ error: { message: "Invalid Signature" } }, { status: 401 }))

      await expect(
        uploadToCloudinary(new Blob(["x"], { type: "image/webp" }), "life-plan/production", CONFIG)
      ).rejects.toThrow()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe("destroyOnCloudinary", () => {
    it("deletes the authenticated photo, signing exactly public_id, timestamp and type", async () => {
      fetchMock.mockResolvedValue(Response.json({ result: "ok" }))

      expect(await destroyOnCloudinary(PHOTO_ID, CONFIG)).toBe(true)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/destroy")
      expect(init.method).toBe("POST")

      const form = sentForm(0)
      expect([...form.keys()].sort()).toEqual(["api_key", "public_id", "signature", "timestamp", "type"])
      expect(form.get("public_id")).toBe(PHOTO_ID)
      expect(form.get("type")).toBe("authenticated")
      expect(form.get("timestamp")).toBe(TIMESTAMP)
      expect(form.get("api_key")).toBe("123456789012345")
      expect(form.get("signature")).toBe(sha1Hex(`public_id=${PHOTO_ID}&timestamp=${TIMESTAMP}&type=authenticatedabcd`))
    })

    it("counts a photo Cloudinary no longer has as deleted", async () => {
      fetchMock.mockResolvedValue(Response.json({ result: "not found" }))

      expect(await destroyOnCloudinary(PHOTO_ID, CONFIG)).toBe(true)
    })

    it("reports false when Cloudinary refuses to delete", async () => {
      fetchMock.mockResolvedValue(Response.json({ error: { message: "Invalid Signature" } }, { status: 401 }))

      expect(await destroyOnCloudinary(PHOTO_ID, CONFIG)).toBe(false)
    })
  })
})
