"use client"

import { useEffect, useState } from "react"

import { onDataChanged } from "@/lib/data-change-bus"
import { measureLocalStorageBytes } from "../storage-usage"

// Số byte localStorage đang dùng (measureLocalStorageBytes) — null lúc SSR, trước khi mount, hay khi trình duyệt
// chặn localStorage. Đo lại sau mỗi lần ghi ở tab này (mọi setStored* đều báo data-change-bus — kể cả nạp bản sao
// hay xoá dữ liệu ngay trên trang Cài đặt) và mỗi lần tab khác ghi (sự kiện "storage"). Không dùng useStorageSync:
// hook đó theo dõi 1 key, còn dung lượng đổi theo mọi key.
function useStorageUsage(): number | null {
  const [bytes, setBytes] = useState<number | null>(null)

  useEffect(() => {
    // localStorage không có lúc SSR, chỉ đo được thật sau khi mount trên client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBytes(measureLocalStorageBytes())

    function remeasure() {
      setBytes(measureLocalStorageBytes())
    }
    const unsubscribe = onDataChanged(remeasure)
    window.addEventListener("storage", remeasure)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", remeasure)
    }
  }, [])

  return bytes
}

export { useStorageUsage }
