function formatMoney(n: number): string {
  return n.toLocaleString("vi-VN") + " ₫"
}

export { formatMoney }
