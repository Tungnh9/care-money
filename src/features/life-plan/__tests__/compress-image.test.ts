import { describe, it, expect } from "vitest"

import { fitWithin } from "../compress-image"

// compressImage cần canvas mã hoá ảnh thật (WebP/JPEG) — jsdom không có, nên ở đây chỉ test phần tính kích thước.
// Phần nén chỉ kiểm được trên trình duyệt thật.
describe("fitWithin", () => {
  it("shrinks a landscape photo until its long edge is 1600px, keeping the ratio", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 })
  })

  it("keeps a photo that already fits, never enlarging it", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(1600, 1600)).toEqual({ width: 1600, height: 1600 })
  })

  it("shrinks a portrait photo by its height and rounds the short edge", () => {
    expect(fitWithin(1000, 3000)).toEqual({ width: 533, height: 1600 })
  })

  it("takes another limit for the long edge", () => {
    expect(fitWithin(4000, 3000, 400)).toEqual({ width: 400, height: 300 })
  })

  it("never rounds the short edge of a very long, thin image down to 0", () => {
    expect(fitWithin(10000, 2)).toEqual({ width: 1600, height: 1 })
  })
})
