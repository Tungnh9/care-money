"use client"

import { useEffect, useState, type RefObject } from "react"

// Tới gần màn hình = cách mép màn hình không quá 1 khoảng này: ảnh bắt đầu tải trước khi cuộn tới, không chớp ô chờ.
const NEAR_MARGIN = "400px 0px"

// true khi phần tử đã tới gần màn hình, và giữ true từ đó (đã tải thì không cần tải lại khi cuộn đi). `enabled` false
// thì luôn true — dùng khi không cần chờ. Trình duyệt không có IntersectionObserver (jsdom) cũng coi như đã thấy.
function useNearViewport(ref: RefObject<Element | null>, enabled: boolean): boolean {
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined")

  useEffect(() => {
    const element = ref.current
    if (!enabled || near || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setNear(true)
        observer.disconnect()
      },
      { rootMargin: NEAR_MARGIN }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, enabled, near])

  return !enabled || near
}

export { useNearViewport }
