import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { clearImageCache, deleteCachedImage, getCachedImage, putCachedImage } from "@/lib/life-plan/image-cache"

const PHOTO_ID = "life-plan/development/abcdefghij0123456789"
const OTHER_ID = "life-plan/development/zyxwvutsrq9876543210"

type Handler = (() => void) | null

// IndexedDB giả trong bộ nhớ, chỉ đủ những gì image-cache dùng: open (kèm upgradeneeded khi database còn mới),
// 1 store khoá ngoài với get/put/delete/clear, transaction báo complete sau khi request của nó xong. Mọi sự kiện
// bắn ở lượt sau như IndexedDB thật.
function installFakeIndexedDB() {
  const stores = new Map<string, Map<string, unknown>>()
  const later = (run: () => void) => setTimeout(run, 0)

  function transaction(storeName: string) {
    const records = stores.get(storeName)
    if (!records) throw new DOMException(`No object store "${storeName}"`, "NotFoundError")
    const tx = {
      oncomplete: null as Handler,
      onerror: null as Handler,
      onabort: null as Handler,
      error: null,
      objectStore: () => store,
    }
    function request(run: () => unknown) {
      const req = { result: undefined as unknown, error: null, onsuccess: null as Handler, onerror: null as Handler }
      later(() => {
        req.result = run()
        req.onsuccess?.()
        tx.oncomplete?.()
      })
      return req
    }
    const store = {
      get: (key: string) => request(() => records.get(key)),
      put: (value: unknown, key: string) =>
        request(() => {
          records.set(key, value)
          return key
        }),
      delete: (key: string) =>
        request(() => {
          records.delete(key)
        }),
      clear: () => request(() => records.clear()),
    }
    return tx
  }

  const db = {
    transaction,
    createObjectStore: (name: string) => stores.set(name, new Map()),
    close: () => {},
  }
  const open = vi.fn(() => {
    const req = {
      result: undefined as unknown,
      error: null,
      onupgradeneeded: null as Handler,
      onsuccess: null as Handler,
      onerror: null as Handler,
    }
    later(() => {
      req.result = db
      if (stores.size === 0) req.onupgradeneeded?.()
      req.onsuccess?.()
    })
    return req
  })
  vi.stubGlobal("indexedDB", { open })
  return { open, stores }
}

async function expectNoCache() {
  await expect(getCachedImage(PHOTO_ID)).resolves.toBeNull()
  await expect(putCachedImage(PHOTO_ID, new Blob(["bytes"]))).resolves.toBeUndefined()
  await expect(deleteCachedImage(PHOTO_ID)).resolves.toBeUndefined()
  await expect(clearImageCache()).resolves.toBeUndefined()
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("image-cache without a usable IndexedDB", () => {
  it("reads nothing and skips writes when the browser has no IndexedDB (jsdom)", async () => {
    expect(typeof indexedDB).toBe("undefined")

    await expectNoCache()
  })

  it("reads nothing and skips writes when opening the database throws", async () => {
    const open = vi.fn(() => {
      throw new DOMException("The user denied permission to access the database.", "SecurityError")
    })
    vi.stubGlobal("indexedDB", { open })

    await expectNoCache()
    expect(open).toHaveBeenCalled()
  })

  it("reads nothing and skips writes when the open request fails", async () => {
    const open = vi.fn(() => {
      const req = {
        error: new DOMException("Internal error opening backing store.", "UnknownError"),
        onerror: null as Handler,
      }
      setTimeout(() => req.onerror?.(), 0)
      return req
    })
    vi.stubGlobal("indexedDB", { open })

    await expectNoCache()
    expect(open).toHaveBeenCalled()
  })
})

describe("image-cache with IndexedDB", () => {
  // Module giữ kết nối đã mở — nạp lại module cho mỗi test để test nào cũng mở database giả của riêng nó.
  beforeEach(() => {
    vi.resetModules()
  })

  it("keeps a photo by its id until it is deleted", async () => {
    installFakeIndexedDB()
    const cache = await import("@/lib/life-plan/image-cache")
    const photo = new Blob(["photo-bytes"], { type: "image/webp" })
    const other = new Blob(["other-bytes"], { type: "image/webp" })

    await expect(cache.getCachedImage(PHOTO_ID)).resolves.toBeNull()
    await cache.putCachedImage(PHOTO_ID, photo)
    await cache.putCachedImage(OTHER_ID, other)
    await expect(cache.getCachedImage(PHOTO_ID)).resolves.toBe(photo)

    await cache.deleteCachedImage(PHOTO_ID)

    await expect(cache.getCachedImage(PHOTO_ID)).resolves.toBeNull()
    await expect(cache.getCachedImage(OTHER_ID)).resolves.toBe(other)
  })

  it("empties every photo when cleared", async () => {
    installFakeIndexedDB()
    const cache = await import("@/lib/life-plan/image-cache")
    await cache.putCachedImage(PHOTO_ID, new Blob(["photo-bytes"]))
    await cache.putCachedImage(OTHER_ID, new Blob(["other-bytes"]))

    await cache.clearImageCache()

    await expect(cache.getCachedImage(PHOTO_ID)).resolves.toBeNull()
    await expect(cache.getCachedImage(OTHER_ID)).resolves.toBeNull()
  })

  it('opens the "life-plan-images" database v1 with an "images" store once, for every call', async () => {
    const { open, stores } = installFakeIndexedDB()
    const cache = await import("@/lib/life-plan/image-cache")

    await cache.putCachedImage(PHOTO_ID, new Blob(["photo-bytes"]))
    await cache.getCachedImage(PHOTO_ID)
    await cache.deleteCachedImage(PHOTO_ID)

    expect(open.mock.calls).toEqual([["life-plan-images", 1]])
    expect([...stores.keys()]).toEqual(["images"])
  })

  it("reads null for a stored value that is not a photo", async () => {
    const { stores } = installFakeIndexedDB()
    const cache = await import("@/lib/life-plan/image-cache")
    await cache.clearImageCache()
    stores.get("images")?.set(PHOTO_ID, "not a photo")

    await expect(cache.getCachedImage(PHOTO_ID)).resolves.toBeNull()
  })
})
