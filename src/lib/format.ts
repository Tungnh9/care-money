function formatMoney(n: number, hidden = false): string {
  return hidden ? "•••••••• ₫" : n.toLocaleString("vi-VN") + " ₫"
}

export { formatMoney }
