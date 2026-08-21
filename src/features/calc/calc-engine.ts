/**
 * Logic tính toán của Máy tính — port 1:1 từ thuật toán trong file thiết kế tham khảo
 * (chuỗi biểu thức thô + `Function()` eval), KHÔNG suy diễn thêm.
 *
 * An toàn: `evalExpr` dùng `Function()` để tính biểu thức toán học, nhưng chuỗi đưa vào
 * đã bị lọc sạch chỉ còn các ký tự số và ký hiệu toán học (xem bước loại bỏ ký tự lạ bên dưới)
 * TRƯỚC khi đưa vào `Function()` — không có ký tự chữ, dấu chấm phẩy, hay backtick nào lọt qua
 * để tiêm mã tuỳ ý. Thứ tự các bước biến đổi chuỗi PHẢI giữ đúng như bản gốc — đặc biệt bỏ dấu
 * chấm (hàng nghìn) TRƯỚC khi đổi dấu phẩy (thập phân VN) thành dấu chấm (JS).
 */

/** Làm tròn về đúng 6 chữ số thập phân. */
function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

/** Định dạng kết quả hiển thị: phân tách hàng nghìn kiểu Việt Nam, tối đa 6 chữ số thập phân. */
function formatResult(n: number): string {
  return Number.isFinite(n)
    ? round6(n).toLocaleString("vi-VN", { maximumFractionDigits: 6 })
    : "Sai cú pháp"
}

/**
 * Chuỗi "máy" dùng để nạp lại vào `evalExpr` (vd. sau khi bấm "="), dùng dấu phẩy thập phân,
 * KHÔNG có dấu chấm phân tách hàng nghìn.
 */
function toMachineString(n: number): string {
  return String(round6(n)).replace(".", ",")
}

/**
 * Tính giá trị của chuỗi biểu thức thô (có thể lẫn ×, ÷, −, dấu chấm hàng nghìn, dấu phẩy thập
 * phân VN, ký tự lạ...). Trả `null` khi biểu thức rỗng, sai cú pháp, hoặc kết quả không phải số
 * hữu hạn (vd. chia cho 0) — không throw lỗi riêng cho bất kỳ trường hợp nào.
 */
function evalExpr(raw: string): number | null {
  const clean = String(raw)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9+\-*/().%]/g, "")
    .replace(/(^|[^\d.])0+(\d)/g, "$1$2")

  if (!clean) return null

  try {
    // `clean` ở trên chỉ còn số và ký hiệu toán học (chữ/dấu chấm phẩy/backtick đã bị lọc sạch),
    // không có cách nào tiêm mã tuỳ ý qua Function() ở đây.
    const v: unknown = Function(
      '"use strict";return (' + clean.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)") + ")"
    )()
    return typeof v === "number" && Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Phím "( )" 2-trong-1: trả về ")" nếu số dấu "(" trong `expr` nhiều hơn số dấu ")", ngược lại
 * trả "(" để mở ngoặc mới.
 */
function nextParen(expr: string): "(" | ")" {
  const opens = (expr.match(/\(/g) ?? []).length
  const closes = (expr.match(/\)/g) ?? []).length
  return opens > closes ? ")" : "("
}

export { round6, formatResult, toMachineString, evalExpr, nextParen }
