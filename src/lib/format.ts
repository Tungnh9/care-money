// Tiền VND là đồng nguyên: làm tròn về đồng (vd. 2,5 phân × 8.123.457 đ/phân = 20.308.642,5 đ), và
// không bao giờ in "-0 ₫" — Math.round(-0,4) = -0, `|| 0` đổi -0 (và NaN) thành 0.
function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : (Math.round(n) || 0).toLocaleString("vi-VN") + " ₫"
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

export { formatMoney, groupVN, pastedMoneyDigits }
