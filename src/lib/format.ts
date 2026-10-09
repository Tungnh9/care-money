// Tiền VND là đồng nguyên: làm tròn về đồng (vd. 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ), và
// không bao giờ in "-0 ₫" — Math.round(-0,4) = -0, `|| 0` đổi -0 (và NaN) thành 0.
function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫"
}

function groupVN(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString("vi-VN") : ""
}

export { formatMoney, groupVN }
