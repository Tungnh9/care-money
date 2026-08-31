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

function stripHtmlToPlainText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  })
}

export { sanitizeJournalHtml, stripHtmlToPlainText }
