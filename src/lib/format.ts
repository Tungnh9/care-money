// Tiền VND là đồng nguyên: làm tròn về đồng (vd. 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ), và
// không bao giờ in "-0 ₫" — Math.round(-0,4) = -0, `|| 0` đổi -0 (và NaN) thành 0.
function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫"
}

// Bảng dải, xét từ lớn xuống: lấy dải đầu tiên có |số| >= min, value = Math.floor(|số| / step) / divisor
// (cắt xuống bằng phép chia số nguyên, không để toLocaleString làm tròn, không dùng Intl "compact").
// "xu" cho hàng chục nghìn là lựa chọn của chủ repo (cách A, 19/10/2026) — đừng đổi thành "k".
const COMPACT_BANDS = [
  { min: 1_000_000_000, step: 100_000_000, divisor: 10, suffix: " tỷ" },
  { min: 1_000_000, step: 100_000, divisor: 10, suffix: "tr" },
  { min: 100_000, step: 1_000, divisor: 1, suffix: "k" },
  { min: 10_000, step: 1_000, divisor: 1, suffix: "xu" },
  { min: 1_000, step: 100, divisor: 10, suffix: "k" },
]

// Nhãn số dư rút gọn (8k, 50xu, 500k, 1,5tr, 2 tỷ): cắt xuống chứ không làm tròn lên, nên với số dư >= 0
// nhãn không bao giờ hiện nhiều hơn số tiền thật. Dưới 1.000 thì ghi nguyên đồng. `Math.trunc(n) || 0`
// bỏ phần lẻ đồng và đổi -0 (và NaN) thành 0, nên không bao giờ in "-0".
function formatMoneyCompact(n: number, hidden = false): string {
  if (hidden) return "•••"
  const whole = Math.trunc(n) || 0
  const abs = Math.abs(whole)
  const band = COMPACT_BANDS.find((b) => abs >= b.min)
  if (!band) return `${whole}đ`
  const value = Math.floor(abs / band.step) / band.divisor
  const sign = whole < 0 && value > 0 ? "-" : ""
  return sign + value.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + band.suffix
}

function groupVN(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString("vi-VN") : ""
}

// Số tiền dán từ sao kê/hoá đơn có thể kèm phần lẻ: "1.500.000,00" (kiểu Việt) hay "1,500,000.00"
// (kiểu Anh). Dấu "." hay "," CUỐI CÙNG mà theo sau không phải đúng 3 chữ số là dấu thập phân → bỏ
// từ đó trở đi rồi mới lấy chữ số; đúng 3 chữ số thì là dấu ngăn hàng nghìn ("1.500.000", "1,500").
// VND là đồng nguyên nên phần lẻ bị bỏ, không làm tròn.
function pastedMoneyDigits(text: string): string {
  const decimal = /[.,](\d*)\D*$/.exec(text)
  const integerPart = decimal && decimal[1].length !== 3 ? text.slice(0, decimal.index) : text
  return integerPart.replace(/\D/g, "")
}

export { formatMoney, formatMoneyCompact, groupVN, pastedMoneyDigits }
