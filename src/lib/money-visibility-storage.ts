const HIDE_MONEY_STORAGE_KEY = "hide-money"

function getHideMoney(): boolean {
  try {
    return window.localStorage.getItem(HIDE_MONEY_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function setHideMoney(hidden: boolean) {
  try {
    window.localStorage.setItem(HIDE_MONEY_STORAGE_KEY, hidden ? "1" : "0")
  } catch {
    // Bộ nhớ đầy hoặc bị chặn: chỉ mất việc nhớ lựa chọn cho lần tải sau — nút vẫn ẩn/hiện được ngay.
  }
}

export { getHideMoney, setHideMoney }
