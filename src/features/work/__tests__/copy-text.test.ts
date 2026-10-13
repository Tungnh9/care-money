import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { toast } from "sonner"

import { copyText } from "../copy-text"

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe("copyText", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("writes the text to the clipboard, toasts and returns true", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { clipboard: { writeText } })

    await expect(copyText("Standup")).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith("Standup")
    expect(toast.success).toHaveBeenCalledWith("Đã copy")
  })

  it("returns false with an error toast when the browser refuses (no permission, insecure page)", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } })

    await expect(copyText("Standup")).resolves.toBe(false)
    expect(toast.error).toHaveBeenCalledWith("Không copy được. Hãy bôi đen rồi copy tay.")
  })

  it("returns false when there is no clipboard API at all", async () => {
    vi.stubGlobal("navigator", {})

    await expect(copyText("Standup")).resolves.toBe(false)
  })
})
