"use client"

import { useEffect } from "react"

import { onDataChanged } from "./data-change-bus"

function readRaw(storageKey: string): string | null {
  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

// Gọi `reload` mỗi khi giá trị thô của `storageKey` trong localStorage thật sự đổi — dù do chính
// tab này ghi (mọi setStored* đều gọi notifyDataChanged) hay tab khác ghi (sự kiện "storage" của
// trình duyệt). So chuỗi thô với lần đọc trước nên 1 lần ghi ở key KHÁC không làm hook này đọc lại
// hay render lại vô ích. `reload` phải ổn định (useCallback/hàm module) và CHỈ ĐỌC — không bao giờ
// ghi storage, nếu không sẽ thành vòng lặp ghi → notify → reload → ghi.
function useStorageSync(storageKey: string, reload: () => void) {
  useEffect(() => {
    let lastRaw = readRaw(storageKey)

    function reloadIfChanged() {
      const raw = readRaw(storageKey)
      if (raw === lastRaw) return
      lastRaw = raw
      reload()
    }

    function handleStorage(event: StorageEvent) {
      // key === null: tab khác vừa gọi localStorage.clear().
      if (event.key === null || event.key === storageKey) reloadIfChanged()
    }

    const unsubscribe = onDataChanged(reloadIfChanged)
    window.addEventListener("storage", handleStorage)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", handleStorage)
    }
  }, [storageKey, reload])
}

export { useStorageSync }
