function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : n.toLocaleString("vi-VN") + " ₫"
}

function groupVN(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString("vi-VN") : ""
}

export { formatMoney, groupVN }
