import DOMPurify from "dompurify"

// Đúng tập thẻ mà toolbar của JournalEditor có thể tạo ra, cộng các thẻ cấu trúc
// contentEditable tự chèn khi xuống dòng (div/br). Không cho phép attribute nào cả
// (kể cả style/class) để chặn hẳn các vector XSS qua attribute (onerror, style, ...).
const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "h3", "ul", "ol", "li", "blockquote", "div", "br", "p"]

// ALLOWED_ATTR: [] một mình không chặn hết attribute — DOMPurify có 2 cờ riêng
// ALLOW_DATA_ATTR/ALLOW_ARIA_ATTR mặc định true, kiểm tra độc lập với ALLOWED_ATTR,
// nên data-*/aria-* vẫn lọt qua nếu không tắt tường minh 2 cờ này.
function sanitizeJournalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
}

// Thẻ khối — trên màn hình mỗi thẻ là 1 dòng riêng, nên ranh giới của chúng thành 1 lần xuống dòng.
const BLOCK_TAGS = new Set(["DIV", "P", "LI", "H3", "BLOCKQUOTE", "UL", "OL"])

function collectText(node: Node, parts: string[]) {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      // Gộp khoảng trắng thường như trình duyệt vẫn làm khi hiển thị HTML; &nbsp; (U+00A0) không bị gộp.
      parts.push((child.textContent ?? "").replace(/[ \t\n\r]+/g, " "))
    } else if (child.nodeName === "BR") {
      parts.push("\n")
    } else {
      const isBlock = BLOCK_TAGS.has(child.nodeName)
      if (isBlock) parts.push("\n")
      collectText(child, parts)
      if (isBlock) parts.push("\n")
    }
  })
}

// Chữ thuần cho bản xem trước. DOMPurify trả chuỗi HTML đã escape (còn &amp;/&lt;/&nbsp;, các dòng dính
// liền) nên không dùng được làm chữ — lấy cây DOM đã lọc (RETURN_DOM: nằm trong document riêng của
// DOMPurify, không gắn vào trang, không chạy script) rồi đọc text node, vốn đã giải mã entity sẵn.
// Kết quả CHỈ được render như text con của React (tự escape), không bao giờ qua innerHTML.
function stripHtmlToPlainText(html: string): string {
  const root = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM: true,
  })
  if (!root) return ""
  const parts: string[] = []
  collectText(root, parts)
  return parts
    .join("")
    .replace(/ /g, " ") // &nbsp; → dấu cách thường
    .replace(/ *\n[\n ]*/g, "\n") // dòng trống và dấu cách quanh chỗ xuống dòng → đúng 1 "\n"
    .trim()
}

export { sanitizeJournalHtml, stripHtmlToPlainText }
