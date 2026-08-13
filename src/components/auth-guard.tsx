"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { getStoredUser } from "@/lib/auth"

const PUBLIC_PATHS = ["/login"]

interface AuthGuardProps {
  children: React.ReactNode
}

function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Reset trước khi re-check mỗi lần đổi pathname, tránh hiện tạm nội dung
    // cũ (đã checked=true) của route trước trong lúc chờ đánh giá route mới.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecked(false)
    if (PUBLIC_PATHS.includes(pathname)) {
      setChecked(true)
      return
    }
    if (!getStoredUser()) {
      router.replace("/login")
      return
    }
    setChecked(true)
  }, [pathname, router])

  // Không có localStorage lúc SSR/hydrate đầu tiên, nên phải chờ effect chạy
  // trên client mới biết chắc — chấp nhận 1 nhịp trắng trang trước khi hiện
  // nội dung, giống hạn chế đã biết của toàn bộ hệ thống đăng nhập mock này.
  if (!checked) return null

  return <>{children}</>
}

export { AuthGuard }
