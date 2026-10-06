import { describe, it, expect } from "vitest"

import { sanitizeJournalHtml, stripHtmlToPlainText } from "../journal-html"

describe("sanitizeJournalHtml", () => {
  it("keeps tags produced by the editor toolbar (bold/italic/underline/heading/list/quote)", () => {
    const html =
      '<b>đậm</b> <i>nghiêng</i> <u>gạch chân</u><h3>tiêu đề</h3><ul><li>mục 1</li></ul><blockquote>trích</blockquote>'

    expect(sanitizeJournalHtml(html)).toBe(html)
  })

  it("strips script tags entirely, including their content", () => {
    const html = "<b>an toàn</b><script>alert(1)</script>"

    expect(sanitizeJournalHtml(html)).toBe("<b>an toàn</b>")
  })

  it("strips event-handler attributes like onerror, even on a disallowed tag", () => {
    const html = '<b>an toàn</b><img src=x onerror="alert(1)">'

    const result = sanitizeJournalHtml(html)
    expect(result).not.toContain("onerror")
    expect(result).not.toContain("<img")
  })

  it("strips every attribute from allowed tags, including style", () => {
    const html = '<div style="color:red" onclick="alert(1)" class="x">nội dung</div>'

    const result = sanitizeJournalHtml(html)
    expect(result).toBe("<div>nội dung</div>")
  })

  it("strips data-* and aria-* attributes too, not just event handlers and style", () => {
    const html = '<div data-x="1" aria-label="y">nội dung</div>'

    const result = sanitizeJournalHtml(html)
    expect(result).toBe("<div>nội dung</div>")
  })

  it("removes foreign-content elements (svg/style) and their content entirely", () => {
    const html = "<svg><style>*{}</style><img src=x onerror=alert(1)></svg>"

    expect(sanitizeJournalHtml(html)).toBe("")
  })
})

describe("stripHtmlToPlainText", () => {
  it("strips all tags but keeps their text content", () => {
    expect(stripHtmlToPlainText("<b>Hôm nay</b> mình đã <i>đi bộ</i>")).toBe("Hôm nay mình đã đi bộ")
  })

  it("removes script tags and their content entirely, not just the tags", () => {
    expect(stripHtmlToPlainText("<b>an toàn</b><script>alert(1)</script>")).toBe("an toàn")
  })

  it("returns plain text unchanged when there is no markup", () => {
    expect(stripHtmlToPlainText("chỉ chữ thường")).toBe("chỉ chữ thường")
  })

  it("puts each block (div/p/li/h3/blockquote) on its own line instead of running lines together", () => {
    expect(stripHtmlToPlainText("Dòng một<div>Dòng hai</div>")).toBe("Dòng một\nDòng hai")
    expect(stripHtmlToPlainText("<ul><li>một</li><li>hai</li></ul>")).toBe("một\nhai")
    expect(stripHtmlToPlainText("<h3>Tiêu đề</h3><p>Đoạn</p><blockquote>Trích</blockquote>")).toBe(
      "Tiêu đề\nĐoạn\nTrích"
    )
  })

  it("turns <br> into a line break", () => {
    expect(stripHtmlToPlainText("Dòng một<br>Dòng hai")).toBe("Dòng một\nDòng hai")
  })

  it("collapses blank lines and the spaces around a line break into a single line break", () => {
    // Chrome ghi 1 dòng trống thành <div><br></div>.
    expect(stripHtmlToPlainText("Dòng một <div><br></div><div> Dòng ba</div>")).toBe("Dòng một\nDòng ba")
  })

  it("decodes HTML entities instead of showing them literally", () => {
    expect(stripHtmlToPlainText("Tom &amp; Jerry, 3 &lt; 5")).toBe("Tom & Jerry, 3 < 5")
    expect(stripHtmlToPlainText("a&nbsp;&nbsp;b")).toBe("a  b")
  })

  it("returns an escaped tag as literal text, never as markup", () => {
    expect(stripHtmlToPlainText("&lt;b&gt;đậm&lt;/b&gt;")).toBe("<b>đậm</b>")
  })
})
