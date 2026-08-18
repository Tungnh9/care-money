const HIDE_MONEY_STORAGE_KEY = "hide-money"

function getHideMoney(): boolean {
  try {
    return window.localStorage.getItem(HIDE_MONEY_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function setHideMoney(hidden: boolean) {
  window.localStorage.setItem(HIDE_MONEY_STORAGE_KEY, hidden ? "1" : "0")
}

export { getHideMoney, setHideMoney }
